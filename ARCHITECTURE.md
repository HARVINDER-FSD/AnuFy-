# 🏗️ Advanced Application Architecture

## Overview

This project uses a **production-ready, scalable architecture** with clean separation of concerns, full TypeScript support, and advanced features like caching, real-time updates, and error handling.

## 📁 New Folder Structure

```
src/
├── core/                           # Core utilities and configuration
│   ├── types/
│   │   └── index.ts               # All TypeScript types
│   ├── config/
│   │   └── index.ts               # App configuration
│   └── utils/
│       ├── errors.ts              # Custom error classes
│       └── logger.ts              # Logging utility
│
├── services/                       # Business logic layer
│   ├── auth/
│   │   └── AuthService.ts         # Authentication management
│   ├── api/
│   │   ├── ApiClient.ts           # HTTP client with retry
│   │   ├── resources/
│   │   │   ├── PostResource.ts    # Post API methods
│   │   │   ├── UserResource.ts    # User API methods
│   │   │   ├── ReelResource.ts    # Reel API methods
│   │   │   └── NotificationResource.ts
│   │   └── index.ts
│   ├── cache/
│   │   └── CacheService.ts        # Caching with TTL
│   ├── notification/
│   │   └── NotificationService.ts # Notification management
│   ├── theme/
│   │   └── ThemeService.ts        # Theme management
│   ├── socket/
│   │   └── SocketService.ts       # WebSocket management
│   └── index.ts                   # Service exports
│
├── hooks/                          # React hooks
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   ├── useTheme.ts
│   └── index.ts
│
└── sdk/
    └── index.ts                    # Unified SDK export

master/                             # Legacy (can be removed)
```

## 🚀 Usage

### Single Import Pattern

```typescript
import { SDK } from '@/sdk'

// Initialize
await SDK.init()

// Authentication
await SDK.auth.login('email@example.com', 'password')
const user = await SDK.auth.getCurrentUser()
await SDK.auth.logout()

// Posts
const posts = await SDK.posts.getFeed(1)
await SDK.posts.like('post-id')
await SDK.posts.create({ content: 'Hello!' })

// Users
const profile = await SDK.users.getProfile('username')
await SDK.users.follow('user-id')

// Reels
const reels = await SDK.reels.getFeed()
await SDK.reels.like('reel-id')

// Notifications
const notifications = await SDK.notifications.getAll()
await SDK.notifications.markRead('notification-id')

// Real-time
SDK.socket.connect()
SDK.socket.on('notification', (data) => console.log(data))

// Theme
SDK.theme.set('dark')
SDK.theme.toggle()

// Cache
SDK.cache.clear()
SDK.cache.clearPattern('posts:.*')
```

### React Hooks

```typescript
import { useAuth, useNotifications, useTheme } from '@/hooks'

function MyComponent() {
  const { user, login, logout, loading } = useAuth()
  const { notifications, unreadCount, markRead } = useNotifications()
  const { theme, toggle } = useTheme()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Welcome {user?.username}</h1>
      <p>Unread notifications: {unreadCount}</p>
      <button onClick={toggle}>
        Current theme: {theme}
      </button>
    </div>
  )
}
```

## 🎯 Key Features

### 1. Type Safety
All types centralized in `src/core/types/index.ts`:
```typescript
import type { User, Post, Reel, Notification } from '@/core/types'
```

### 2. Error Handling
Custom error classes:
```typescript
import { AppError, AuthError, NetworkError } from '@/core/utils/errors'

try {
  await SDK.auth.login(email, password)
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Authentication failed')
  }
}
```

### 3. Logging
Centralized logging:
```typescript
import { logger } from '@/core/utils/logger'

logger.info('User logged in')
logger.error('Error occurred', error)
logger.debug('Debug info')
```

### 4. Caching
Automatic caching with TTL:
```typescript
// API calls are cached automatically
const posts = await SDK.posts.getFeed() // Cached for 30s

// Manual caching
await SDK.cache.getOrFetch('key', async () => {
  return await fetchData()
}, 60000) // 60s TTL
```

### 5. Real-time Updates
WebSocket integration:
```typescript
SDK.socket.connect(userId)
SDK.socket.on('new_message', handleMessage)
SDK.socket.emit('send_message', { content: 'Hi!' })
SDK.socket.joinRoom('conversation:123')
```

### 6. Observable Pattern
Services use observable pattern for state management:
```typescript
// Subscribe to auth changes
const unsubscribe = SDK.auth.subscribe((user) => {
  console.log('User changed:', user)
})

// Subscribe to notification changes
SDK.notificationService.subscribe(({ notifications, unreadCount }) => {
  console.log('Notifications updated:', unreadCount)
})
```

## 🔧 Configuration

Edit `src/core/config/index.ts`:

```typescript
export const config = {
  api: {
    baseUrl: 'http://localhost:3001',
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
  },
}
```

