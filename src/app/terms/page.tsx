'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function TermsPage() {
  const lastUpdated = 'January 21, 2026'

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: [
        {
          subtitle: '',
          text: 'By accessing or using FounderNote, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service. These Terms of Service apply to all users of the service, including without limitation users who are browsers, customers, and contributors of content.'
        }
      ]
    },
    {
      title: '2. Description of Service',
      content: [
        {
          subtitle: 'Core Features',
          text: 'FounderNote is a voice-first productivity application that enables users to capture ideas through voice recordings, automatically transcribe audio to text, and organize content into notes, tasks, and actionable items using artificial intelligence.'
        },
        {
          subtitle: 'Service Availability',
          text: 'We strive to maintain high availability of our service but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the service at any time with reasonable notice to users.'
        },
        {
          subtitle: 'Beta Services',
          text: 'Certain features may be offered as beta or early access. These features are provided "as is" and may be modified or discontinued at any time. Beta users acknowledge that these features may contain bugs or errors.'
        }
      ]
    },
    {
      title: '3. User Accounts',
      content: [
        {
          subtitle: 'Account Creation',
          text: 'To use FounderNote, you must create an account by providing a valid email address and creating a password. You may also sign up using third-party authentication services such as Google or Apple. You must be at least 16 years old to create an account.'
        },
        {
          subtitle: 'Account Security',
          text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.'
        },
        {
          subtitle: 'Account Termination',
          text: 'You may delete your account at any time through the application settings. We reserve the right to suspend or terminate accounts that violate these Terms of Service or engage in prohibited activities.'
        }
      ]
    },
    {
      title: '4. User Content and Conduct',
      content: [
        {
          subtitle: 'Your Content',
          text: 'You retain ownership of all content you create, upload, or store in FounderNote, including voice recordings, transcriptions, and notes. By using our service, you grant us a limited license to process and store your content solely to provide the service to you.'
        },
        {
          subtitle: 'Prohibited Content',
          text: 'You agree not to use FounderNote to store, process, or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable. You also agree not to upload content that infringes on any third party&apos;s intellectual property rights.'
        },
        {
          subtitle: 'Prohibited Activities',
          text: 'You agree not to: (a) attempt to gain unauthorized access to our systems or other users&apos; accounts; (b) use the service for any illegal purpose; (c) interfere with or disrupt the service or servers; (d) reverse engineer or attempt to extract the source code of the service; (e) use automated systems or bots to access the service; (f) resell or redistribute the service without authorization.'
        }
      ]
    },
    {
      title: '5. Subscription and Payments',
      content: [
        {
          subtitle: 'Free Tier',
          text: 'FounderNote offers a free tier with limited features and usage. Free tier limitations are subject to change with reasonable notice.'
        },
        {
          subtitle: 'Paid Subscriptions',
          text: 'Paid subscription plans provide access to additional features and higher usage limits. Subscription fees are billed in advance on a monthly or annual basis, depending on the plan selected. All fees are non-refundable except as required by applicable law.'
        },
        {
          subtitle: 'Price Changes',
          text: 'We reserve the right to modify subscription prices with 30 days notice. Price changes will not affect current billing periods. Beta and founding member pricing may be grandfathered at the discretion of FounderNote.'
        },
        {
          subtitle: 'Cancellation',
          text: 'You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period, and you will retain access to paid features until then.'
        }
      ]
    },
    {
      title: '6. Intellectual Property',
      content: [
        {
          subtitle: 'Our Intellectual Property',
          text: 'FounderNote and its original content, features, and functionality are owned by FounderNote and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.'
        },
        {
          subtitle: 'License to Use',
          text: 'Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to use FounderNote for your personal or internal business purposes.'
        },
        {
          subtitle: 'Feedback',
          text: 'If you provide us with any feedback, suggestions, or ideas regarding the service, you grant us a perpetual, worldwide, royalty-free license to use such feedback for any purpose without compensation to you.'
        }
      ]
    },
    {
      title: '7. Third-Party Services',
      content: [
        {
          subtitle: '',
          text: 'FounderNote integrates with third-party services for transcription, AI processing, and other features. Your use of these integrated services is subject to their respective terms of service and privacy policies. We are not responsible for the practices of third-party service providers.'
        }
      ]
    },
    {
      title: '8. Disclaimer of Warranties',
      content: [
        {
          subtitle: '',
          text: 'FOUNDERNOTE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED.'
        },
        {
          subtitle: 'Transcription Accuracy',
          text: 'While we strive for high accuracy in our transcription services, we do not guarantee 100% accuracy. Users should review transcribed content before relying on it for important purposes.'
        },
        {
          subtitle: 'AI-Generated Content',
          text: 'AI-powered features, including categorization, summarization, and insights, are provided for informational purposes only. We do not guarantee the accuracy, completeness, or usefulness of AI-generated content.'
        }
      ]
    },
    {
      title: '9. Limitation of Liability',
      content: [
        {
          subtitle: '',
          text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, FOUNDERNOTE AND ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE SERVICE; (B) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS AND/OR ANY PERSONAL INFORMATION STORED THEREIN; (C) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICE; (D) ANY BUGS, VIRUSES, OR OTHER HARMFUL CODE THAT MAY BE TRANSMITTED THROUGH THE SERVICE; (E) ANY ERRORS OR OMISSIONS IN ANY CONTENT OR FOR ANY LOSS OR DAMAGE INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE THROUGH THE SERVICE.'
        },
        {
          subtitle: '',
          text: 'IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT PAID BY YOU TO FOUNDERNOTE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.'
        }
      ]
    },
    {
      title: '10. Indemnification',
      content: [
        {
          subtitle: '',
          text: 'You agree to defend, indemnify, and hold harmless FounderNote and its directors, officers, employees, contractors, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to your violation of these Terms of Service or your use of the service.'
        }
      ]
    },
    {
      title: '11. Governing Law and Dispute Resolution',
      content: [
        {
          subtitle: 'Governing Law',
          text: 'These Terms of Service shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.'
        },
        {
          subtitle: 'Dispute Resolution',
          text: 'Any dispute arising from or relating to these Terms of Service shall first be attempted to be resolved through good-faith negotiation between the parties. If the dispute cannot be resolved through negotiation within 30 days, either party may pursue binding arbitration in accordance with the rules of the American Arbitration Association.'
        },
        {
          subtitle: 'Class Action Waiver',
          text: 'You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.'
        }
      ]
    },
    {
      title: '12. Changes to Terms',
      content: [
        {
          subtitle: '',
          text: 'We reserve the right to modify these Terms of Service at any time. We will provide notice of material changes by posting the updated terms on our website and updating the "Last Updated" date. Your continued use of the service after such modifications constitutes your acceptance of the updated terms. If you do not agree to the modified terms, you must discontinue use of the service.'
        }
      ]
    },
    {
      title: '13. Severability',
      content: [
        {
          subtitle: '',
          text: 'If any provision of these Terms of Service is found to be unenforceable or invalid by a court of competent jurisdiction, such provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.'
        }
      ]
    },
    {
      title: '14. Entire Agreement',
      content: [
        {
          subtitle: '',
          text: 'These Terms of Service, together with our Privacy Policy, constitute the entire agreement between you and FounderNote regarding the use of our service and supersede all prior and contemporaneous written or oral agreements.'
        }
      ]
    },
    {
      title: '15. Contact Information',
      content: [
        {
          subtitle: '',
          text: 'If you have any questions about these Terms of Service, please contact us at legal@foundernote.com. We will respond to your inquiry within a reasonable timeframe.'
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
              Terms of Service
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
              Welcome to FounderNote. These Terms of Service (&quot;Terms&quot;) govern your access to and use of
              FounderNote&apos;s website, applications, and services (collectively, the &quot;Service&quot;). By accessing
              or using FounderNote, you agree to be bound by these Terms. Please read them carefully.
            </p>
          </motion.div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-[#f0ebe6] p-8 md:p-10 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.03 }}
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
