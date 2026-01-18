'use client'

import { createContext, useContext, useState, useRef, ReactNode, useCallback, useMemo } from 'react'

interface MenuContextType {
  isAnyMenuOpen: boolean
  openMenu: () => void
  closeMenu: () => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isAnyMenuOpen, setIsAnyMenuOpen] = useState(false)
  const openMenuCountRef = useRef(0)

  const openMenu = useCallback(() => {
    openMenuCountRef.current += 1
    setIsAnyMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    openMenuCountRef.current = Math.max(0, openMenuCountRef.current - 1)
    if (openMenuCountRef.current === 0) {
      setIsAnyMenuOpen(false)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isAnyMenuOpen,
    openMenu,
    closeMenu
  }), [isAnyMenuOpen, openMenu, closeMenu])

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}

