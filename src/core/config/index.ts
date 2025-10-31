/**
 * Application Configuration
 * Centralized configuration management
 */

import type { AppConfig } from '../types'

export const config: AppConfig = {
  api: {
    baseUrl: typeof window !== 'undefined' ? '' : process.env.API_URL || 'http://localhost:3001',
    timeout: 30000,
    retries: 2,
  },
  
  cache: {
    ttl: {
      instant: 5000,
      short: 30000,
      medium: 60000,
      long: 300000,
    },
  },
  
  features: {
    stories: true,
    reels: true,
    messages: true,
    notifications: true,
    search: true,
    explore: true,
  },
}

export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
}
