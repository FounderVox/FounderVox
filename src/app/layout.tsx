import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FounderNote - Voice Notes for Founders',
  description: 'Transform your voice into actionable content. Capture ideas, draft emails, and stay productive with AI-powered voice notes.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler for unhandled errors
              window.addEventListener('error', function(event) {
                console.error('[FounderNote:Global] Unhandled error:', {
                  message: event.message,
                  filename: event.filename,
                  lineno: event.lineno,
                  colno: event.colno,
                  error: event.error
                });
              });
              
              // Handle unhandled promise rejections
              window.addEventListener('unhandledrejection', function(event) {
                console.error('[FounderNote:Global] Unhandled promise rejection:', {
                  reason: event.reason,
                  promise: event.promise
                });
              });
              
              // Log resource loading errors (but ignore Next.js internal 404s in development)
              window.addEventListener('error', function(event) {
                if (event.target && event.target.tagName) {
                  const target = event.target;
                  if (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG') {
                    const src = target.src || target.href || '';
                    // Ignore Next.js internal chunk loading errors in development (these are often false positives)
                    const isNextJsInternal = src.includes('/_next/static/') || src.includes('/_next/chunks/');
                    const is404 = event.message && event.message.includes('404');
                    
                    // Only log if it's not a Next.js internal 404 (which are often harmless in dev)
                    if (!(isNextJsInternal && is404)) {
                      console.error('[FounderNote:Global] Resource loading error:', {
                        tag: target.tagName,
                        src: src,
                        error: event.error
                      });
                    }
                  }
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className={`${instrumentSerif.variable} ${dmSans.variable} font-body`}>{children}</body>
    </html>
  )
}
