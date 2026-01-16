// Tag color options - premium colors that are visible on white background
export const tagColors = [
  { name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', value: 'blue', hex: '#DBEAFE' },
  { name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', value: 'purple', hex: '#E9D5FF' },
  { name: 'Green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', value: 'green', hex: '#D1FAE5' },
  { name: 'Orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', value: 'orange', hex: '#FED7AA' },
  { name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', value: 'pink', hex: '#FCE7F3' },
  { name: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', value: 'indigo', hex: '#E0E7FF' },
  { name: 'Teal', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', value: 'teal', hex: '#CCFBF1' },
  { name: 'Amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', value: 'amber', hex: '#FEF3C7' },
]

// Helper function to get color for a tag (consistent based on tag name)
export const getTagColor = (tagName: string) => {
  const colorIndex = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % tagColors.length
  return tagColors[colorIndex]
}



