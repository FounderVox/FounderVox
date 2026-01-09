'use client'

export default function StatsSection() {
  const stats = [
    { number: '99%', label: 'Accuracy', description: 'Industry-leading transcription' },
    { number: '500ms', label: 'Response', description: 'Near-instant processing' },
    { number: '12+', label: 'Languages', description: 'Global support built-in' }
  ]

  return (
    <section className="py-24 px-6 bg-white text-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">
            Built for speed and accuracy
          </h2>
          <p className="text-lg text-gray-600">
            Powered by the latest AI for reliable performance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-8 bg-gray-50 border border-gray-200 rounded-2xl"
            >
              <div className="text-5xl md:text-6xl font-bold mb-2" style={{ color: '#BD6750' }}>{stat.number}</div>
              <div className="text-lg font-medium text-gray-700 mb-1">{stat.label}</div>
              <p className="text-gray-600 text-sm">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


