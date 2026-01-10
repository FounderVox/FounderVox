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

interface ProgressLog {
  completed: string[]
  in_progress: string[]
  blocked: string[]
}

interface ProductIdea {
  idea: string
  category: 'feature' | 'improvement' | 'integration' | 'pivot' | 'experiment' | 'new_product'
  priority: 'high' | 'medium' | 'low'
  context: string
}

interface BrainDumpItem {
  content: string
  category: 'meeting' | 'thought' | 'question' | 'concern' | 'personal'
  participants: string[]
}

export async function extractActionItems(transcript: string, recordingId: string, userId: string): Promise<void> {
  const prompt = `Analyze this transcript and extract ALL action items, tasks, and todos.

For each action item, identify:
1. The task description (be specific and clear)
2. Who is responsible (look for patterns like "@Name", "Name needs to", "Name should", or "I need to")
3. Any deadline mentioned (dates, "by Friday", "end of week", "ASAP", etc.)
4. Priority level based on language:
   - HIGH: Contains "urgent", "ASAP", "critical", "immediately", "top priority"
   - MEDIUM: Contains "important", "should", "need to"
   - LOW: Contains "maybe", "consider", "when possible", "eventually"

Return a JSON array of action items. If no action items found, return empty array.

Transcript:
${transcript}

Return format:
[
  {
    "task": "Complete the quarterly report",
    "assignee": "Sarah",
    "deadline": "Friday",
    "priority": "high"
  }
]`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert at extracting action items from meeting transcripts. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return

    const parsed = JSON.parse(content)
    const actionItems: ActionItem[] = Array.isArray(parsed.action_items) ? parsed.action_items : (Array.isArray(parsed) ? parsed : [])

    if (actionItems.length === 0) return

    // Save to database
    const supabase = await createClient()
    const itemsToInsert = actionItems.map(item => ({
      recording_id: recordingId,
      task: item.task,
      assignee: item.assignee,
      deadline: item.deadline ? new Date(item.deadline).toISOString() : null,
      priority: item.priority,
      status: 'open' as const
    }))

    const { data, error } = await supabase.from('action_items').insert(itemsToInsert).select()
    if (error) {
      console.error('[Extraction] Error saving action items:', error)
    } else {
      console.log(`[Extraction] Saved ${actionItems.length} action items to database:`, data?.map(i => i.id))
    }
  } catch (error) {
    console.error('[Extraction] Action items error:', error)
  }
}

export async function extractInvestorUpdate(transcript: string, recordingId: string, userId: string): Promise<void> {
  const prompt = `Analyze this transcript and extract information suitable for an investor update email.

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
        { role: 'system', content: 'You are an expert at creating investor updates. Be concise, specific, and professional. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return

    const update: InvestorUpdate = JSON.parse(content)

    // Save to database
    const supabase = await createClient()
    const { data, error } = await supabase.from('investor_updates').insert({
      recording_id: recordingId,
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

export async function extractProgressLog(transcript: string, recordingId: string, userId: string): Promise<void> {
  const prompt = `Analyze this transcript and extract progress updates categorized into three groups:

1. COMPLETED: Tasks finished, shipped features, done items (past tense: "shipped", "finished", "completed", "done")
2. IN PROGRESS: Current work, ongoing tasks (present: "working on", "building", "currently")
3. BLOCKED: Stuck items, waiting on something, obstacles (words: "blocked", "stuck", "waiting for", "can't proceed")

Be specific about what was accomplished, what's being worked on, and what's blocking progress.

Transcript:
${transcript}

Return format:
{
  "completed": ["Shipped the new dashboard", "Fixed the login bug"],
  "in_progress": ["Building the analytics feature", "Refactoring the API"],
  "blocked": ["Waiting on design mockups for checkout flow"]
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert at extracting progress updates from conversations. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return

    const progress: ProgressLog = JSON.parse(content)

    // Get current week's Monday date
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)

    // Save to database
    const supabase = await createClient()
    const { data, error } = await supabase.from('progress_logs').insert({
      recording_id: recordingId,
      week_of: monday.toISOString().split('T')[0],
      completed: progress.completed,
      in_progress: progress.in_progress,
      blocked: progress.blocked
    }).select()

    if (error) {
      console.error('[Extraction] Error saving progress log:', error)
    } else {
      console.log('[Extraction] Saved progress log to database:', data?.[0]?.id)
    }
  } catch (error) {
    console.error('[Extraction] Progress log error:', error)
  }
}

export async function extractProductIdeas(transcript: string, recordingId: string, userId: string): Promise<void> {
  const prompt = `Analyze this transcript and extract ALL product ideas, feature requests, and improvement suggestions.

For each idea, identify:
1. The idea itself (be specific and actionable)
2. Category:
   - feature: Brand new feature or capability
   - improvement: Enhancement to existing feature
   - integration: Third-party integration or API
   - pivot: Major strategic change
   - experiment: Something to test or try
   - new_product: Entirely new product line
3. Priority based on language:
   - HIGH: "Must have", "critical", "urgent", "customers are asking for this"
   - MEDIUM: "Would be nice", "should add", "important"
   - LOW: "Maybe", "someday", "nice to have"
4. Context: Why this idea came up, the problem it solves

Transcript:
${transcript}

Return format:
{
  "ideas": [
    {
      "idea": "Add dark mode to the dashboard",
      "category": "feature",
      "priority": "medium",
      "context": "Multiple users have requested this for late-night work sessions"
    }
  ]
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert product manager at extracting and categorizing product ideas. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return

    const parsed = JSON.parse(content)
    const ideas: ProductIdea[] = parsed.ideas || []

    if (ideas.length === 0) return

    // Save to database
    const supabase = await createClient()
    const ideasToInsert = ideas.map(idea => ({
      recording_id: recordingId,
      idea: idea.idea,
      category: idea.category,
      priority: idea.priority,
      context: idea.context,
      status: 'idea' as const,
      votes: 0
    }))

    const { data, error } = await supabase.from('product_ideas').insert(ideasToInsert).select()
    if (error) {
      console.error('[Extraction] Error saving product ideas:', error)
    } else {
      console.log(`[Extraction] Saved ${ideas.length} product ideas to database:`, data?.map(i => i.id))
    }
  } catch (error) {
    console.error('[Extraction] Product ideas error:', error)
  }
}

export async function extractBrainDump(transcript: string, recordingId: string, userId: string): Promise<void> {
  const prompt = `Analyze this transcript and extract all unstructured notes, thoughts, and discussions.

Categorize each item as:
1. MEETING: Discussion with others (detect participant names if mentioned)
2. THOUGHT: Random ideas, observations, reflections
3. QUESTION: Questions that came up, things to research
4. CONCERN: Worries, risks, things to watch out for
5. PERSONAL: Personal notes, reminders, non-work items

For meetings, try to identify participant names.

Transcript:
${transcript}

Return format:
{
  "items": [
    {
      "content": "Discussed Q4 roadmap with Sarah and Mike",
      "category": "meeting",
      "participants": ["Sarah", "Mike"]
    },
    {
      "content": "Need to research competitor pricing models",
      "category": "question",
      "participants": []
    }
  ]
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert at organizing unstructured notes and thoughts. Return only valid JSON.' },
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
