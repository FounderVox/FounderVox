import { Logo } from '@/components/shared/logo'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="gradient-bg">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center px-4">
          <Logo size="sm" />
        </div>
      </header>
      <main className="container px-4 py-8">
        {children}
      </main>
    </div>
  )
}
