/**
 * MASTER AUTH - Ultra-Fast Authentication
 * Handles login, logout, token management
 */

class AuthManager {
  private token: string | null = null
  private user: any = null
  
  // Get token from cookies or localStorage
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
  
  // Set token
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      document.cookie = `token=${token}; path=/; max-age=604800` // 7 days
      localStorage.setItem('token', token)
    }
  }
  
  // Clear token
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      document.cookie = 'token=; path=/; max-age=0'
      document.cookie = 'client-token=; path=/; max-age=0'
      localStorage.removeItem('token')
    }
  }
  
  // Login
  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    
    if (!response.ok) throw new Error('Login failed')
    
    const data = await response.json()
    this.setToken(data.token)
    this.user = data.user
    return data
  }
  
  // Register
  async register(username: string, email: string, password: string, full_name?: string) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, full_name }),
    })
    
    if (!response.ok) throw new Error('Registration failed')
    
    const data = await response.json()
    this.setToken(data.token)
    this.user = data.user
    return data
  }
  
  // Logout
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    this.clearToken()
    this.user = null
  }
  
  // Get current user
  async getCurrentUser() {
    if (this.user) return this.user
    
    const token = this.getToken()
    if (!token) return null
    
    try {
      const response = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!response.ok) {
        this.clearToken()
        return null
      }
      
      this.user = await response.json()
      return this.user
    } catch (error) {
      this.clearToken()
      return null
    }
  }
  
  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const MasterAuth = new AuthManager()
