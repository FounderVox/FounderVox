import { Logo } from '@/components/shared/logo'
import CloudBackground from '@/components/shared/cloud-background'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <CloudBackground />

      <header className="p-6 relative z-10">
        <Logo size="md" />
      </header>
      <main className="container max-w-2xl mx-auto px-4 pb-12 relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        {children}
      </main>
    </div>
  )
}
