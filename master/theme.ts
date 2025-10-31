/**
 * MASTER THEME - Ultra-Fast Theme Management
 * Dark/Light mode with instant switching
 */

type Theme = 'light' | 'dark'

class ThemeManager {
  private current: Theme = 'dark'
  private listeners = new Set<Function>()
  
  // Initialize theme
  init() {
    if (typeof window === 'undefined') return
    
    const stored = localStorage.getItem('theme') as Theme
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    this.current = stored || system
    this.apply()
  }
  
  // Get current theme
  get(): Theme {
    return this.current
  }
  
  // Set theme
  set(theme: Theme) {
    this.current = theme
    this.apply()
    this.notifyListeners()
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }
  }
  
  // Toggle theme
  toggle() {
    this.set(this.current === 'dark' ? 'light' : 'dark')
  }
  
  // Apply theme to DOM
  private apply() {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(this.current)
  }
  
  // Subscribe to changes
  subscribe(callback: Function) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
  
  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.current))
  }
}

export const MasterTheme = new ThemeManager()

// Auto-initialize
if (typeof window !== 'undefined') {
  MasterTheme.init()
}
