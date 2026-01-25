import OpenAI from 'openai'
import { createServiceRoleClient } from '@/lib/supabase/server'

// =============================================================================
// SMARTIFY EXTRACTION MODULE - Production Grade
// =============================================================================
// This module handles AI-powered extraction of structured data from transcripts.
// Each extraction type (action items, investor updates, brain dump) has its own
// focused GPT call with production-grade prompts and guardrails.
// =============================================================================

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

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ActionItem {
  task: string
  assignee: string | null
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
}

interface InvestorUpdate {
  wins: string[]
  metrics: Record<string, string | number>
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

interface ExtractionResult {
  success: boolean
  count: number
  error?: string
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates transcript has enough meaningful content to process.
 * More lenient than before - we trust GPT to handle edge cases.
 */
function validateTranscript(transcript: string): { valid: boolean; reason?: string } {
  if (!transcript || typeof transcript !== 'string') {
    return { valid: false, reason: 'No transcript provided' }
  }

  const trimmed = transcript.trim()
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Transcript is empty' }
  }

  // Very minimal check - just need SOME content
  // Let GPT decide if there's anything meaningful to extract
  if (trimmed.length < 20) {
    return { valid: false, reason: 'Transcript too short (minimum 20 characters)' }
  }

  return { valid: true }
}

/**
 * Normalize task text for duplicate comparison.
 */
function normalizeTask(task: string): string {
  return task
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Parse deadline string into ISO date format.
 * Returns null if parsing fails or date is invalid.
 */
function parseDeadline(deadline: string | null): string | null {
  if (!deadline) return null

  try {
    // Handle relative dates
    const lower = deadline.toLowerCase().trim()
    const now = new Date()

    if (lower === 'today') {
      return now.toISOString()
    }
    if (lower === 'tomorrow') {
      now.setDate(now.getDate() + 1)
      return now.toISOString()
    }
    if (lower.includes('end of week') || lower === 'friday' || lower === 'eow') {
      const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7
      now.setDate(now.getDate() + daysUntilFriday)
      return now.toISOString()
    }
    if (lower.includes('next week')) {
      now.setDate(now.getDate() + 7)
      return now.toISOString()
    }
    if (lower === 'asap' || lower === 'urgent' || lower === 'immediately') {
      return now.toISOString() // Due today
    }

    // Try parsing as date
    const parsed = new Date(deadline)
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2020) {
      return parsed.toISOString()
    }

    return null
  } catch {
    return null
  }
}

// =============================================================================
// ACTION ITEMS EXTRACTION
// =============================================================================

const ACTION_ITEMS_SYSTEM_PROMPT = `You are an expert assistant that extracts action items from voice note transcripts.

CRITICAL GUARDRAILS (MUST FOLLOW):
1. ONLY extract what is EXPLICITLY stated in the transcript
2. NEVER fabricate, infer, or hallucinate content that isn't there
3. If the transcript is unclear, gibberish, or nonsensical - return EMPTY array
4. When in doubt, DO NOT extract - return empty results
5. Quality over quantity - only extract clear, real tasks

YOUR ROLE:
- Extract clear, actionable tasks from the transcript
- Identify who is responsible (if mentioned)
- Capture deadlines (if mentioned)
- Assess priority based on language cues

EXTRACTION RULES:
1. A task must be EXPLICITLY stated (e.g., "I need to...", "We should...", "Remember to...")
2. A task must be actionable (something someone can DO)
3. If someone is assigned something - that's a task
4. Do NOT create tasks from general discussion or opinions

PRIORITY GUIDELINES:
- HIGH: Words like "urgent", "ASAP", "critical", "immediately", "top priority", "must", "deadline"
- MEDIUM: Words like "important", "should", "need to", "soon", "this week"
- LOW: Words like "eventually", "when possible", "nice to have", "consider", "maybe"
- Default to MEDIUM if unclear

ASSIGNEE DETECTION:
- Look for patterns like "@Name", "Name will...", "Name needs to...", "assign to Name"
- "I need to..." means the speaker (use null for assignee - it's self-assigned)
- If no assignee mentioned, use null

OUTPUT FORMAT:
Return a JSON object with an "action_items" array. Each item has:
- task: Clear description of what needs to be done (string, required)
- assignee: Person responsible or null (string or null)
- deadline: When it's due or null (string or null)
- priority: "high", "medium", or "low" (string, required)

If NO action items found, return: {"action_items": []}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation.`

const ACTION_ITEMS_USER_PROMPT = (transcript: string) => `Extract action items from this transcript:

---
${transcript}
---

Return JSON with format:
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

export async function extractActionItems(
  transcript: string,
  recordingId: string,
  userId: string
): Promise<ExtractionResult> {
  const logPrefix = '[Smartify:ActionItems]'

  // Validate input
  const validation = validateTranscript(transcript)
  if (!validation.valid) {
    console.log(`${logPrefix} Skipping - ${validation.reason}`)
    return { success: true, count: 0 }
  }

  console.log(`${logPrefix} Starting extraction for recording: ${recordingId}`)

  try {
    // Call GPT-4o for extraction
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: ACTION_ITEMS_SYSTEM_PROMPT },
        { role: 'user', content: ACTION_ITEMS_USER_PROMPT(transcript) }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 2000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.log(`${logPrefix} No response content from GPT`)
      return { success: true, count: 0 }
    }

    console.log(`${logPrefix} Raw GPT response:`, content.substring(0, 500))

    // Parse response
    let parsed: { action_items: ActionItem[] }
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error(`${logPrefix} Failed to parse GPT response:`, parseError)
      return { success: false, count: 0, error: 'Failed to parse AI response' }
    }

    const actionItems = parsed.action_items || []
    console.log(`${logPrefix} Extracted ${actionItems.length} action items`)

    if (actionItems.length === 0) {
      return { success: true, count: 0 }
    }

    // Get Supabase client (service role for reliable inserts)
    const supabase = createServiceRoleClient()

    // Check for duplicates
    const { data: existingItems, error: fetchError } = await supabase
      .from('action_items')
      .select('task')
      .eq('user_id', userId)
      .eq('status', 'open')

    if (fetchError) {
      console.error(`${logPrefix} Error fetching existing items:`, fetchError)
      // Continue anyway - better to have duplicates than missing items
    }

    const existingTasks = new Set(
      (existingItems || []).map(item => normalizeTask(item.task))
    )

    // Filter duplicates and prepare for insert
    const newItems = actionItems
      .filter(item => {
        if (!item.task || typeof item.task !== 'string') return false
        const normalized = normalizeTask(item.task)
        if (existingTasks.has(normalized)) {
          console.log(`${logPrefix} Skipping duplicate: "${item.task.substring(0, 50)}..."`)
          return false
        }
        return true
      })
      .map(item => ({
        recording_id: recordingId,
        user_id: userId,
        task: item.task.trim(),
        assignee: item.assignee?.trim() || null,
        deadline: parseDeadline(item.deadline),
        priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        status: 'open' as const
      }))

    if (newItems.length === 0) {
      console.log(`${logPrefix} All items were duplicates, nothing to insert`)
      return { success: true, count: 0 }
    }

    console.log(`${logPrefix} Inserting ${newItems.length} new action items`)

    // Insert into database
    const { data, error: insertError } = await supabase
      .from('action_items')
      .insert(newItems)
      .select('id')

    if (insertError) {
      console.error(`${logPrefix} Database insert error:`, insertError)
      return { success: false, count: 0, error: `Database error: ${insertError.message}` }
    }

    console.log(`${logPrefix} Successfully inserted ${data?.length || 0} action items`)
    return { success: true, count: data?.length || 0 }

  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// =============================================================================
// INVESTOR UPDATE EXTRACTION
// =============================================================================

const INVESTOR_UPDATE_SYSTEM_PROMPT = `You are an expert assistant that helps founders draft investor updates from their voice notes.

CRITICAL GUARDRAILS (MUST FOLLOW):
1. ONLY extract what is EXPLICITLY stated in the transcript
2. NEVER fabricate, infer, or hallucinate content that isn't there
3. If the transcript is unclear, gibberish, or nonsensical - return EMPTY arrays/strings
4. When in doubt, DO NOT include - leave that section empty
5. Do NOT invent metrics, wins, or challenges that weren't mentioned

YOUR ROLE:
- Extract key information suitable for an investor update email
- Organize into: Wins, Metrics, Challenges, Asks
- Draft a professional but warm investor email

EXTRACTION CATEGORIES:

WINS (achievements, good news):
- Product launches, feature releases
- Customer wins, partnerships signed
- Team hires, funding milestones
- Growth achievements, records broken
- Positive feedback or press

METRICS (numbers and KPIs):
- Revenue, MRR, ARR
- User counts, growth rates
- Conversion rates, retention
- Team size, runway
- Any quantifiable data

CHALLENGES (problems, blockers):
- Technical difficulties
- Hiring challenges
- Market headwinds
- Resource constraints
- Delays or setbacks

ASKS (help needed):
- Introductions requested
- Advice sought
- Expertise needed
- Hiring help
- Customer intros

EMAIL DRAFTING GUIDELINES:
- Subject: Catchy but professional (e.g., "March Update: 40% MRR Growth + Series A Planning")
- Tone: Confident, transparent, founder-to-investor
- Structure: Brief greeting, highlights, then details
- Length: Concise but substantive
- Always end with clear asks if any

IF NO INVESTOR-RELEVANT CONTENT:
Return empty arrays and empty strings. Don't fabricate content.

OUTPUT FORMAT:
Return a JSON object with:
{
  "wins": ["Achievement 1", "Achievement 2"],
  "metrics": {"mrr": "$50k", "users": 1000, "growth": "20% MoM"},
  "challenges": ["Challenge 1"],
  "asks": ["Looking for intro to X"],
  "draft_subject": "Email subject line",
  "draft_body": "Full email body with proper formatting"
}

IMPORTANT: Return ONLY valid JSON. No markdown code blocks.`

const INVESTOR_UPDATE_USER_PROMPT = (transcript: string) => `Extract investor update content from this transcript:

---
${transcript}
---

Return JSON with investor update data. If no relevant content, return empty arrays/strings.`

export async function extractInvestorUpdate(
  transcript: string,
  recordingId: string,
  userId: string
): Promise<ExtractionResult> {
  const logPrefix = '[Smartify:InvestorUpdate]'

  // Validate input
  const validation = validateTranscript(transcript)
  if (!validation.valid) {
    console.log(`${logPrefix} Skipping - ${validation.reason}`)
    return { success: true, count: 0 }
  }

  console.log(`${logPrefix} Starting extraction for recording: ${recordingId}`)

  try {
    // Call GPT-4o for extraction
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: INVESTOR_UPDATE_SYSTEM_PROMPT },
        { role: 'user', content: INVESTOR_UPDATE_USER_PROMPT(transcript) }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
      max_tokens: 3000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.log(`${logPrefix} No response content from GPT`)
      return { success: true, count: 0 }
    }

    console.log(`${logPrefix} Raw GPT response:`, content.substring(0, 500))

    // Parse response
    let update: InvestorUpdate
    try {
      update = JSON.parse(content)
    } catch (parseError) {
      console.error(`${logPrefix} Failed to parse GPT response:`, parseError)
      return { success: false, count: 0, error: 'Failed to parse AI response' }
    }

    // Check if there's meaningful content
    const hasContent =
      (update.wins?.length > 0) ||
      (update.metrics && Object.keys(update.metrics).length > 0) ||
      (update.challenges?.length > 0) ||
      (update.asks?.length > 0)

    if (!hasContent) {
      console.log(`${logPrefix} No investor-relevant content found`)
      return { success: true, count: 0 }
    }

    // Get Supabase client (service role for reliable inserts)
    const supabase = createServiceRoleClient()

    console.log(`${logPrefix} Inserting investor update`)

    // Insert into database
    const { data, error: insertError } = await supabase
      .from('investor_updates')
      .insert({
        recording_id: recordingId,
        user_id: userId,
        draft_subject: update.draft_subject || 'Investor Update',
        draft_body: update.draft_body || '',
        wins: update.wins || [],
        metrics: update.metrics || {},
        challenges: update.challenges || [],
        asks: update.asks || [],
        status: 'draft'
      })
      .select('id')

    if (insertError) {
      console.error(`${logPrefix} Database insert error:`, insertError)
      return { success: false, count: 0, error: `Database error: ${insertError.message}` }
    }

    console.log(`${logPrefix} Successfully inserted investor update:`, data?.[0]?.id)
    return { success: true, count: 1 }

  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// =============================================================================
// BRAIN DUMP EXTRACTION
// =============================================================================

const BRAIN_DUMP_SYSTEM_PROMPT = `You are an assistant that organizes raw brain-dump notes from voice transcripts into predefined categories.

CRITICAL RULES:
1. ONLY extract what is EXPLICITLY stated in the transcript
2. NEVER fabricate, infer, or hallucinate content that isn't there
3. If the transcript is unclear, gibberish, or nonsensical - return EMPTY array
4. When uncertain about an item, DO NOT extract it
5. Place each item into the SINGLE most appropriate category
6. You may summarize or clean up wording, but NEVER alter specific details (dates, times, names, numbers, amounts)

CATEGORY DEFINITIONS (use exactly these values):

"meeting" - Discussions, conversations, sync-ups
  MUST contain one or more of: participant names, meeting topics, discussion points, agendas, outcomes, or scheduled times
  Examples: "Synced with Sarah about Q4 roadmap", "Team standup - discussed launch blockers"
  NOT for: General thoughts that don't involve other people

"blocker" - Obstacles, issues, problems
  MUST describe something that is actively blocking or hindering progress
  Examples: "API rate limits preventing Stripe integration", "Waiting on legal approval before launch"
  NOT for: General concerns or things that might become problems

"decision" - Choices made or pending
  MUST be a clear decision that was made OR a decision that explicitly needs to be made
  Examples: "Decided to use AWS instead of GCP", "Need to choose between React and Vue by Friday"
  NOT for: Options being casually mentioned, opinions, or preferences

"question" - Things to research or ask
  MUST be a clear question or something explicitly marked for investigation
  Examples: "Research competitor pricing models", "Ask Mike about the deployment process"
  NOT for: Rhetorical questions or general wondering

"followup" - Action items and reminders
  MUST describe a specific action to be taken or a reminder for later
  Examples: "Follow up with investor next Tuesday", "Remember to send the proposal"
  NOT for: Vague intentions, ideas, or general thoughts

CONTENT GUIDELINES:
1. Each item should be a single, coherent thought
2. Preserve all specific details: dates, times, names, numbers, amounts
3. You may clean up filler words and improve clarity
4. For meetings, always extract participant names into the participants array
5. Combine closely related points into single items when appropriate
6. Skip generic filler, greetings, or meaningless fragments

OUTPUT FORMAT:
Return a JSON object with an "items" array:
{
  "items": [
    {
      "content": "Discussed Q4 roadmap with Sarah and Mike - agreed to prioritize mobile app",
      "category": "meeting",
      "participants": ["Sarah", "Mike"]
    },
    {
      "content": "API rate limits blocking Stripe integration",
      "category": "blocker",
      "participants": []
    }
  ]
}

If NO extractable content, return: {"items": []}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation.`

const BRAIN_DUMP_USER_PROMPT = (transcript: string) => `Extract and categorize thoughts from this transcript:

---
${transcript}
---

Return JSON with categorized items. If no meaningful content, return empty array.`

export async function extractBrainDump(
  transcript: string,
  recordingId: string,
  userId: string
): Promise<ExtractionResult> {
  const logPrefix = '[Smartify:BrainDump]'

  // Validate input
  const validation = validateTranscript(transcript)
  if (!validation.valid) {
    console.log(`${logPrefix} Skipping - ${validation.reason}`)
    return { success: true, count: 0 }
  }

  console.log(`${logPrefix} Starting extraction for recording: ${recordingId}`)

  try {
    // Call GPT-4o for extraction
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: BRAIN_DUMP_SYSTEM_PROMPT },
        { role: 'user', content: BRAIN_DUMP_USER_PROMPT(transcript) }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
      max_tokens: 3000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.log(`${logPrefix} No response content from GPT`)
      return { success: true, count: 0 }
    }

    console.log(`${logPrefix} Raw GPT response:`, content.substring(0, 500))

    // Parse response
    let parsed: { items: BrainDumpItem[] }
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error(`${logPrefix} Failed to parse GPT response:`, parseError)
      return { success: false, count: 0, error: 'Failed to parse AI response' }
    }

    const items = parsed.items || []
    console.log(`${logPrefix} Extracted ${items.length} brain dump items`)

    if (items.length === 0) {
      return { success: true, count: 0 }
    }

    // Validate and prepare items
    const validCategories = ['meeting', 'blocker', 'decision', 'question', 'followup']
    const validItems = items
      .filter(item => {
        if (!item.content || typeof item.content !== 'string') return false
        if (item.content.trim().length < 5) return false
        return true
      })
      .map(item => ({
        recording_id: recordingId,
        user_id: userId,
        content: item.content.trim(),
        category: validCategories.includes(item.category) ? item.category : 'followup',
        participants: Array.isArray(item.participants) ? item.participants : []
      }))

    if (validItems.length === 0) {
      console.log(`${logPrefix} No valid items after filtering`)
      return { success: true, count: 0 }
    }

    // Get Supabase client (service role for reliable inserts)
    const supabase = createServiceRoleClient()

    console.log(`${logPrefix} Inserting ${validItems.length} brain dump items`)

    // Insert into database
    const { data, error: insertError } = await supabase
      .from('brain_dump')
      .insert(validItems)
      .select('id')

    if (insertError) {
      console.error(`${logPrefix} Database insert error:`, insertError)
      return { success: false, count: 0, error: `Database error: ${insertError.message}` }
    }

    console.log(`${logPrefix} Successfully inserted ${data?.length || 0} brain dump items`)
    return { success: true, count: data?.length || 0 }

  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// =============================================================================
// PREVIEW EXTRACTION (for Smartify modal)
// =============================================================================

const PREVIEW_SYSTEM_PROMPT = `You are an assistant that analyzes transcripts to estimate what structured data can be extracted.

CRITICAL GUARDRAILS:
1. ONLY count items that are EXPLICITLY stated in the transcript
2. If the transcript is unclear or gibberish, return all zeros
3. Do NOT over-estimate - be conservative
4. When in doubt, count lower rather than higher

Analyze the transcript and count:
1. ACTION ITEMS: Tasks, todos, things someone explicitly said they need to do
2. INVESTOR UPDATE: Is there REAL investor-relevant content? (1 or 0)
3. BRAIN DUMP: Distinct, meaningful thoughts or notes (not filler words)

Return JSON: {"actionItems": N, "investorUpdates": N, "brainDump": N}`

export async function extractPreviewCounts(transcript: string): Promise<{
  actionItems: number
  investorUpdates: number
  brainDump: number
}> {
  const logPrefix = '[Smartify:Preview]'

  const validation = validateTranscript(transcript)
  if (!validation.valid) {
    return { actionItems: 0, investorUpdates: 0, brainDump: 0 }
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: PREVIEW_SYSTEM_PROMPT },
        { role: 'user', content: `Analyze and count extractable items:\n\n${transcript.substring(0, 4000)}` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 200
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { actionItems: 0, investorUpdates: 0, brainDump: 0 }
    }

    const parsed = JSON.parse(content)
    return {
      actionItems: Math.max(0, parseInt(parsed.actionItems) || 0),
      investorUpdates: Math.max(0, Math.min(1, parseInt(parsed.investorUpdates) || 0)),
      brainDump: Math.max(0, parseInt(parsed.brainDump) || 0)
    }
  } catch (error) {
    console.error(`${logPrefix} Error:`, error)
    return { actionItems: 0, investorUpdates: 0, brainDump: 0 }
  }
}
