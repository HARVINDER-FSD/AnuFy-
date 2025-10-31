/**
 * MASTER API - Ultra-Fast API Client
 * Pre-configured with caching, retries, and optimizations
 */

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

interface RequestOptions {
  cache?: boolean
  revalidate?: number
}

class APIClient {
  private cache = new Map<string, { data: any; timestamp: number }>()
  
  private async request(endpoint: string, options: RequestInit & RequestOptions = {}) {
    const { cache: useCache, revalidate = 60, ...fetchOptions } = options
    const cacheKey = `${endpoint}:${JSON.stringify(fetchOptions)}`
    
    // Check cache
    if (useCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < revalidate * 1000) {
        return cached.data
      }
    }
    
    // Make request
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })
    
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
    
    const data = await response.json()
    
    // Cache response
    if (useCache) {
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
    }
    
    return data
  }
  
  // Posts
  posts = {
    getFeed: (page = 1) => this.request(`/api/posts?page=${page}`, { cache: true, revalidate: 30 }),
    getPost: (id: string) => this.request(`/api/posts/${id}`, { cache: true }),
    create: (data: any) => this.request('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
    like: (id: string) => this.request(`/api/posts/${id}/like`, { method: 'POST' }),
    unlike: (id: string) => this.request(`/api/posts/${id}/unlike`, { method: 'POST' }),
  }
  
  // Reels
  reels = {
    getFeed: (page = 1) => this.request(`/api/reels?page=${page}`, { cache: true, revalidate: 30 }),
    getReel: (id: string) => this.request(`/api/reels/${id}`, { cache: true }),
    create: (data: any) => this.request('/api/reels', { method: 'POST', body: JSON.stringify(data) }),
  }
  
  // Stories
  stories = {
    getAll: () => this.request('/api/stories', { cache: true, revalidate: 20 }),
    create: (data: any) => this.request('/api/stories', { method: 'POST', body: JSON.stringify(data) }),
  }
  
  // Users
  users = {
    getProfile: (username: string) => this.request(`/api/users/${username}`, { cache: true, revalidate: 60 }),
    getMe: () => this.request('/api/users/me', { cache: true, revalidate: 300 }),
    update: (data: any) => this.request('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    follow: (id: string) => this.request(`/api/users/${id}/follow`, { method: 'POST' }),
    unfollow: (id: string) => this.request(`/api/users/${id}/unfollow`, { method: 'POST' }),
  }
  
  // Messages
  messages = {
    getConversations: () => this.request('/api/messages/conversations', { cache: true, revalidate: 10 }),
    getMessages: (id: string) => this.request(`/api/messages/conversations/${id}`, { cache: true, revalidate: 5 }),
    send: (id: string, message: string) => this.request(`/api/messages/conversations/${id}`, { 
      method: 'POST', 
      body: JSON.stringify({ message }) 
    }),
  }
  
  // Notifications
  notifications = {
    getAll: () => this.request('/api/notifications', { cache: true, revalidate: 10 }),
    markRead: (id: string) => this.request(`/api/notifications/${id}/read`, { method: 'POST' }),
    clearAll: () => this.request('/api/notifications/clear', { method: 'POST' }),
  }
  
  // Search
  search = {
    all: (q: string) => this.request(`/api/search?q=${encodeURIComponent(q)}`, { cache: true, revalidate: 60 }),
    users: (q: string) => this.request(`/api/search?q=${encodeURIComponent(q)}&type=users`, { cache: true }),
    posts: (q: string) => this.request(`/api/search?q=${encodeURIComponent(q)}&type=posts`, { cache: true }),
  }
  
  // Clear cache
  clearCache() {
    this.cache.clear()
  }
}

export const MasterAPI = new APIClient()
