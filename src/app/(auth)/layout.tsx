import CloudBackground from '@/components/shared/cloud-background'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
      <CloudBackground />

      {/* Centered Content */}
      <div className="w-full max-w-md relative z-10 mx-auto">
        {children}
      </div>
    </div>
  )
}
