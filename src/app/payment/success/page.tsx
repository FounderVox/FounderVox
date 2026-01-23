'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<'checking' | 'success' | 'pending'>('checking')
  const [attempts, setAttempts] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  const checkPaymentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/payment/verify')
      const data = await response.json()
      
      console.log('[PaymentSuccess] Check status:', data)
      
      if (data.is_paid_beta) {
        setStatus('success')
        // Wait a moment to show success message, then redirect
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
        return true
      }
      return false
    } catch (error) {
      console.error('[PaymentSuccess] Error checking status:', error)
      return false
    }
  }, [router])

  // Manual verification for testing (grants access)
  const handleManualVerify = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
      })
      const data = await response.json()
      
      console.log('[PaymentSuccess] Manual verify result:', data)
      
      if (data.success || data.is_paid_beta) {
        setStatus('success')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('[PaymentSuccess] Error verifying:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    const poll = async () => {
      const isPaid = await checkPaymentStatus()
      
      if (!isPaid) {
        setStatus('pending')
        setAttempts(prev => prev + 1)
        
        // Keep polling for up to 30 seconds (10 attempts, 3 seconds apart)
        if (attempts < 10) {
          setTimeout(poll, 3000)
        }
      }
    }

    poll()
  }, []) // Only run once on mount

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {status === 'checking' || status === 'pending' ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-6"
            >
              <Loader2 className="w-16 h-16 text-gray-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processing your payment...
            </h1>
            <p className="text-gray-600 mb-6">
              Please wait while we confirm your payment. This usually takes just a few seconds.
            </p>
            
            {/* Show manual verify button after a few attempts */}
            {attempts >= 3 && (
              <div className="border-t pt-6 mt-6">
                <p className="text-sm text-gray-500 mb-4">
                  Payment confirmed but not reflected? Click below to verify manually.
                </p>
                <Button
                  onClick={handleManualVerify}
                  disabled={isVerifying}
                  variant="outline"
                  className="gap-2"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Verify Payment
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="inline-block mb-6"
            >
              <CheckCircle className="w-16 h-16" style={{ color: '#BD6750' }} />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              Welcome to the Founder Notes beta! Redirecting you to the dashboard...
            </p>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#BD6750' }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
              />
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
