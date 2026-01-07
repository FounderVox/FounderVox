'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Target,
  Users,
  Lightbulb,
  Zap,
  FileEdit,
} from 'lucide-react'

// Create context to share collapsed state
export const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

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
  const { isCollapsed, setIsCollapsed } = useSidebar()

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  return (
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="fixed left-0 top-0 bottom-0 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col z-[100] shadow-sm overflow-hidden"
        style={{ height: '100vh' }}
      >
        {/* Logo & Collapse Toggle */}
        <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
          {isCollapsed ? (
            <div
              onClick={toggleCollapse}
              className="h-8 w-8 rounded-lg bg-black flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              title="Expand sidebar"
            >
              <Mic className="h-4 w-4 text-white" />
            </div>
          ) : (
            <>
              <Logo size="sm" />
              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* New Recording CTA */}
        <div className={cn('p-4', isCollapsed && 'px-2')}>
          <Button
            className={cn(
              'bg-black hover:bg-gray-900 text-white shadow-lg',
              isCollapsed ? 'w-full p-2' : 'w-full'
            )}
            size={isCollapsed ? 'icon' : 'lg'}
            title={isCollapsed ? 'New Recording' : undefined}
          >
            <Mic className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            {!isCollapsed && 'New Recording'}
          </Button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 py-2 space-y-1 overflow-hidden', isCollapsed ? 'px-2' : 'px-3')}>
          {/* Main Nav */}
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} title={isCollapsed ? item.label : undefined}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-black text-white'
                      : 'text-black hover:bg-black hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && item.label}
                </div>
              </Link>
            )
          })}

          {/* Divider */}
          <div className="h-px bg-gray-200/50 my-3" />

          {/* My Notes Section */}
          {!isCollapsed ? (
            <>
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-black hover:text-white rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5" />
                  My Notes
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', notesOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
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
                                ? 'bg-black text-white'
                                : 'text-black hover:bg-black hover:text-white'
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
              </AnimatePresence>
            </>
          ) : (
            // Collapsed version - just icons
            <div className="space-y-1">
              {noteCategories.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} title={item.label}>
                    <div
                      className={cn(
                        'flex items-center justify-center p-2.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-black text-white'
                          : 'text-black hover:bg-black hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-200/50 my-3" />

          {/* Templates Section */}
          {!isCollapsed ? (
            <>
              <button
                onClick={() => setTemplatesOpen(!templatesOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-black hover:text-white rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Templates
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', templatesOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
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
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-black hover:bg-black hover:text-white transition-colors text-left"
                        >
                          <Icon className="h-4 w-4" />
                          {template.label}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            // Collapsed version - just template icon
            <div className="flex justify-center">
              <button
                className="p-2.5 rounded-lg text-black hover:bg-black hover:text-white transition-colors"
                title="Templates"
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className={cn('border-t border-gray-200/50 space-y-1', isCollapsed ? 'p-2' : 'p-3')}>
          <Link href="/dashboard/settings" title={isCollapsed ? 'Settings' : undefined}>
            <div className={cn(
              'flex items-center gap-3 rounded-lg text-sm text-black hover:bg-black hover:text-white transition-colors',
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
            )}>
              <Settings className="h-4 w-4" />
              {!isCollapsed && 'Settings'}
            </div>
          </Link>
          <button
            className={cn(
              'flex items-center gap-3 w-full rounded-lg text-sm text-black hover:bg-black hover:text-white transition-colors',
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
            )}
            title={isCollapsed ? 'Upgrade to Pro' : undefined}
          >
            <Sparkles className="h-4 w-4" />
            {!isCollapsed && 'Upgrade to Pro'}
          </button>
        </div>
      </motion.aside>
  )
}
