import { AnimatedBackground } from '@/components/shared/animated-background'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 dashboard-bg-light flex items-center justify-center p-4 overflow-y-auto">
      {/* Animated Background Orbs */}
      <div className="dashboard-orb dashboard-orb-1" aria-hidden="true" />
      <div className="dashboard-orb dashboard-orb-2" aria-hidden="true" />
      <div className="dashboard-orb dashboard-orb-3" aria-hidden="true" />
      <div className="dashboard-orb dashboard-orb-4" aria-hidden="true" />
      
      {/* Centered Content */}
      <div className="w-full max-w-md relative z-10 mx-auto">
        {children}
      </div>
    </div>
  )
}
