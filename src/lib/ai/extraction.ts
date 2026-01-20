import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

interface ActionItem {
  task: string
  assignee: string | null
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
}

interface InvestorUpdate {
  wins: string[]
  metrics: Record<string, any>
  challenges: string[]
  asks: string[]
  draft_subject: string
  draft_body: string
}

interface BrainDumpItem {
  content: string
  category: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
  participants: string[]
}

/**
 * Validate that transcript contains meaningful content worth extracting.
 * Returns false for empty, gibberish, or too-short transcripts.
 */
function isTranscriptMeaningful(transcript: string): boolean {
  if (!transcript) return false
  // Remove non-alphabetic characters and extra whitespace
  const cleaned = transcript.replace(/[^a-z\s]/gi, ' ').trim()
  // Split into words with at least 3 characters
  const words = cleaned.split(/\s+/).filter(w => w.length > 2)
  // Require at least 10 meaningful words
  return words.length >= 10
}

export async function extractActionItems(transcript: string, recordingId: string, userId: string): Promise<void> {
  // Validate transcript has meaningful content
  if (!isTranscriptMeaningful(transcript)) {
    console.log('[Extraction] Transcript has no meaningful content, skipping action items extraction')
    return
  }

  const prompt = `Analyze this transcript and extract ALL action items, tasks, and todos.

CRITICAL RULES:
1. ONLY extract what is EXPLICITLY stated in the transcript
2. If content is unclear or gibberish, return EMPTY arrays
3. NEVER fabricate, infer, or hallucinate content
4. When in doubt, return empty results

For each action item, identify:
1. The task description (be specific and clear)
2. Who is responsible (look for patterns like "@Name", "Name needs to", "Name should", or "I need to")
3. Any deadline mentioned (dates, "by Friday", "end of week", "ASAP", etc.)
4. Priority level based on language:
   - HIGH: Contains "urgent", "ASAP", "critical", "immediately", "top priority"
   - MEDIUM: Contains "important", "should", "need to"
   - LOW: Contains "maybe", "consider", "when possible", "eventually"

Return a JSON object with an "action_items" array. If no action items found, return empty array.

Transcript:
${transcript}

Return format (must be valid JSON object):
{
  "action_items": [
    {
      "task": "Complete the quarterly report",
      "assignee": "Sarah",
      "deadline": "Friday",
      "priority": "high"
    }
  ]
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You ONLY extract information EXPLICITLY stated. NEVER fabricate content. Return empty results if unsure. Return only valid JSON in the exact format specified.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.log('[Extraction] No content in response for action items')
      return
    }

    console.log('[Extraction] Raw action items response:', content)

    const parsed = JSON.parse(content)
    const actionItems: ActionItem[] = parsed.action_items || []

    console.log('[Extraction] Parsed action items:', actionItems.length)

    if (actionItems.length === 0) {
      console.log('[Extraction] No action items found in transcript')
      return
    }

    // Save to database
    const supabase = await createClient()
    const itemsToInsert = actionItems.map(item => ({
      recording_id: recordingId,
      user_id: userId,
      task: item.task || 'Untitled task',
      assignee: item.assignee || null,
      deadline: item.deadline ? (isNaN(Date.parse(item.deadline)) ? null : new Date(item.deadline).toISOString()) : null,
      priority: (item.priority || 'medium').toLowerCase() as 'high' | 'medium' | 'low',
      status: 'open' as const
    }))

    console.log('[Extraction] Inserting action items:', itemsToInsert.length)

    const { data, error } = await supabase.from('action_items').insert(itemsToInsert).select()
    if (error) {
      console.error('[Extraction] Error saving action items:', error)
      throw error
    } else {
      console.log(`[Extraction] Successfully saved ${actionItems.length} action items to database:`, data?.map(i => i.id))
    }
  } catch (error) {
    console.error('[Extraction] Action items error:', error)
    throw error
  }
}

export async function extractInvestorUpdate(transcript: string, recordingId: string, userId: string): Promise<void> {
  // Validate transcript has meaningful content
  if (!isTranscriptMeaningful(transcript)) {
    console.log('[Extraction] Transcript has no meaningful content, skipping investor update extraction')
    return
  }

  const prompt = `Analyze this transcript and extract information suitable for an investor update email.

CRITICAL RULES:
1. ONLY extract what is EXPLICITLY stated in the transcript
2. If content is unclear or gibberish, return EMPTY arrays/objects
3. NEVER fabricate, infer, or hallucinate content
4. When in doubt, return empty results
5. Do NOT generate an email draft if there is no meaningful content

Extract:
1. WINS: Positive achievements, milestones, successes, good news
2. METRICS: Numbers, KPIs, growth figures, user counts, revenue, etc.
3. CHALLENGES: Problems, obstacles, concerns, what's not going well
4. ASKS: What help is needed, introductions requested, advice sought

Then draft a professional investor update email with:
- A compelling subject line
- Well-structured email body with clear sections
- Professional yet personal tone
- Specific and concrete information

Transcript:
${transcript}

Return format:
{
  "wins": ["Launched new feature X", "Signed deal with Company Y"],
  "metrics": {"users": 1000, "revenue": "$50k MRR", "growth": "20% WoW"},
  "challenges": ["Hiring is taking longer than expected"],
  "asks": ["Introduction to VP of Sales at TechCorp"],
  "draft_subject": "November Update: Strong Growth + New Partnership",
  "draft_body": "Hi team,\\n\\nHere's what's new..."
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You ONLY extract information EXPLICITLY stated. NEVER fabricate content. Return empty results if unsure. Be concise, specific, and professional. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return

    const update: InvestorUpdate = JSON.parse(content)

    // Check if there's actually meaningful content before saving
    const hasContent =
      (update.wins?.length > 0) ||
      (Object.keys(update.metrics || {}).length > 0) ||
      (update.challenges?.length > 0) ||
      (update.asks?.length > 0)

    if (!hasContent) {
      console.log('[Extraction] No investor update content found, skipping')
      return
    }

    // Save to database
    const supabase = await createClient()
    const { data, error } = await supabase.from('investor_updates').insert({
      recording_id: recordingId,
      user_id: userId,
      draft_subject: update.draft_subject,
      draft_body: update.draft_body,
      wins: update.wins,
      metrics: update.metrics,
      challenges: update.challenges,
      asks: update.asks,
      status: 'draft'
    }).select()

    if (error) {
      console.error('[Extraction] Error saving investor update:', error)
    } else {
      console.log('[Extraction] Saved investor update to database:', data?.[0]?.id)
    }
  } catch (error) {
    console.error('[Extraction] Investor update error:', error)
  }
}

