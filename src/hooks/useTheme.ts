/**
 * useTheme Hook
 * React hook for theme management
 */

import { useState, useEffect } from 'react'
import { themeService, type Theme } from '@/services/theme/ThemeService'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(themeService.get())

  useEffect(() => {
    const unsubscribe = themeService.subscribe(setTheme)
    return unsubscribe
  }, [])

  return {
    theme,
    resolvedTheme: themeService.getResolvedTheme(),
    setTheme: themeService.set.bind(themeService),
    toggle: themeService.toggle.bind(themeService),
  }
}
