'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Mic } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const Logo = ({ variant = 'dark' }: { variant?: 'dark' | 'light' }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center ${
        variant === 'dark' ? '' : 'bg-white'
      }`}
      style={variant === 'dark' ? { backgroundColor: '#BD6750' } : {}}
    >
      <Mic className={`w-4 h-4 ${variant === 'dark' ? 'text-white' : 'text-black'}`} />
    </div>
    <span className={`text-lg font-semibold tracking-tight font-body ${
      variant === 'dark' ? 'text-gray-900' : 'text-white'
    }`}>
      FounderNote
    </span>
  </div>
)

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/beta', label: 'Pricing' },
    { href: '/download', label: 'Download' },
    { href: '/#features', label: 'Features' },
  ]

  const handleFeaturesClick = (e: React.MouseEvent) => {
    if (pathname !== '/') {
      e.preventDefault()
      window.location.href = '/#features'
    } else {
      e.preventDefault()
      const element = document.getElementById('features')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100'
            : 'py-4 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  onClick={link.href === '/#features' ? handleFeaturesClick : undefined}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-body ${
                    pathname === link.href.split('#')[0]
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-50 font-body"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 terracotta-glow-sm hover:scale-105 font-body"
                    style={{ backgroundColor: '#BD6750' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 terracotta-glow-sm hover:scale-105 font-body"
                  style={{ backgroundColor: '#BD6750' }}
                >
                  Get Started
                </Link>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-40 pt-20 px-6 md:hidden"
          >
            <div className="flex flex-col gap-2 pt-4">
              {navLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    if (link.href === '/#features') {
                      if (pathname !== '/') {
                        setTimeout(() => {
                          window.location.href = '/#features'
                        }, 100)
                      } else {
                        setTimeout(() => {
                          const element = document.getElementById('features')
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }, 100)
                      }
                    }
                  }}
                  className="text-xl font-medium text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-50 font-body"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-900 py-3 px-4 rounded-xl text-lg font-medium hover:bg-gray-50 font-body"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    className="text-white px-6 py-3 rounded-xl text-lg font-medium text-center mt-4 font-body"
                    style={{ backgroundColor: '#BD6750' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-white px-6 py-3 rounded-xl text-lg font-medium text-center mt-4 font-body"
                  style={{ backgroundColor: '#BD6750' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
