/**
 * Instant API Layer
 * Provides instant loading with aggressive caching and prefetching
 */

import { instantCache, CacheKeys, CacheTTL } from './instant-cache'
import MasterAPI from './master-api'

export class InstantAPI {
  /**
   * Get feed with instant loading
   */
  static async getFeed(userId: string, page: number = 1, limit: number = 10) {
    const cacheKey = CacheKeys.feed(userId, page)
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.Post.getFeed(limit, (page - 1) * limit)
        return response
      },
      {
        ttl: CacheTTL.SHORT,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Prefetch next page of feed
   */
  static prefetchNextFeedPage(userId: string, currentPage: number, limit: number = 10) {
    const nextPage = currentPage + 1
    const cacheKey = CacheKeys.feed(userId, nextPage)
    
    instantCache.prefetch(
      cacheKey,
      async () => {
        const response = await MasterAPI.Post.getFeed(limit, (nextPage - 1) * limit)
        return response
      },
      CacheTTL.SHORT
    )
  }

  /**
   * Get user profile with instant loading
   */
  static async getProfile(userId: string) {
    const cacheKey = CacheKeys.profile(userId)
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.User.getUser(userId)
        return response
      },
      {
        ttl: CacheTTL.MEDIUM,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Get user posts with instant loading
   */
  static async getUserPosts(userId: string) {
    const cacheKey = CacheKeys.userPosts(userId)
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.call(`/api/users/${userId}`)
        return response.posts || []
      },
      {
        ttl: CacheTTL.MEDIUM,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Get conversations with instant loading
   */
  static async getConversations(userId: string) {
    const cacheKey = CacheKeys.conversations(userId)
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.call('/api/messages/conversations')
        return response
      },
      {
        ttl: CacheTTL.INSTANT,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Get messages with instant loading
   */
  static async getMessages(conversationId: string, page: number = 1) {
    const cacheKey = CacheKeys.messages(conversationId, page)
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.call(`/api/messages/conversations/${conversationId}`)
        return response
      },
      {
        ttl: CacheTTL.INSTANT,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Get stories with instant loading
   */
  static async getStories() {
    const cacheKey = CacheKeys.stories()
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.Story.getStories()
        return response
      },
      {
        ttl: CacheTTL.SHORT,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Get notifications with instant loading
   */
  static async getNotifications(userId: string) {
    const cacheKey = CacheKeys.notifications(userId)
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.Notification.getNotifications()
        return response
      },
      {
        ttl: CacheTTL.INSTANT,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Get reels with instant loading
   */
  static async getReels(page: number = 1) {
    const cacheKey = CacheKeys.reels(page)
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.Reel.getReels()
        return response
      },
      {
        ttl: CacheTTL.MEDIUM,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Get trending content with instant loading
   */
  static async getTrending() {
    const cacheKey = CacheKeys.trending()
    
    return instantCache.get(
      cacheKey,
      async () => {
        const response = await MasterAPI.call('/api/explore/trending?category=all&limit=30')
        return response
      },
      {
        ttl: CacheTTL.MEDIUM,
        staleWhileRevalidate: true
      }
    )
  }

  /**
   * Invalidate cache after mutations
   */
  static invalidateFeed(userId: string) {
    instantCache.invalidatePattern(`feed:${userId}:.*`)
  }

  static invalidateProfile(userId: string) {
    instantCache.invalidate(CacheKeys.profile(userId))
    instantCache.invalidate(CacheKeys.userPosts(userId))
  }

  static invalidateConversations(userId: string) {
    instantCache.invalidate(CacheKeys.conversations(userId))
  }

  static invalidateMessages(conversationId: string) {
    instantCache.invalidatePattern(`messages:${conversationId}:.*`)
  }

  /**
   * Prefetch common data for instant navigation
   */
  static prefetchCommonData(userId: string) {
    // Prefetch feed
    this.prefetchNextFeedPage(userId, 1)
    
    // Prefetch stories
    instantCache.prefetch(
      CacheKeys.stories(),
      async () => MasterAPI.Story.getStories(),
      CacheTTL.SHORT
    )
    
    // Prefetch notifications
    instantCache.prefetch(
      CacheKeys.notifications(userId),
      async () => MasterAPI.Notification.getNotifications(),
      CacheTTL.INSTANT
    )
    
    // Prefetch trending
    instantCache.prefetch(
      CacheKeys.trending(),
      async () => MasterAPI.call('/api/explore/trending?category=all&limit=30'),
      CacheTTL.MEDIUM
    )
  }
}

export default InstantAPI
