import { Logo } from '@/components/shared/logo'
import { AnimatedBackground } from '@/components/shared/animated-background'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-bg-light">
      {/* Animated Background Orbs */}
      <div className="dashboard-orb dashboard-orb-1" aria-hidden="true" />
      <div className="dashboard-orb dashboard-orb-2" aria-hidden="true" />
      <div className="dashboard-orb dashboard-orb-3" aria-hidden="true" />
      <div className="dashboard-orb dashboard-orb-4" aria-hidden="true" />
      
      <header className="p-6 relative z-10">
        <Logo size="md" />
      </header>
      <main className="container max-w-2xl mx-auto px-4 pb-12 relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        {children}
      </main>
    </div>
  )
}
