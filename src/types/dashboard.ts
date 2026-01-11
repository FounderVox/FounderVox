// Shared types for Dashboard components

export interface ActionItem {
  id: string
  task: string
  assignee: string | null
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'done'
  created_at: string
  completed_at: string | null
  recording_id: string
}

export interface BrainDumpItem {
  id: string
  content: string
  category: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
  participants: string[] | null
  created_at: string
  recording_id: string
}

export type FocusItemType = 'action' | 'brain_dump'

export interface TodaysFocusStats {
  totalItems: number
  highPriority: number
  overdue: number
  actionItems: number
  brainDumpItems: number
}

// Helper to check if a date is today
export function isToday(dateString: string | null): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// Helper to check if a date is overdue
export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < today
}

// Helper to format deadline for display
export function formatDeadline(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  if (date < today) return 'Overdue'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Custom event types for cross-page sync
export type ActionItemEventType = 'actionItemCompleted' | 'actionItemUpdated' | 'actionItemDeleted'

export interface ActionItemEventDetail {
  itemId: string
  status?: 'open' | 'in_progress' | 'done'
  updates?: Partial<ActionItem>
}

export function dispatchActionItemEvent(type: ActionItemEventType, detail: ActionItemEventDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(type, { detail }))
  }
}
