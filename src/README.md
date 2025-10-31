# Advanced Application Architecture

Production-ready, scalable architecture with clean separation of concerns.

## 📁 Folder Structure

```
src/
├── core/                    # Core utilities and configuration
│   ├── types/              # TypeScript type definitions
│   ├── config/             # Application configuration
│   └── utils/              # Utility functions (errors, logger)
│
├── services/               # Business logic layer
│   ├── auth/              # Authentication service
│   ├── api/               # API client and resources
│   │   └── resources/     # API resource modules
│   ├── cache/             # Caching service
│   ├── notification/      # Notification management
│   ├── theme/             # Theme management
│   └── socket/            # WebSocket service
│
├── hooks/                  # React hooks
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   └── useTheme.ts
│
└── sdk/                    # Unified SDK export
    └── index.ts
```

## 🚀 Quick Start

### Single Import for Everything

```typescript
import { SDK } from '@/sdk'

// Initialize services
await SDK.init()

// Authentication
await SDK.auth.login('email@example.com', 'password')
const user = await SDK.auth.getCurrentUser()

// Posts
const posts = await SDK.posts.getFeed()
await SDK.posts.like('post-id')

// Real-time
SDK.socket.connect()
SDK.socket.on('notification', (data) => console.log(data))

// Theme
SDK.theme.toggle()

// Cache
SDK.cache.clear()
```

### Using React Hooks

```typescript
import { useAuth, useNotifications, useTheme } from '@/hooks'

function MyComponent() {
  const { user, login, logout } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const { theme, toggle } = useTheme()

  return (
    <div>
      <p>User: {user?.username}</p>
      <p>Unread: {unreadCount}</p>
      <button onClick={toggle}>Toggle Theme</button>
    </div>
  )
}
```

## 🏗️ Architecture Principles

### 1. Separation of Concerns
- **Core**: Configuration, types, utilities
- **Services**: Business logic, API calls
- **Hooks**: React integration
- **SDK**: Unified interface

### 2. Type Safety
All types are centralized in `core/types/index.ts`:
```typescript
import type { User, Post, Notification } from '@/core/types'
```

### 3. Error Handling
Custom error classes with proper error handling:
```typescript
import { AppError, AuthError, NetworkError } from '@/core/utils/errors'

try {
  await SDK.auth.login(email, password)
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth error
  }
}
```

### 4. Logging
Centralized logging with levels:
```typescript
import { logger } from '@/core/utils/logger'

logger.info('User logged in')
logger.error('Login failed', error)
logger.debug('Debug info')
```

### 5. Caching
Smart caching with TTL and patterns:
```typescript
// Automatic caching in API calls
const posts = await SDK.posts.getFeed() // Cached for 30s

// Manual caching
await SDK.cache.getOrFetch('key', fetcher, 60000)
SDK.cache.clearPattern('posts:.*')
```

### 6. Real-time Updates
WebSocket integration:
```typescript
SDK.socket.connect(userId)
SDK.socket.on('new_message', handleMessage)
SDK.socket.emit('send_message', data)
```

## 📦 Service Details

### AuthService
- Token management (cookies + localStorage)
- Login/Register/Logout
- Current user state
- Observable pattern for state changes

### CacheService
- In-memory caching with TTL
- Pattern-based clearing
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
- Auto-reconnection
- Event listeners
- Room management

### API Resources
- PostResource: Posts CRUD operations
- UserResource: User management
- ReelResource: Reels operations
- NotificationResource: Notification API

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
}
```

## 🎯 Benefits

✅ **Type-Safe**: Full TypeScript support
✅ **Scalable**: Easy to add new services/resources
✅ **Testable**: Clean separation makes testing easy
✅ **Maintainable**: Clear structure and responsibilities
✅ **Performance**: Built-in caching and optimization
✅ **Real-time**: WebSocket integration
✅ **Error Handling**: Proper error classes and handling
✅ **Logging**: Centralized logging system

## 🔄 Migration from Old Code

### Before:
```typescript
import { MasterAPI } from '@/lib/master-api'
import { MasterAuth } from '@/lib/auth'

const posts = await MasterAPI.Post.getFeed()
const user = await MasterAuth.getCurrentUser()
```

### After:
```typescript
import { SDK } from '@/sdk'

const posts = await SDK.posts.getFeed()
const user = await SDK.auth.getCurrentUser()
```

## 📝 Adding New Features

### 1. Add Types
```typescript
// src/core/types/index.ts
export interface NewFeature {
  id: string
  name: string
}
```

### 2. Create Resource
```typescript
// src/services/api/resources/NewFeatureResource.ts
export class NewFeatureResource {
  async getAll() {
    return apiClient.get('/api/features')
  }
}
```

### 3. Export in SDK
```typescript
// src/sdk/index.ts
import { newFeatureResource } from '@/services/api/resources/NewFeatureResource'

export const SDK = {
  // ...
  features: newFeatureResource,
}
```

### 4. Create Hook (Optional)
```typescript
// src/hooks/useFeatures.ts
export function useFeatures() {
  const [features, setFeatures] = useState([])
  
  useEffect(() => {
    SDK.features.getAll().then(setFeatures)
  }, [])
  
  return { features }
}
```

## 🧪 Testing

Each service is independently testable:

```typescript
import { authService } from '@/services'

describe('AuthService', () => {
  it('should login successfully', async () => {
    const result = await authService.login('test@example.com', 'password')
    expect(result.user).toBeDefined()
  })
})
```

## 🚀 Performance

- **Aggressive Caching**: API responses cached automatically
- **Prefetching**: Load data before needed
- **Request Deduplication**: Prevent duplicate requests
- **Retry Logic**: Auto-retry failed requests
- **Timeout Handling**: Prevent hanging requests

## 📚 Best Practices

1. **Always use SDK**: Import from `@/sdk` for consistency
2. **Use hooks in React**: Leverage `useAuth`, `useNotifications`, etc.
3. **Handle errors**: Use try-catch with proper error types
4. **Log important events**: Use logger for debugging
5. **Clear cache wisely**: Only clear when data changes
6. **Subscribe to updates**: Use observable pattern for real-time data

---

**This architecture is production-ready and scales with your application!**
