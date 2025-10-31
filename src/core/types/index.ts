/**
 * Core Type Definitions
 * Centralized type system for the entire application
 */

// User Types
export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  avatar?: string
  is_verified?: boolean
  is_private?: boolean
  followers_count?: number
  following_count?: number
  posts_count?: number
  created_at?: Date
}

// Post Types
export interface Post {
  id: string
  user_id: string
  user?: User
  content: string
  image?: string
  video?: string
  likes_count: number
  comments_count: number
  is_liked?: boolean
  is_saved?: boolean
  created_at: Date
}

// Reel Types
export interface Reel {
  id: string
  user_id: string
  user?: User
  video_url: string
  thumbnail?: string
  caption?: string
  likes_count: number
  comments_count: number
  views_count: number
  is_liked?: boolean
  created_at: Date
}

// Story Types
export interface Story {
  id: string
  user_id: string
  user?: User
  media_url: string
  media_type: 'image' | 'video'
  expires_at: Date
  views_count: number
  created_at: Date
}

// Notification Types
export interface Notification {
  id: string
  user_id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  actor?: User
  post?: Post
  is_read: boolean
  created_at: Date
}

// Message Types
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender?: User
  content: string
  is_read: boolean
  created_at: Date
}

export interface Conversation {
  id: string
  participants: User[]
  last_message?: Message
  unread_count: number
  updated_at: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

// Config Types
export interface AppConfig {
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  cache: {
    ttl: {
      instant: number
      short: number
      medium: number
      long: number
    }
  }
  features: Record<string, boolean>
}
