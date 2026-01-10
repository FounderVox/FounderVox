import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
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
              
              // Log resource loading errors
              window.addEventListener('error', function(event) {
                if (event.target && event.target.tagName) {
                  const target = event.target as HTMLElement;
                  if (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG') {
                    console.error('[FounderNote:Global] Resource loading error:', {
                      tag: target.tagName,
                      src: (target as any).src || (target as any).href,
                      error: event.error
                    });
                  }
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
