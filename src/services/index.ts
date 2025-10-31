/**
 * Services Index
 * Unified export for all services
 */

export { authService } from './auth/AuthService'
export { cacheService } from './cache/CacheService'
export { notificationService } from './notification/NotificationService'
export { themeService } from './theme/ThemeService'
export { socketService } from './socket/SocketService'

export {
  apiClient,
  postResource,
  userResource,
  reelResource,
  notificationResource,
} from './api'
