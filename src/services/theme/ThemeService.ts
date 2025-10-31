/**
 * Theme Service
 * Theme management with persistence
 */

import { logger } from '@/core/utils/logger'

export type Theme = 'light' | 'dark' | 'system'

export class ThemeService {
  private current: Theme = 'system'
  private listeners = new Set<(theme: Theme) => void>()

  init(): void {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('theme') as Theme
    this.current = stored || 'system'
    this.apply()

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.current === 'system') {
        this.apply()
      }
    })

    logger.info(`Theme initialized: ${this.current}`)
  }

  get(): Theme {
    return this.current
  }

  set(theme: Theme): void {
    this.current = theme
    this.apply()
    this.notifyListeners()

    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }

    logger.info(`Theme changed: ${theme}`)
  }

  toggle(): void {
    const resolved = this.getResolvedTheme()
    this.set(resolved === 'dark' ? 'light' : 'dark')
  }

  getResolvedTheme(): 'light' | 'dark' {
    if (this.current !== 'system') {
      return this.current
    }

    if (typeof window === 'undefined') return 'dark'

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  private apply(): void {
    if (typeof window === 'undefined') return

    const resolved = this.getResolvedTheme()
    const root = document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
  }

  subscribe(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.current))
  }
}

export const themeService = new ThemeService()

// Auto-initialize
if (typeof window !== 'undefined') {
  themeService.init()
}
