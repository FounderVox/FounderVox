'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function PrivacyPage() {
  const lastUpdated = 'January 21, 2026'

  const sections = [
    {
      title: '1. Information We Collect',
      content: [
        {
          subtitle: 'Information You Provide',
          text: 'When you create an account, we collect your email address and password. When you use our voice recording features, we collect and process your audio recordings to provide transcription services. We also collect any notes, tasks, and content you create within the application.'
        },
        {
          subtitle: 'Automatically Collected Information',
          text: 'We automatically collect certain information when you use FounderNote, including your IP address, device type, operating system, browser type, and usage patterns within the application. This helps us improve our services and provide a better user experience.'
        },
        {
          subtitle: 'Voice Data',
          text: 'When you record voice notes, we temporarily process your audio to generate transcriptions. Audio files are processed in real-time and are not permanently stored on our servers unless you explicitly save them. Transcribed text is stored securely in your account.'
        }
      ]
    },
    {
      title: '2. How We Use Your Information',
      content: [
        {
          subtitle: 'Service Delivery',
          text: 'We use your information to provide, maintain, and improve FounderNote, including transcribing your voice recordings, organizing your notes, and generating AI-powered insights and categorizations.'
        },
        {
          subtitle: 'Communication',
          text: 'We may use your email address to send you important updates about your account, changes to our services, and occasional product announcements. You can opt out of non-essential communications at any time.'
        },
        {
          subtitle: 'Analytics and Improvement',
          text: 'We analyze usage patterns to understand how users interact with FounderNote, identify areas for improvement, and develop new features. This data is aggregated and anonymized whenever possible.'
        }
      ]
    },
    {
      title: '3. Data Storage and Security',
      content: [
        {
          subtitle: 'Storage Location',
          text: 'Your data is stored on secure servers provided by Supabase, which uses industry-standard security measures. Our servers are located in data centers with robust physical and digital security controls.'
        },
        {
          subtitle: 'Encryption',
          text: 'All data transmitted between your device and our servers is encrypted using TLS 1.3. Data at rest is encrypted using AES-256 encryption. Your password is hashed using bcrypt and is never stored in plain text.'
        },
        {
          subtitle: 'Access Controls',
          text: 'Access to user data is strictly limited to authorized personnel who need it to provide support or maintain our services. We maintain detailed access logs and conduct regular security audits.'
        }
      ]
    },
    {
      title: '4. Third-Party Services',
      content: [
        {
          subtitle: 'Transcription Services',
          text: 'We use Deepgram for voice-to-text transcription. Audio data sent to Deepgram is processed in accordance with their privacy policy and is not retained by them after processing is complete.'
        },
        {
          subtitle: 'AI Services',
          text: 'We use OpenAI to power our AI features, including note categorization, summarization, and the Ask feature. Text data sent to OpenAI is processed according to their enterprise privacy terms and is not used to train their models.'
        },
        {
          subtitle: 'Authentication',
          text: 'We use Supabase Auth for user authentication, which may integrate with Google and Apple sign-in services if you choose to use those options.'
        }
      ]
    },
    {
      title: '5. Your Rights and Choices',
      content: [
        {
          subtitle: 'Access and Portability',
          text: 'You can access all your data through your FounderNote account. You can export your notes and transcriptions at any time in multiple formats.'
        },
        {
          subtitle: 'Deletion',
          text: 'You can delete individual notes or your entire account at any time. When you delete your account, all your personal data, including notes, transcriptions, and recordings, will be permanently deleted within 30 days.'
        },
        {
          subtitle: 'Correction',
          text: 'You can update your account information and edit your notes at any time through the application.'
        }
      ]
    },
    {
      title: '6. Data Retention',
      content: [
        {
          subtitle: 'Active Accounts',
          text: 'We retain your data for as long as your account is active. This includes all notes, transcriptions, and associated metadata.'
        },
        {
          subtitle: 'Deleted Content',
          text: 'When you delete notes or other content, they are immediately removed from your account and permanently deleted from our backups within 30 days.'
        },
        {
          subtitle: 'Inactive Accounts',
          text: 'For free tier accounts that have been inactive for more than 12 months, we may delete the account and associated data after providing 30 days notice via email.'
        }
      ]
    },
    {
      title: '7. Cookies and Tracking',
      content: [
        {
          subtitle: 'Essential Cookies',
          text: 'We use essential cookies to maintain your session and remember your preferences. These are necessary for the application to function properly.'
        },
        {
          subtitle: 'Analytics',
          text: 'We use privacy-focused analytics to understand how users interact with our service. We do not use advertising trackers or sell your data to third parties.'
        }
      ]
    },
    {
      title: '8. Children&apos;s Privacy',
      content: [
        {
          subtitle: '',
          text: 'FounderNote is not intended for users under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.'
        }
      ]
    },
    {
      title: '9. International Data Transfers',
      content: [
        {
          subtitle: '',
          text: 'If you access FounderNote from outside the United States, your data may be transferred to and processed in the United States or other countries where our service providers operate. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.'
        }
      ]
    },
    {
      title: '10. Changes to This Policy',
      content: [
        {
          subtitle: '',
          text: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.'
        }
      ]
    },
    {
      title: '11. Contact Us',
      content: [
        {
          subtitle: '',
          text: 'If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@foundernote.com. We will respond to your inquiry within 30 days.'
        }
      ]
    }
  ]

  return (
    <div className="bg-white min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDF8F4] via-[#FAF6F1] to-white" />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-display text-[#1a1a1a] mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-[#666] font-body">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl border border-[#f0ebe6] p-8 md:p-12 shadow-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-[#444] font-body leading-relaxed text-lg">
              At FounderNote, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our voice-to-text productivity
              application. Please read this policy carefully to understand our practices regarding your
              personal data.
            </p>
          </motion.div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-[#f0ebe6] p-8 md:p-10 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.05 }}
              >
                <h2 className="text-2xl font-display text-[#1a1a1a] mb-6">
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      {item.subtitle && (
                        <h3 className="text-lg font-semibold text-[#BD6750] font-body mb-2">
                          {item.subtitle}
                        </h3>
                      )}
                      <p className="text-[#555] font-body leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
