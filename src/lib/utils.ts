import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Production-safe logger - only logs in development
const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  error: (...args: unknown[]) => console.error(...args), // Always log errors
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  info: (...args: unknown[]) => isDev && console.info(...args),
}
