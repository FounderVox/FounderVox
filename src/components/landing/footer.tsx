'use client'

import Link from 'next/link'
import { Mic } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    Product: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Download', href: '/download' },
    ],
    Support: [
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  }

  return (
    <footer className="warm-dark text-white pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div
                className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#BD6750' }}
              >
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white font-body">
                Founder Notes
              </span>
            </div>
            <p className="text-gray-400 mt-4 text-sm leading-relaxed max-w-xs font-body">
              Voice-first productivity for founders who think faster than they type.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-medium text-white mb-4 text-sm font-body">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors font-body"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm font-body">
            © 2026 Founder Notes. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-body">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#10b981' }}
            />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