export async function extractBrainDump(transcript: string, recordingId: string, userId: string): Promise<void> {
  // Validate transcript has meaningful content
  if (!isTranscriptMeaningful(transcript)) {
    console.log('[Extraction] Transcript has no meaningful content, skipping brain dump extraction')
    return
  }

  const prompt = `Analyze this transcript and extract all relevant notes, discussions, and key information.

CRITICAL RULES:
1. ONLY extract what is EXPLICITLY stated in the transcript
2. If content is unclear or gibberish, return EMPTY arrays
3. NEVER fabricate, infer, or hallucinate content
4. When in doubt, return empty results

Categorize each item into ONE of these functional categories:
1. MEETING: Discussions with others, conversations (include participant names if mentioned)
2. BLOCKER: Obstacles, risks, issues blocking progress, concerns that need addressing
3. DECISION: Decisions that were made or need to be made, choices and their rationale
4. QUESTION: Questions to research, ask others, or investigate further
5. FOLLOWUP: Action items, things to follow up on, reminders, next steps

For meetings, identify participant names when possible.
Be specific and actionable in your extractions.

Transcript:
${transcript}

Return format:
{
  "items": [
    {
      "content": "Discussed Q4 roadmap with Sarah and Mike - agreed on 3 main priorities",
      "category": "meeting",
      "participants": ["Sarah", "Mike"]
    },
    {
      "content": "Decided to use AWS instead of GCP for the new infrastructure",
      "category": "decision",
      "participants": []
    },
    {
      "content": "API rate limits are blocking the integration work",
      "category": "blocker",
      "participants": []
    },
    {
      "content": "Need to research competitor pricing models before next meeting",
      "category": "question",
      "participants": []
    },
    {
      "content": "Follow up with legal team about the contract terms",
      "category": "followup",
      "participants": []
    }
  ]
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You ONLY extract information EXPLICITLY stated. NEVER fabricate content. Return empty results if unsure. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return

    const parsed = JSON.parse(content)
    const items: BrainDumpItem[] = parsed.items || []

    if (items.length === 0) return

    // Save to database
    const supabase = await createClient()
    const itemsToInsert = items.map(item => ({
      recording_id: recordingId,
      user_id: userId,
      content: item.content,
      category: item.category,
      participants: item.participants || []
    }))

    const { data, error } = await supabase.from('brain_dump').insert(itemsToInsert).select()
    if (error) {
      console.error('[Extraction] Error saving brain dump items:', error)
    } else {
      console.log(`[Extraction] Saved ${items.length} brain dump items to database:`, data?.map(i => i.id))
    }
  } catch (error) {
    console.error('[Extraction] Brain dump error:', error)
  }
}
