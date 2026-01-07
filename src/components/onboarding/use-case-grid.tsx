'use client'

import { UseCaseCard } from './use-case-card'
import { USE_CASES } from '@/lib/constants/use-cases'

interface UseCaseGridProps {
  selectedUseCases: string[]
  onToggle: (id: string) => void
}

export function UseCaseGrid({ selectedUseCases, onToggle }: UseCaseGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {USE_CASES.map((useCase) => (
        <UseCaseCard
          key={useCase.id}
          useCase={useCase}
          isSelected={selectedUseCases.includes(useCase.id)}
          onToggle={() => onToggle(useCase.id)}
        />
      ))}
    </div>
  )
}
