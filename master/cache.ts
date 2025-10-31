/**
 * MASTER CACHE - Ultra-Fast In-Memory Cache
 * Lightning-fast data access with smart invalidation
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class CacheManager {
  private store = new Map<string, CacheEntry>()
  private prefetchQueue = new Set<string>()
  
  // Get from cache
  get(key: string): any | null {
    const entry = this.store.get(key)
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      return null
    }
    
    return entry.data
  }
  
  // Set cache
  set(key: string, data: any, ttl = 60000) {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }
  
  // Get or fetch
  async getOrFetch(key: string, fetcher: () => Promise<any>, ttl = 60000) {
    const cached = this.get(key)
    if (cached !== null) return cached
    
    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }
  
  // Delete
  delete(key: string) {
    this.store.delete(key)
  }
  
  // Clear all
  clear() {
    this.store.clear()
  }
  
  // Clear by pattern
  clearPattern(pattern: string) {
    const regex = new RegExp(pattern)
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
      }
    }
  }
  
  // Prefetch
  async prefetch(key: string, fetcher: () => Promise<any>, ttl = 60000) {
    if (this.prefetchQueue.has(key)) return
    
    this.prefetchQueue.add(key)
    try {
      const data = await fetcher()
      this.set(key, data, ttl)
    } catch (error) {
      console.error('Prefetch error:', error)
    } finally {
      this.prefetchQueue.delete(key)
    }
  }
  
  // Get cache stats
  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    }
  }
}

export const MasterCache = new CacheManager()
