import { Logo } from '@/components/shared/logo'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="p-6">
        <Logo size="md" />
      </header>
      <main className="container max-w-4xl mx-auto px-4 pb-12">
        {children}
      </main>
    </div>
  )
}
