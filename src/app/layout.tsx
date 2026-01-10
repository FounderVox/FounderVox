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
              // Suppress source map errors (non-critical development warnings)
              const originalError = console.error;
              console.error = function(...args) {
                const message = args[0]?.toString() || '';
                // Filter out source map and WebSocket HMR errors
                if (
                  message.includes('Source Map') ||
                  message.includes('.map') ||
                  message.includes('webpack-hmr') ||
                  message.includes('WebSocket connection')
                ) {
                  return; // Suppress these non-critical warnings
                }
                originalError.apply(console, args);
              };
              
              // Global error handler for unhandled errors (only real errors)
              window.addEventListener('error', function(event) {
                // Ignore source map and HMR WebSocket errors
                if (
                  event.message?.includes('Source Map') ||
                  event.message?.includes('.map') ||
                  event.message?.includes('webpack-hmr') ||
                  event.message?.includes('WebSocket')
                ) {
                  return;
                }
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
              
              // Log resource loading errors (excluding source maps)
              window.addEventListener('error', function(event) {
                if (event.target && event.target.tagName) {
                  const target = event.target;
                  const src = target.src || target.href || '';
                  // Ignore source map files
                  if (src.includes('.map') || src.includes('webpack-hmr')) {
                    return;
                  }
                  if (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG') {
                    console.error('[FounderNote:Global] Resource loading error:', {
                      tag: target.tagName,
                      src: src,
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
