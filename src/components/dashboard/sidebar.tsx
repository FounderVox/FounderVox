'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import {
  Home,
  Mic,
  FolderOpen,
  Star,
  Clock,
  FileText,
  Settings,
  Sparkles,
  ChevronDown,
  Mail,
  MessageSquare,
  Target,
  Users,
  Lightbulb,
  BookOpen,
  FileEdit,
  Zap,
} from 'lucide-react'

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
]

const noteCategories = [
  { label: 'All Notes', href: '/dashboard/notes', icon: FolderOpen, count: 0 },
  { label: 'Starred', href: '/dashboard/starred', icon: Star },
  { label: 'Recent', href: '/dashboard/recent', icon: Clock },
]

const templates = [
  { label: 'Investor Update', icon: Mail, id: 'investor' },
  { label: 'User Interview', icon: MessageSquare, id: 'interview' },
  { label: 'Pitch Practice', icon: Target, id: 'pitch' },
  { label: 'Meeting Notes', icon: Users, id: 'meeting' },
  { label: 'Product Ideas', icon: Lightbulb, id: 'ideas' },
  { label: 'Brain Dump', icon: Zap, id: 'braindump' },
  { label: 'Email Draft', icon: FileEdit, id: 'email' },
  { label: 'Team Standup', icon: Users, id: 'standup' },
]

interface SidebarProps {
  notesCount?: number
}

export function Sidebar({ notesCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const [templatesOpen, setTemplatesOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <Logo size="sm" variant="light" />
      </div>

      {/* New Recording CTA */}
      <div className="p-4">
        <Button
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
          size="lg"
        >
          <Mic className="h-4 w-4 mr-2" />
          New Recording
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {/* Main Nav */}
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-500/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          )
        })}

        {/* Divider */}
        <div className="h-px bg-white/5 my-3" />

        {/* My Notes Section */}
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400"
        >
          <span className="flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5" />
            My Notes
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', notesOpen && 'rotate-180')} />
        </button>

        {notesOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 pl-2"
          >
            {noteCategories.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-violet-500/20 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.count !== undefined && (
                      <span className="text-xs text-gray-500">
                        {item.label === 'All Notes' ? notesCount : item.count}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </motion.div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/5 my-3" />

        {/* Templates Section */}
        <button
          onClick={() => setTemplatesOpen(!templatesOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400"
        >
          <span className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Templates
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', templatesOpen && 'rotate-180')} />
        </button>

        {templatesOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 pl-2"
          >
            {templates.map((template) => {
              const Icon = template.icon
              return (
                <button
                  key={template.id}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Icon className="h-4 w-4" />
                  {template.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link href="/dashboard/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </div>
        </Link>
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors">
          <Sparkles className="h-4 w-4" />
          Upgrade to Pro
        </button>
      </div>
    </aside>
  )
}
