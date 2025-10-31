# MASTER SYSTEM - Ultra-Fast Unified API

Single import for everything. Native-like performance.

## Quick Start

```typescript
import { Master } from '@/master'

// Everything you need in one place
const posts = await Master.api.posts.getFeed()
const user = await Master.auth.getCurrentUser()
const profile = await Master.profile.get('username')
Master.socket.connect()
Master.theme.toggle()
```

## Features

✅ **Ultra-Fast** - Aggressive caching, prefetching, optimistic UI
✅ **Zero Import Errors** - Everything pre-configured and tested
✅ **Native Feel** - Instant responses, smooth animations
✅ **Smart Caching** - Automatic cache invalidation
✅ **Real-time** - WebSocket integration built-in

## Usage Examples

### API Calls
```typescript
// Get feed (cached for 30s)
const posts = await Master.api.posts.getFeed(1)

// Get profile (cached for 60s)
const profile = await Master.api.users.getProfile('john')

// Create post
await Master.api.posts.create({ content: 'Hello!', image: '...' })

// Like post
await Master.api.posts.like('post-id')
```

### Authentication
```typescript
// Login
await Master.auth.login('email@example.com', 'password')

// Get current user
const user = await Master.auth.getCurrentUser()

// Check if authenticated
if (Master.auth.isAuthenticated()) {
  // User is logged in
}

// Logout
await Master.auth.logout()
```

### Profile Management
```typescript
// Get profile (cached)
const profile = await Master.profile.get('username')

// Update profile
await Master.profile.update({ bio: 'New bio' })

// Upload avatar
await Master.profile.uploadAvatar(file)

// Follow user
await Master.profile.follow('user-id')

// Prefetch profile (background)
Master.profile.prefetch('username')
```

### Real-time Socket
```typescript
// Connect
Master.socket.connect(userId)

// Listen for messages
Master.socket.on('new_message', (message) => {
  console.log('New message:', message)
})

// Send message
Master.socket.emit('send_message', { content: 'Hi!' })

// Join conversation
Master.socket.joinRoom('conversation:123')
```

### Notifications
```typescript
// Get all notifications
const notifications = await Master.notifications.getAll()

// Get unread count
const count = Master.notifications.getUnreadCount()

// Mark as read
await Master.notifications.markRead('notification-id')

// Subscribe to changes
Master.notifications.subscribe(({ notifications, unreadCount }) => {
  console.log('Notifications updated:', unreadCount)
})
```

### Theme
```typescript
// Get current theme
const theme = Master.theme.get() // 'dark' | 'light'

// Set theme
Master.theme.set('dark')

// Toggle theme
Master.theme.toggle()

// Subscribe to changes
Master.theme.subscribe((theme) => {
  console.log('Theme changed:', theme)
})
```

### Cache Management
```typescript
// Get or fetch with caching
const data = await Master.cache.getOrFetch(
  'my-key',
  async () => fetch('/api/data').then(r => r.json()),
  60000 // 1 minute TTL
)

// Clear specific cache
Master.cache.delete('my-key')

// Clear by pattern
Master.cache.clearPattern('posts:.*')

// Prefetch data
Master.cache.prefetch('next-page', async () => fetchNextPage(), 30000)
```

## Performance Tips

1. **Use caching** - API calls are cached automatically
2. **Prefetch data** - Load next page before user needs it
3. **Subscribe to updates** - Real-time updates via socket
4. **Clear cache wisely** - Only clear when data changes

## Migration from Old Code

### Before:
```typescript
import { MasterAPI } from '@/lib/master-api'
import { MasterAuth } from '@/lib/auth'
import { profileManager } from '@/lib/profile-manager'

const posts = await MasterAPI.Post.getFeed()
const user = await MasterAuth.getCurrentUser()
const profile = await profileManager.getProfile('username')
```

### After:
```typescript
import { Master } from '@/master'

const posts = await Master.api.posts.getFeed()
const user = await Master.auth.getCurrentUser()
const profile = await Master.profile.get('username')
```

## Architecture

```
master/
├── index.ts          # Main export
├── api.ts            # API client with caching
├── auth.ts           # Authentication manager
├── profile.ts        # Profile management
├── socket.ts         # WebSocket manager
├── notifications.ts  # Notification system
├── theme.ts          # Theme manager
├── config.ts         # Configuration
└── cache.ts          # Cache manager
```

All modules work together seamlessly with zero configuration needed!
