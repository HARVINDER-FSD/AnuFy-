/**
 * useAuth Hook
 * React hook for authentication
 */

import { useState, useEffect } from 'react'
import { authService } from '@/services'
import type { User } from '@/core/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authService.subscribe(setUser)

    // Load current user
    authService.getCurrentUser().finally(() => setLoading(false))

    return unsubscribe
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
  }
}
