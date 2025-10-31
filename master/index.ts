/**
 * MASTER SYSTEM - Ultra-Fast Unified API
 * Single import for everything you need
 * 
 * Usage:
 * import { Master } from '@/master'
 * 
 * Master.api.posts.getFeed()
 * Master.auth.login()
 * Master.profile.get()
 * Master.socket.connect()
 * Master.notifications.send()
 */

export { MasterAPI } from './api'
export { MasterAuth } from './auth'
export { MasterProfile } from './profile'
export { MasterSocket } from './socket'
export { MasterNotifications } from './notifications'
export { MasterTheme } from './theme'
export { MasterConfig } from './config'
export { MasterCache } from './cache'

// Unified Master object for easy access
export const Master = {
  api: require('./api').MasterAPI,
  auth: require('./auth').MasterAuth,
  profile: require('./profile').MasterProfile,
  socket: require('./socket').MasterSocket,
  notifications: require('./notifications').MasterNotifications,
  theme: require('./theme').MasterTheme,
  config: require('./config').MasterConfig,
  cache: require('./cache').MasterCache,
}

export default Master
