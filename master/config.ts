/**
 * MASTER CONFIG - Centralized Configuration
 * All app settings in one place
 */

export const MasterConfig = {
  // API Configuration
  api: {
    baseUrl: typeof window !== 'undefined' ? '' : 'http://localhost:3001',
    timeout: 30000,
    retries: 2,
  },
  
  // Cache Configuration
  cache: {
    ttl: {
      instant: 5000,      // 5 seconds
      short: 30000,       // 30 seconds
      medium: 60000,      // 1 minute
      long: 300000,       // 5 minutes
    },
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Upload Limits
  upload: {
    maxImageSize: 10 * 1024 * 1024,  // 10MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  
  // Feature Flags
  features: {
    stories: true,
    reels: true,
    messages: true,
    notifications: true,
    search: true,
    explore: true,
  },
  
  // Performance
  performance: {
    enablePrefetch: true,
    enableCache: true,
    enableOptimisticUI: true,
  },
  
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192',
    expiresIn: '7d',
  },
}
