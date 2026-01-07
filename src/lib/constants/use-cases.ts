import {
  Mail,
  FileText,
  BarChart3,
  Lightbulb,
  BookOpen,
  Users,
  Target,
  GraduationCap,
  LucideIcon
} from 'lucide-react'

export type UseCase = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  badge?: 'new' | 'founder'
  templates: string[]
}

export const USE_CASES: UseCase[] = [
  {
    id: 'emails',
    title: 'Emails & Communication',
    description: 'Professional emails, quick replies, newsletters',
    icon: Mail,
    templates: ['Professional emails', 'Quick replies', 'Newsletters'],
  },
  {
    id: 'content',
    title: 'Content Creation',
    description: 'Blog posts, social media, scripts, articles',
    icon: FileText,
    templates: ['Blog posts', 'Social media', 'Scripts', 'Articles'],
  },
  {
    id: 'productivity',
    title: 'Work & Productivity',
    description: 'Meeting notes, to-do lists, project plans, reports',
    icon: BarChart3,
    templates: ['Meeting notes', 'To-do lists', 'Project plans', 'Reports'],
  },
  {
    id: 'ideas',
    title: 'Ideas & Brainstorming',
    description: 'Quick capture, structured notes, creative thinking',
    icon: Lightbulb,
    templates: ['Quick capture', 'Structured notes', 'Creative thinking'],
  },
  {
    id: 'personal',
    title: 'Personal & Journaling',
    description: 'Daily journal, gratitude logs, reflections',
    icon: BookOpen,
    templates: ['Daily journal', 'Gratitude logs', 'Reflections'],
  },
  {
    id: 'team',
    title: 'Team Collaboration',
    description: 'Shared notes, action items, decision logs',
    icon: Users,
    badge: 'new',
    templates: ['Shared notes', 'Action items', 'Decision logs'],
  },
  {
    id: 'founder',
    title: 'Founder Mode',
    description: 'Investor updates, pitch notes, product ideas, user research',
    icon: Target,
    badge: 'founder',
    templates: ['Investor updates', 'Pitch notes', 'Product ideas', 'User research'],
  },
  {
    id: 'learning',
    title: 'Learning & Research',
    description: 'Lecture notes, research summaries, study guides',
    icon: GraduationCap,
    templates: ['Lecture notes', 'Research summaries', 'Study guides'],
  },
]
