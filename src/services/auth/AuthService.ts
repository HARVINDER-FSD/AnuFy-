/**
 * Authentication Service
 * Handles login, logout, token management
 */

import type { User } from '@/core/types'
import { AuthError } from '@/core/utils/errors'
import { logger } from '@/core/utils/logger'
import { apiClient } from '../api/ApiClient'

export class AuthService {
  private token: string | null = null
  private user: User | null = null
  private listeners = new Set<(user: User | null) => void>()

  getToken(): string | null {
    if (typeof window === 'undefined') return null

    if (this.token) return this.token

    // Check cookies
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'token' || name === 'client-token') {
        this.token = value
        return value
      }
    }

    // Check localStorage
    const stored = localStorage.getItem('token')
    if (stored) {
      this.token = stored
      return stored
    }

    return null
  }

  setToken(token: string): void {
    this.token = token
    if (typeof window !== 'undefined') {
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`
      localStorage.setItem('token', token)
    }
    logger.info('Token set')
  }

  clearToken(): void {
    this.token = null
    if (typeof window !== 'undefined') {
      document.cookie = 'token=; path=/; max-age=0'
      document.cookie = 'client-token=; path=/; max-age=0'
      localStorage.removeItem('token')
    }
    logger.info('Token cleared')
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const data = await apiClient.post<{ user: User; token: string }>('/api/auth/login', {
        email,
        password,
      })

      this.setToken(data.token)
      this.user = data.user
      this.notifyListeners(data.user)

      logger.info('Login successful', { userId: data.user.id })
      return data
    } catch (error) {
      throw new AuthError('Login failed')
    }
  }

  async register(
    username: string,
    email: string,
    password: string,
    full_name?: string
  ): Promise<{ user: User; token: string }> {
    try {
      const data = await apiClient.post<{ user: User; token: string }>('/api/auth/register', {
        username,
        email,
        password,
        full_name,
      })

      this.setToken(data.token)
      this.user = data.user
      this.notifyListeners(data.user)

      logger.info('Registration successful', { userId: data.user.id })
      return data
    } catch (error) {
      throw new AuthError('Registration failed')
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout')
    } catch (error) {
      logger.error('Logout request failed', error)
    }

    this.clearToken()
    this.user = null
    this.notifyListeners(null)
    logger.info('Logout successful')
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.user) return this.user

    const token = this.getToken()
    if (!token) return null

    try {
      const user = await apiClient.get<User>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      this.user = user
      this.notifyListeners(user)
      return user
    } catch (error) {
      this.clearToken()
      this.notifyListeners(null)
      return null
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(callback => callback(user))
  }
}

export const authService = new AuthService()
