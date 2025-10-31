/**
 * SDK - Unified API for the entire application
 * Single import for everything you need
 * 
 * @example
 * import { SDK } from '@/sdk'
 * 
 * // Authentication
 * await SDK.auth.login(email, password)
 * const user = await SDK.auth.getCurrentUser()
 * 
 * // Posts
 * const posts = await SDK.posts.getFeed()
 * await SDK.posts.like(postId)
 * 
 * // Real-time
 * SDK.socket.connect()
 * SDK.socket.on('notification', handleNotification)
 */

import { authService } from '@/services/auth/AuthService'
import { cacheService } from '@/services/cache/CacheService'
import { notificationService } from '@/services/notification/NotificationService'
import { themeService } from '@/services/theme/ThemeService'
import { socketService } from '@/services/socket/SocketService'
import { postResource } from '@/services/api/resources/PostResource'
import { userResource } from '@/services/api/resources/UserResource'
import { reelResource } from '@/services/api/resources/ReelResource'
import { notificationResource } from '@/services/api/resources/NotificationResource'

export const SDK = {
  // Authentication
  auth: authService,

  // Resources
  posts: postResource,
  users: userResource,
  reels: reelResource,
  notifications: notificationResource,

  // Services
  notificationService,
  cache: cacheService,
  theme: themeService,
  socket: socketService,

  // Utilities
  init: async () => {
    themeService.init()
    await notificationService.init()
  },
}

// Export types
export type * from '@/core/types'

// Export individual services for tree-shaking
export {
  authService,
  cacheService,
  notificationService,
  themeService,
  socketService,
  postResource,
  userResource,
  reelResource,
  notificationResource,
}

export default SDK
