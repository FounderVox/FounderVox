'use client'

import { Mic, Folder, Users, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function FeatureBentoGrid() {
  const features = [
    {
      icon: <Mic className="w-8 h-8 stroke-1" />,
      title: 'Voice Capture',
      description: 'Just speak naturally. Our AI transcribes with 99% accuracy in 12+ languages, capturing every word perfectly.',
      span: 2
    },
    {
      icon: <Folder className="w-8 h-8 stroke-1" />,
      title: 'Smart Organization',
      description: 'Notes auto-categorize into meetings, ideas, tasks. Never manually sort again.',
      span: 1
    },
    {
      icon: <Users className="w-8 h-8 stroke-1" />,
      title: 'Team Collaboration',
      description: 'Assign tasks from voice notes. Share insights instantly with your team.',
      span: 1
    },
    {
      icon: <Share2 className="w-8 h-8 stroke-1" />,
      title: 'Multi-Format Export',
      description: 'One recording → emails, social posts, action items. Choose your output format instantly.',
      span: 2
    }
  ]

  return (
    <div className="w-full py-12 lg:py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-10">
          <div className="flex gap-4 flex-col items-start">
            <div>
              <Badge variant="secondary" className="bg-gray-100 text-black border-gray-200">
                Features
              </Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-normal text-left text-black">
                Everything you need to capture ideas
              </h2>
              <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-gray-600 text-left">
                Built for founders who move fast.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-gray-50 rounded-md h-full p-6 ${
                  feature.span === 2 ? 'lg:col-span-2' : ''
                } aspect-square lg:aspect-auto flex justify-between flex-col border border-gray-100 hover:border-gray-200 transition-colors`}
              >
                <div className="mb-4" style={{ color: '#BD6750' }}>
                  {feature.icon}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl tracking-tight text-black font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 max-w-xs text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


