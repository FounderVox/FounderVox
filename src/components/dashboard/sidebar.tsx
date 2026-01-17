'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Lightbulb,
  Zap,
  CheckSquare,
  TrendingUp,
} from 'lucide-react'
import { getTemplateIconColor } from '@/lib/template-colors'

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
  { label: 'Ask', href: '/dashboard/ask', icon: Sparkles },
]

const noteCategories = [
  { label: 'All Notes', href: '/dashboard/notes', icon: FolderOpen, count: 0 },
  { label: 'Starred', href: '/dashboard/starred', icon: Star },
  { label: 'Recent', href: '/dashboard/recent', icon: Clock },
]

const templates = [
  { label: 'Action Items', icon: CheckSquare, id: 'action_items', href: '/dashboard/action-items' },
  { label: 'Investor Update', icon: Mail, id: 'investor_update', href: '/dashboard/investor-update' },
  // Hidden for now - uncomment to restore
  // { label: 'Progress Log', icon: TrendingUp, id: 'progress_log', href: '/dashboard/progress-log' },
  // { label: 'Product Ideas', icon: Lightbulb, id: 'product_ideas', href: '/dashboard/product-ideas' },
  { label: 'Brain Dump', icon: Zap, id: 'brain_dump', href: '/dashboard/brain-dump' },
]

interface SidebarProps {
  notesCount?: number
  starredCount?: number
}

export function Sidebar({ notesCount = 0, starredCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [templatesOpen, setTemplatesOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)
  const { isCollapsed, setIsCollapsed } = useSidebar()

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  // Calculate widths: 20% reduction from original, collapsed gets additional 15% reduction
  const expandedWidth = 256 * 0.8 // 204.8px, rounded to 205px
  const collapsedWidth = 72 * 0.85 // 61.2px, rounded to 61px
  
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth

  return (
      <motion.aside
        initial={false}
        animate={{ width: currentWidth }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          "fixed left-0 top-0 bottom-0 bg-surface-sunken border-r border-gray-200 flex flex-col z-[200] shadow-sm",
          isCollapsed && "overflow-visible"
        )}
        style={{ height: '100vh' }}
      >
        {/* Logo & Collapse Toggle */}
        <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
          {isCollapsed ? (
            <div
              onClick={toggleCollapse}
              className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#BD6750' }}
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

        {/* Navigation */}
        <nav className={cn('flex-1 py-2 space-y-1', isCollapsed ? 'px-2' : 'px-3 overflow-y-auto')}>
          {/* Main Nav */}
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (isCollapsed) {
                    e.preventDefault()
                    setIsCollapsed(false)
                    setTimeout(() => {
                      router.push(item.href)
                    }, 200)
                  }
                }}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isCollapsed ? 'justify-center p-2.5 relative group' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && item.label}
                  {/* Hover tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[300] transition-all duration-200 shadow-lg">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-900 border-b-[6px] border-b-transparent"></div>
                    </div>
                  )}
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
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
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
                              'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200',
                              isActive
                                ? 'bg-brand text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </span>
                            {(item.label === 'All Notes' || item.label === 'Starred') && (
                              <span className="text-xs text-gray-500">
                                {item.label === 'All Notes' ? notesCount : starredCount}
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
            // Collapsed version - just icons with tooltips
            <div className="space-y-1">
              {noteCategories.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        'flex items-center justify-center p-2.5 rounded-lg text-sm transition-all duration-200 relative group',
                        isActive
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {/* Hover tooltip */}
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[300] transition-all duration-200 shadow-lg">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-900 border-b-[6px] border-b-transparent"></div>
                      </div>
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
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
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
                      const isActive = pathname === template.href
                      return (
                        <Link
                          key={template.id}
                          href={template.href}
                        >
                          <div
                            className={cn(
                              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200',
                              isActive
                                ? 'bg-brand text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                            )}
                          >
                            <Icon className={cn("h-4 w-4", !isActive && getTemplateIconColor(template.id))} />
                            {template.label}
                          </div>
                        </Link>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            // Collapsed version - show all template icons
            <div className="space-y-1">
              {templates.map((template) => {
                const Icon = template.icon
                const isActive = pathname === template.href
                return (
                  <Link
                    key={template.id}
                    href={template.href}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 relative group',
                        isActive
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                      )}
                    >
                      <Icon className={cn("h-4 w-4", !isActive && getTemplateIconColor(template.id))} />
                      {/* Hover tooltip */}
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[300] transition-all duration-200 shadow-lg">
                        {template.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-900 border-b-[6px] border-b-transparent"></div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className={cn('border-t border-gray-200 space-y-1', isCollapsed ? 'p-2' : 'p-3')}>
          <Link href="/dashboard/settings">
            <div className={cn(
              'flex items-center gap-3 rounded-lg text-sm text-gray-700 hover:bg-gray-200 hover:shadow-sm transition-all duration-200',
              isCollapsed ? 'justify-center p-2.5 relative group' : 'px-3 py-2.5'
            )}>
              <Settings className="h-4 w-4" />
              {!isCollapsed && 'Settings'}
              {/* Hover tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[300] transition-all duration-200 shadow-lg">
                  Settings
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-900 border-b-[6px] border-b-transparent"></div>
                </div>
              )}
            </div>
          </Link>
          <button
            className={cn(
              'flex items-center gap-3 w-full rounded-lg text-sm text-brand hover:bg-brand-light transition-all duration-200',
              isCollapsed ? 'justify-center p-2.5 relative group' : 'px-3 py-2.5'
            )}
          >
            <Sparkles className="h-4 w-4" />
            {!isCollapsed && 'Upgrade to Pro'}
            {/* Hover tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[300] transition-all duration-200 shadow-lg">
                Upgrade to Pro
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-900 border-b-[6px] border-b-transparent"></div>
              </div>
            )}
          </button>
        </div>
      </motion.aside>
  )
}
