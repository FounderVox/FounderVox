'use client'

import { motion } from 'framer-motion'
import { Mic, Folder, Users, Share2, Mail, FileText, ListTodo, PenTool } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    {
      icon: <Mic className="w-5 h-5 text-white" />,
      title: 'Voice Capture',
      description: 'Just speak naturally. Our AI transcribes with 99% accuracy in 12+ languages.',
      gradient: 'bg-black',
      illustration: (
        <div className="relative h-48 flex items-center justify-center">
          <div className="absolute w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-32 h-32 border-2 border-white/30 rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="absolute w-44 h-44 border-2 border-white/20 rounded-full"
          />
        </div>
      )
    },
    {
      icon: <Folder className="w-5 h-5 text-white" />,
      title: 'Smart Organization',
      description: 'Notes auto-categorize into meetings, ideas, tasks. Never manually sort again.',
      gradient: 'bg-black',
      illustration: (
        <div className="relative h-48 flex items-center justify-center">
          <div className="space-y-2">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded bg-yellow-300" />
              <span className="text-white text-sm">Meeting Notes</span>
            </motion.div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-2 ml-4"
            >
              <div className="w-3 h-3 rounded bg-green-300" />
              <span className="text-white text-sm">Tasks</span>
            </motion.div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <div className="w-3 h-3 rounded bg-purple-300" />
              <span className="text-white text-sm">Ideas</span>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      icon: <Users className="w-5 h-5 text-white" />,
      title: 'Team Collaboration',
      description: 'Assign tasks from voice notes. Share insights instantly with your team.',
      gradient: 'bg-black',
      illustration: (
        <div className="relative h-48 flex items-center justify-center">
          <div className="flex -space-x-3">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-sm ${
                  ['bg-white/30', 'bg-white/25', 'bg-white/20', 'bg-white/15'][i]
                }`}
              >
                {['A', 'B', 'C', '+2'][i]}
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: <Share2 className="w-5 h-5 text-white" />,
      title: 'Multi-Format Export',
      description: 'One recording → emails, social posts, action items. Choose your output.',
      gradient: 'bg-black',
      illustration: (
        <div className="relative h-48 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Mail className="w-4 h-4" />, label: 'Email' },
              { icon: <FileText className="w-4 h-4" />, label: 'Doc' },
              { icon: <ListTodo className="w-4 h-4" />, label: 'Tasks' },
              { icon: <PenTool className="w-4 h-4" />, label: 'Post' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/20 backdrop-blur rounded-lg p-3 flex flex-col items-center gap-1"
              >
                <div className="text-white">{item.icon}</div>
                <span className="text-white text-xs">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )
    }
  ]

  return (
    <section id="features" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
            Everything you need to capture ideas
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed for founders who move fast.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Gradient Illustration Area */}
              <div className={`${feature.gradient} p-8`}>
                {feature.illustration}
              </div>
              
              {/* Content Area */}
              <div className="bg-white p-6 border-x border-b border-gray-100 rounded-b-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#BD6750' }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-black">{feature.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


