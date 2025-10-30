/**
 * Instant Cache System
 * Provides aggressive caching with background refresh for instant page loads
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean // Return stale data while fetching fresh
  key?: string // Custom cache key
}

class InstantCache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()
  
  // Default TTL: 5 minutes
  private readonly DEFAULT_TTL = 5 * 60 * 1000
  
  /**
   * Get data from cache or fetch if not available
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.DEFAULT_TTL,
      staleWhileRevalidate = true
    } = options

    const cached = this.cache.get(key)
    const now = Date.now()

    // Return fresh cache
    if (cached && cached.expiresAt > now) {
      return cached.data
    }

    // Return stale cache while revalidating in background
    if (cached && staleWhileRevalidate) {
      // Start background refresh (don't await)
      this.refreshInBackground(key, fetcher, ttl)
      return cached.data
    }

    // No cache or stale without revalidate - fetch fresh
    return this.fetch(key, fetcher, ttl)
  }

  /**
   * Fetch and cache data
   */
  private async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending
    }

    // Create new request
    const request = fetcher()
    this.pendingRequests.set(key, request)

    try {
      const data = await request
      const now = Date.now()
      
      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl
      })

      return data
    } finally {
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Refresh cache in background
   */
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      await this.fetch(key, fetcher, ttl)
    } catch (error) {
      console.error(`Background refresh failed for ${key}:`, error)
      // Keep stale data on error
    }
  }

  /**
   * Manually set cache
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    })
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate multiple entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Prefetch data for instant access later
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    // Don't wait for result, just start fetching
    this.fetch(key, fetcher, ttl).catch(error => {
      console.error(`Prefetch failed for ${key}:`, error)
    })
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.expiresAt - Date.now()
      }))
    }
  }
}

// Export singleton instance
export const instantCache = new InstantCache()

// Cache key generators
export const CacheKeys = {
  feed: (userId: string, page: number = 1) => `feed:${userId}:${page}`,
  profile: (userId: string) => `profile:${userId}`,
  userPosts: (userId: string) => `user-posts:${userId}`,
  conversations: (userId: string) => `conversations:${userId}`,
  messages: (conversationId: string, page: number = 1) => `messages:${conversationId}:${page}`,
  stories: () => `stories:all`,
  notifications: (userId: string) => `notifications:${userId}`,
  reels: (page: number = 1) => `reels:${page}`,
  trending: () => `trending:all`
}

// TTL presets (in milliseconds)
export const CacheTTL = {
  INSTANT: 30 * 1000,      // 30 seconds - for real-time data
  SHORT: 2 * 60 * 1000,    // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000,   // 5 minutes - for normal data
  LONG: 15 * 60 * 1000,    // 15 minutes - for stable data
  VERY_LONG: 60 * 60 * 1000 // 1 hour - for rarely changing data
}
