# 🔄 Migration Guide: Old Master System → New Architecture

## Quick Migration Steps

### Step 1: Update Imports

**Old:**
```typescript
import { Master } from '@/master'
import { MasterAPI } from '@/master/api'
import { MasterAuth } from '@/master/auth'
```

**New:**
```typescript
import { SDK } from '@/sdk'
// or for specific imports
import { authService, postResource } from '@/services'
```

### Step 2: Update API Calls

**Old:**
```typescript
const posts = await Master.api.posts.getFeed()
const user = await Master.auth.getCurrentUser()
const profile = await Master.profile.get('username')
```

**New:**
```typescript
const posts = await SDK.posts.getFeed()
const user = await SDK.auth.getCurrentUser()
const profile = await SDK.users.getProfile('username')
```

### Step 3: Update React Components

**Old:**
```typescript
import { MasterAuth } from '@/master/auth'

function MyComponent() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    MasterAuth.getCurrentUser().then(setUser)
  }, [])
}
```

**New:**
```typescript
import { useAuth } from '@/hooks'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
}
```

## Complete Mapping

### Authentication

| Old | New |
|-----|-----|
| `Master.auth.login()` | `SDK.auth.login()` |
| `Master.auth.register()` | `SDK.auth.register()` |
| `Master.auth.logout()` | `SDK.auth.logout()` |
| `Master.auth.getCurrentUser()` | `SDK.auth.getCurrentUser()` |
| `Master.auth.isAuthenticated()` | `SDK.auth.isAuthenticated()` |
| `Master.auth.getToken()` | `SDK.auth.getToken()` |

### Posts

| Old | New |
|-----|-----|
| `Master.api.posts.getFeed()` | `SDK.posts.getFeed()` |
| `Master.api.posts.getPost(id)` | `SDK.posts.getPost(id)` |
| `Master.api.posts.create(data)` | `SDK.posts.create(data)` |
| `Master.api.posts.like(id)` | `SDK.posts.like(id)` |
| `Master.api.posts.unlike(id)` | `SDK.posts.unlike(id)` |

### Users/Profile

| Old | New |
|-----|-----|
| `Master.profile.get(username)` | `SDK.users.getProfile(username)` |
| `Master.profile.update(data)` | `SDK.users.update(data)` |
| `Master.profile.uploadAvatar(file)` | `SDK.users.uploadAvatar(file)` |
| `Master.profile.follow(id)` | `SDK.users.follow(id)` |
| `Master.profile.unfollow(id)` | `SDK.users.unfollow(id)` |
| `Master.profile.getFollowers(id)` | `SDK.users.getFollowers(id)` |
| `Master.profile.getFollowing(id)` | `SDK.users.getFollowing(id)` |

### Reels

| Old | New |
|-----|-----|
| `Master.api.reels.getFeed()` | `SDK.reels.getFeed()` |
| `Master.api.reels.getReel(id)` | `SDK.reels.getReel(id)` |
| `Master.api.reels.create(data)` | `SDK.reels.create(data)` |

### Notifications

| Old | New |
|-----|-----|
| `Master.notifications.getAll()` | `SDK.notifications.getAll()` |
| `Master.notifications.getUnreadCount()` | `SDK.notificationService.getUnreadCount()` |
| `Master.notifications.markRead(id)` | `SDK.notifications.markRead(id)` |
| `Master.notifications.markAllRead()` | `SDK.notifications.markAllRead()` |
| `Master.notifications.clearAll()` | `SDK.notifications.clearAll()` |
| `Master.notifications.subscribe(cb)` | `SDK.notificationService.subscribe(cb)` |

### Socket

| Old | New |
|-----|-----|
| `Master.socket.connect()` | `SDK.socket.connect()` |
| `Master.socket.disconnect()` | `SDK.socket.disconnect()` |
| `Master.socket.on(event, cb)` | `SDK.socket.on(event, cb)` |
| `Master.socket.emit(event, data)` | `SDK.socket.emit(event, data)` |
| `Master.socket.joinRoom(room)` | `SDK.socket.joinRoom(room)` |
| `Master.socket.isConnected()` | `SDK.socket.isConnected()` |

### Theme

| Old | New |
|-----|-----|
| `Master.theme.get()` | `SDK.theme.get()` |
| `Master.theme.set(theme)` | `SDK.theme.set(theme)` |
| `Master.theme.toggle()` | `SDK.theme.toggle()` |
| `Master.theme.subscribe(cb)` | `SDK.theme.subscribe(cb)` |

