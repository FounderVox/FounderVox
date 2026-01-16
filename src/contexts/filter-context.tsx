'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface FilterContextType {
  activeFilter: string
  setActiveFilter: (filter: string) => void
}

const FilterContext = createContext<FilterContextType>({
  activeFilter: 'all',
  setActiveFilter: () => {},
})

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [activeFilter, setActiveFilter] = useState('all')

  // Listen for filter changes from filter bar
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      setActiveFilter(event.detail.filter)
    }

    window.addEventListener('filterChanged' as any, handleFilterChange as EventListener)
    return () => {
      window.removeEventListener('filterChanged' as any, handleFilterChange as EventListener)
    }
  }, [])

  return (
    <FilterContext.Provider value={{ activeFilter, setActiveFilter }}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilter = () => useContext(FilterContext)



