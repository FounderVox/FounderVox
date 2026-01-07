import { AnimatedBackground } from '@/components/shared/animated-background'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="gradient-bg flex items-center justify-center p-4">
      <AnimatedBackground />
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
