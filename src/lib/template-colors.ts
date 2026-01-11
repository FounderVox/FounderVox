// Template color configuration for visual hierarchy
// Each template type has a distinct color for left border accent and icons

export interface TemplateColor {
  name: string
  bg: string
  border: string
  borderLeft: string
  icon: string
  value: string
}

export const templateColors: Record<string, TemplateColor> = {
  action_items: {
    name: 'Action Items',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    borderLeft: 'border-l-blue-500',
    icon: 'text-blue-600',
    value: 'action_items'
  },
  brain_dump: {
    name: 'Brain Dump',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    borderLeft: 'border-l-purple-500',
    icon: 'text-purple-600',
    value: 'brain_dump'
  },
  progress_log: {
    name: 'Progress Log',
    bg: 'bg-green-50',
    border: 'border-green-200',
    borderLeft: 'border-l-green-500',
    icon: 'text-green-600',
    value: 'progress_log'
  },
  investor_update: {
    name: 'Investor Update',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    borderLeft: 'border-l-amber-500',
    icon: 'text-amber-600',
    value: 'investor_update'
  },
  product_ideas: {
    name: 'Product Ideas',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    borderLeft: 'border-l-pink-500',
    icon: 'text-pink-600',
    value: 'product_ideas'
  },
  recording: {
    name: 'Recording',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    borderLeft: 'border-l-gray-400',
    icon: 'text-gray-600',
    value: 'recording'
  },
  default: {
    name: 'Note',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    borderLeft: 'border-l-gray-300',
    icon: 'text-gray-500',
    value: 'default'
  }
}

// Helper function to get template color config
export const getTemplateColor = (templateType: string | null | undefined): TemplateColor => {
  if (!templateType) return templateColors.default
  const normalized = templateType.toLowerCase().replace(/\s+/g, '_')
  return templateColors[normalized] || templateColors.default
}

// Get template color for sidebar icons based on template id
export const getTemplateIconColor = (templateId: string): string => {
  return templateColors[templateId]?.icon || templateColors.default.icon
}