## 📦 Service Architecture

### AuthService
- Token management (cookies + localStorage)
- Login/Register/Logout
- Current user state
- Observable pattern for auth changes

### CacheService
- In-memory caching with TTL
- Pattern-based cache clearing
- Prefetching support
- Cache statistics

### NotificationService
- Real-time notification updates
- Unread count tracking
- Mark as read functionality
- Observable pattern

### ThemeService
- Light/Dark/System themes
- Persistent storage
- System preference detection
- Observable pattern

### SocketService
- WebSocket connection management
- Auto-reconnection with retry
- Event listeners
- Room management

### API Resources
Each resource handles specific API endpoints:
- **PostResource**: Posts CRUD, like/unlike, save/unsave
- **UserResource**: Profile, follow/unfollow, search
- **ReelResource**: Reels feed, like, view tracking
- **NotificationResource**: Fetch, mark read, clear

## 🔄 Migration Guide

### From Old Master System

**Before:**
```typescript
import { Master } from '@/master'
import { MasterAPI } from '@/master/api'

const posts = await Master.api.posts.getFeed()
const user = await Master.auth.getCurrentUser()
```

**After:**
```typescript
import { SDK } from '@/sdk'

const posts = await SDK.posts.getFeed()
const user = await SDK.auth.getCurrentUser()
```

### From Individual Imports

**Before:**
```typescript
import { MasterAPI } from '@/lib/master-api'
import { authManager } from '@/lib/auth'
import { profileManager } from '@/lib/profile'

const posts = await MasterAPI.Post.getFeed()
const user = await authManager.getCurrentUser()
const profile = await profileManager.getProfile('username')
```

**After:**
```typescript
import { SDK } from '@/sdk'

const posts = await SDK.posts.getFeed()
const user = await SDK.auth.getCurrentUser()
const profile = await SDK.users.getProfile('username')
```

## 📝 Adding New Features

### 1. Add Types
```typescript
// src/core/types/index.ts
export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: Date
}
```

### 2. Create Resource
```typescript
// src/services/api/resources/CommentResource.ts
import type { Comment } from '@/core/types'
import { apiClient } from '../ApiClient'

export class CommentResource {
  async getComments(postId: string) {
    return apiClient.get<Comment[]>(`/api/posts/${postId}/comments`, {
      cache: true,
      revalidate: 30,
    })
  }

  async create(postId: string, content: string) {
    return apiClient.post<Comment>(`/api/posts/${postId}/comments`, {
      content,
    })
  }
}

export const commentResource = new CommentResource()
```

### 3. Export in SDK
```typescript
// src/sdk/index.ts
import { commentResource } from '@/services/api/resources/CommentResource'

export const SDK = {
  // ... existing
  comments: commentResource,
}
```

### 4. Create Hook (Optional)
```typescript
// src/hooks/useComments.ts
import { useState, useEffect } from 'react'
import { SDK } from '@/sdk'
import type { Comment } from '@/core/types'

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SDK.comments.getComments(postId)
      .then(setComments)
      .finally(() => setLoading(false))
  }, [postId])

  return { comments, loading }
}
```

## ✅ Benefits

- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Scalable**: Easy to add new services
- ✅ **Testable**: Clean separation of concerns
- ✅ **Maintainable**: Clear structure
- ✅ **Performance**: Built-in caching
- ✅ **Real-time**: WebSocket integration
- ✅ **Error Handling**: Proper error classes
- ✅ **Logging**: Centralized logging
- ✅ **Observable**: State management pattern
- ✅ **Tree-shakeable**: Import only what you need

## 🧪 Testing

Each service is independently testable:

```typescript
import { authService } from '@/services'

describe('AuthService', () => {
  it('should login successfully', async () => {
    const result = await authService.login('test@example.com', 'password')
    expect(result.user).toBeDefined()
    expect(result.token).toBeDefined()
  })

  it('should handle login failure', async () => {
    await expect(
      authService.login('invalid@example.com', 'wrong')
    ).rejects.toThrow('Login failed')
  })
})
```

## 🚀 Performance Optimizations

1. **Aggressive Caching**: API responses cached with configurable TTL
2. **Request Deduplication**: Prevent duplicate simultaneous requests
3. **Retry Logic**: Auto-retry failed requests with exponential backoff
4. **Timeout Handling**: Prevent hanging requests
5. **Prefetching**: Load data before it's needed
6. **Tree-shaking**: Import only what you use

## 📚 Best Practices

1. **Always use SDK**: Import from `@/sdk` for consistency
2. **Use hooks in React**: Leverage provided hooks
3. **Handle errors**: Use try-catch with proper error types
4. **Log important events**: Use logger for debugging
5. **Clear cache wisely**: Only clear when data changes
6. **Subscribe to updates**: Use observable pattern
7. **Type everything**: Use TypeScript types from `@/core/types`

---

**This architecture is production-ready and scales with your application!**
