# 🎯 Quick Reference Card

## 🚀 Start Servers
```bash
# Terminal 1: Frontend (port 3000)
npm run dev

# Terminal 2: Backend (port 8000)
cd api-server
npm start
```

## 📚 Master API - Common Operations

### Get Data
```typescript
import MasterAPI from '@/lib/master-api'

// Posts
const posts = await MasterAPI.Post.getFeed()
const post = await MasterAPI.Post.getPost(postId)

// Reels
const reels = await MasterAPI.Reel.getReels()

// Stories
const stories = await MasterAPI.Story.getStories()

// Notifications
const notifications = await MasterAPI.Notification.getNotifications()

// Search
const results = await MasterAPI.Search.search('query')

// User
const user = await MasterAPI.User.getMe()
```

### Mutations
```typescript
// Like
await MasterAPI.Post.likePost(postId)
await MasterAPI.Reel.likeReel(reelId)

// Comment
await MasterAPI.Post.commentPost(postId, 'Great post!')
await MasterAPI.Reel.commentReel(reelId, 'Nice!')

// Follow
await MasterAPI.User.followUser(userId)

// Notifications
await MasterAPI.Notification.markAsRead(notificationId)
await MasterAPI.Notification.markAsRead() // Mark all
```

### Custom Call
```typescript
await MasterAPI.call('/api/custom', {
  method: 'POST',
  body: { key: 'value' },
  cache: false,
  timeout: 15000,
  retry: 2
})
```

### Cache Management
```typescript
// Clear specific cache
MasterAPI.clearCache('/api/posts')

// Clear all cache
MasterAPI.clearAllCache()
```

## 🔧 Master Routes - API Route Pattern

### GET Route (with caching)
```typescript
import { NextRequest } from 'next/server'
import { proxyToAPI, CACHE_DURATION } from '@/lib/master-routes'

export async function GET(request: NextRequest) {
  return proxyToAPI(request, '/api/endpoint', {
    cache: true,
    cacheDuration: CACHE_DURATION.MEDIUM,
    fallback: []
  })
}
```

### POST Route (with auth)
```typescript
import { proxyToAPI, requireAuth } from '@/lib/master-routes'

export async function POST(request: NextRequest) {
  const authError = requireAuth(request)
  if (authError) return authError
  
  return proxyToAPI(request, '/api/endpoint')
}
```

## ⚙️ Configuration

### Cache Durations
```typescript
CACHE_DURATION.SHORT   // 10 seconds
CACHE_DURATION.MEDIUM  // 30 seconds
CACHE_DURATION.LONG    // 60 seconds
```

### Default Settings
```typescript
timeout: 30000    // 30 seconds
retry: 2          // 2 retries
cache: true       // For GET requests
```

## 🔍 Debugging

### Console Logs
```
[MasterAPI] Cache hit: /api/posts          ✅ Good
[MasterAPI] Request already pending        ✅ Good
[MasterAPI] Attempt 1 failed: timeout      ⚠️ Retrying
[MasterRoutes] Using fallback              ⚠️ Backend issue
```

### Clear Cache
```typescript
// In browser console
MasterAPI.clearAllCache()
```

## 📊 Performance Tips

### Use Caching
```typescript
// Good: Fast on repeat visits
cache: true, cacheDuration: CACHE_DURATION.MEDIUM

// Bad: Always hits backend
cache: false
```

### Provide Fallbacks
```typescript
// Good: No error shown to user
fallback: []

// Bad: Error shown to user
fallback: null
```

### Adjust Timeouts
```typescript
// Quick operations
timeout: 10000  // 10s

// Standard operations
timeout: 30000  // 30s (default)

// Slow operations
timeout: 60000  // 60s
```

## 🚨 Common Issues

### Stale Data
```typescript
// Solution: Clear cache
MasterAPI.clearCache('/api/posts')
```

### Timeout Errors
```typescript
// Solution: Increase timeout
MasterAPI.call('/api/endpoint', { timeout: 60000 })
```

### Too Many Requests
```typescript
// Solution: Increase cache duration
cache: true, cacheDuration: 60000
```

## 📁 File Locations

### Core Files
- `lib/master-api.ts` - Client API manager
- `lib/master-routes.ts` - Server route optimizer

### Documentation
- `START_HERE_MASTER_SYSTEM.md` - Start here!
- `MASTER_API_COMPLETE.md` - Full API docs
- `MASTER_ROUTES_COMPLETE.md` - Full routes docs
- `ALL_SYSTEMS_GO.md` - System overview

## ✅ Testing Checklist

- [ ] Start both servers
- [ ] Open http://localhost:3000
- [ ] Check console for `[MasterAPI]` logs
- [ ] Test posts feed
- [ ] Test reels
- [ ] Test stories
- [ ] Test search
- [ ] Test notifications
- [ ] Verify fast loading on repeat visits

## 🎯 Success Indicators

- ✅ Console shows cache hits
- ✅ Fast loading (especially repeat visits)
- ✅ No error messages
- ✅ Smooth interactions
- ✅ Instant responses for cached data

---

**Keep this card handy for quick reference! 📌**
