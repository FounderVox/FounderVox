'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * A hook that adds a debounced event listener to the window.
 * Useful for preventing "event storms" where multiple rapid events
 * would otherwise trigger expensive operations multiple times.
 *
 * @param eventName - The name of the event to listen for
 * @param handler - The callback function to execute (debounced)
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @param deps - Optional dependency array for the handler
 */
export function useDebouncedEventListener(
  eventName: string,
  handler: (event?: Event) => void,
  delay: number = 300,
  deps: React.DependencyList = []
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handlerRef = useRef(handler)

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  const debouncedHandler = useCallback((event: Event) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handlerRef.current(event)
    }, delay)
  }, [delay])

  useEffect(() => {
    window.addEventListener(eventName, debouncedHandler)

    return () => {
      window.removeEventListener(eventName, debouncedHandler)
      // Clean up any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [eventName, debouncedHandler, ...deps])
}

/**
 * A hook that adds multiple debounced event listeners with a shared debounce.
 * All events will trigger the same handler, but only after the delay has passed
 * since the last event of any type.
 *
 * @param eventNames - Array of event names to listen for
 * @param handler - The callback function to execute (debounced)
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 */
export function useDebouncedEventListeners(
  eventNames: string[],
  handler: (event?: Event) => void,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handlerRef = useRef(handler)

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  const debouncedHandler = useCallback((event: Event) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handlerRef.current(event)
    }, delay)
  }, [delay])

  useEffect(() => {
    eventNames.forEach(eventName => {
      window.addEventListener(eventName, debouncedHandler)
    })

    return () => {
      eventNames.forEach(eventName => {
        window.removeEventListener(eventName, debouncedHandler)
      })
      // Clean up any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [eventNames.join(','), debouncedHandler])
}