### Cache

| Old | New |
|-----|-----|
| `Master.cache.get(key)` | `SDK.cache.get(key)` |
| `Master.cache.set(key, data, ttl)` | `SDK.cache.set(key, data, ttl)` |
| `Master.cache.getOrFetch(...)` | `SDK.cache.getOrFetch(...)` |
| `Master.cache.clear()` | `SDK.cache.clear()` |
| `Master.cache.clearPattern(pattern)` | `SDK.cache.clearPattern(pattern)` |

## Example Migrations

### Example 1: Login Component

**Before:**
```typescript
import { MasterAuth } from '@/master/auth'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      await MasterAuth.login(email, password)
      router.push('/feed')
    } catch (error) {
      console.error('Login failed')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* form fields */}
    </form>
  )
}
```

**After:**
```typescript
import { useAuth } from '@/hooks'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()

  const handleLogin = async () => {
    try {
      await login(email, password)
      router.push('/feed')
    } catch (error) {
      console.error('Login failed')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* form fields */}
    </form>
  )
}
```

### Example 2: Feed Component

**Before:**
```typescript
import { MasterAPI } from '@/master/api'

function Feed() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    MasterAPI.posts.getFeed().then(setPosts)
  }, [])

  const handleLike = async (postId) => {
    await MasterAPI.posts.like(postId)
    // Refresh posts
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} onLike={handleLike} />
      ))}
    </div>
  )
}
```

**After:**
```typescript
import { SDK } from '@/sdk'

function Feed() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    SDK.posts.getFeed().then(data => setPosts(data.data))
  }, [])

  const handleLike = async (postId) => {
    await SDK.posts.like(postId)
    // Refresh posts
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} onLike={handleLike} />
      ))}
    </div>
  )
}
```

### Example 3: Notification Badge

**Before:**
```typescript
import { MasterNotifications } from '@/master/notifications'

function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const unsubscribe = MasterNotifications.subscribe(({ unreadCount }) => {
      setCount(unreadCount)
    })
    
    MasterNotifications.getAll()
    
    return unsubscribe
  }, [])

  return <Badge count={count} />
}
```

**After:**
```typescript
import { useNotifications } from '@/hooks'

function NotificationBadge() {
  const { unreadCount } = useNotifications()

  return <Badge count={unreadCount} />
}
```

## Benefits of New Architecture

### 1. Better Type Safety
```typescript
// Old: No type inference
const posts = await Master.api.posts.getFeed()

// New: Full type inference
const posts = await SDK.posts.getFeed() // PaginatedResponse<Post>
```

### 2. Better Error Handling
```typescript
// Old: Generic errors
try {
  await Master.auth.login(email, password)
} catch (error) {
  console.error(error)
}

// New: Typed errors
import { AuthError } from '@/core/utils/errors'

try {
  await SDK.auth.login(email, password)
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth-specific error
  }
}
```

### 3. Better Logging
```typescript
// Old: console.log everywhere
console.log('User logged in')

// New: Centralized logging
import { logger } from '@/core/utils/logger'
logger.info('User logged in', { userId: user.id })
```

### 4. Better Caching
```typescript
// Old: Manual cache management
const cached = Master.cache.get('posts')
if (!cached) {
  const posts = await fetch('/api/posts')
  Master.cache.set('posts', posts, 30000)
}

// New: Automatic caching
const posts = await SDK.posts.getFeed() // Automatically cached
```

### 5. Better React Integration
```typescript
// Old: Manual state management
const [user, setUser] = useState(null)
useEffect(() => {
  Master.auth.getCurrentUser().then(setUser)
}, [])

// New: Use hooks
const { user, loading } = useAuth()
```

## Cleanup Steps

After migration, you can safely remove:

1. `master/` folder (old master system)
2. Old imports from `@/lib/master-api`
3. Old imports from `@/lib/auth`
4. Old imports from `@/lib/profile-manager`

## Testing Your Migration

1. **Check TypeScript errors**: Run `npm run build`
2. **Test authentication**: Login/logout flows
3. **Test API calls**: Verify data fetching works
4. **Test real-time**: Check socket connections
5. **Test caching**: Verify cache behavior

## Need Help?

- Check `ARCHITECTURE.md` for detailed documentation
- Check `src/README.md` for usage examples
- All types are in `src/core/types/index.ts`
- All services are in `src/services/`

---

**The new architecture is cleaner, more maintainable, and production-ready!**
