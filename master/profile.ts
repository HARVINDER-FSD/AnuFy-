/**
 * MASTER PROFILE - Ultra-Fast Profile Management
 * Handles user profiles with aggressive caching
 */

class ProfileManager {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private CACHE_TTL = 60000 // 1 minute
  
  // Get profile with caching
  async get(username: string) {
    const cached = this.cache.get(username)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    
    const response = await fetch(`/api/users/${username}`)
    if (!response.ok) throw new Error('Profile not found')
    
    const data = await response.json()
    this.cache.set(username, { data, timestamp: Date.now() })
    return data
  }
  
  // Update profile
  async update(data: any) {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) throw new Error('Update failed')
    
    const updated = await response.json()
    this.clearCache()
    return updated
  }
  
  // Upload avatar
  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await fetch('/api/users/profile/avatar', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) throw new Error('Upload failed')
    
    const data = await response.json()
    this.clearCache()
    return data
  }
  
  // Get followers
  async getFollowers(userId: string, page = 1) {
    const response = await fetch(`/api/users/${userId}/followers?page=${page}`)
    if (!response.ok) throw new Error('Failed to fetch followers')
    return response.json()
  }
  
  // Get following
  async getFollowing(userId: string, page = 1) {
    const response = await fetch(`/api/users/${userId}/following?page=${page}`)
    if (!response.ok) throw new Error('Failed to fetch following')
    return response.json()
  }
  
  // Follow user
  async follow(userId: string) {
    const response = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
    if (!response.ok) throw new Error('Follow failed')
    this.clearCache()
    return response.json()
  }
  
  // Unfollow user
  async unfollow(userId: string) {
    const response = await fetch(`/api/users/${userId}/unfollow`, { method: 'POST' })
    if (!response.ok) throw new Error('Unfollow failed')
    this.clearCache()
    return response.json()
  }
  
  // Clear cache
  clearCache() {
    this.cache.clear()
  }
  
  // Prefetch profile
  prefetch(username: string) {
    this.get(username).catch(() => {}) // Silent prefetch
  }
}

export const MasterProfile = new ProfileManager()
