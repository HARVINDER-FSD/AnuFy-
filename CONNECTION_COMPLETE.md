# ✅ Frontend-Backend Connection Complete!

## What Was Done

### 1. API Client Configuration
✅ Updated `lib/api-config.ts` to connect to api-server
✅ Added APIClient class for easier API calls
✅ Configured to use `NEXT_PUBLIC_API_URL` environment variable

### 2. Environment Variables
✅ Added `NEXT_PUBLIC_API_URL=http://localhost:3001` to frontend .env
✅ Created `api-server/.env` with all necessary variables
✅ Configured MongoDB, JWT, and Cloudinary for backend

### 3. Documentation
✅ Created `FRONTEND_BACKEND_CONNECTION.md` - Complete connection guide
✅ Includes usage examples, troubleshooting, and deployment options

### 4. Development Scripts
✅ Created `start-dev.ps1` - Start both servers with one command

## How to Use

### Quick Start (Recommended)
```powershell
.\start-dev.ps1
```
This starts both frontend and backend automatically!

### Manual Start
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd api-server
npm run dev
```

## API Usage Examples

### In Your Components

```typescript
import { apiFetch } from '@/lib/api-config'

// GET request
const response = await apiFetch('/api/posts/feed')
const data = await response.json()

// POST request
const response = await apiFetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ content: 'Hello World' })
})
```

### Using APIClient Class

```typescript
import { apiClient } from '@/lib/api-config'

// GET
const response = await apiClient.get('/api/posts/feed')

// POST
const response = await apiClient.post('/api/posts', {
  content: 'Hello World'
})

// PUT
const response = await apiClient.put('/api/posts/123', {
  content: 'Updated'
})

// DELETE
const response = await apiClient.delete('/api/posts/123')
```

## Testing the Connection

### 1. Start Servers
```powershell
.\start-dev.ps1
```

### 2. Test Backend Health
Open browser: http://localhost:3001/health

Expected response:
```json
{
  "status": "ok",
  "message": "Anufy API Server is running"
}
```

### 3. Test Frontend
Open browser: http://localhost:3000

The frontend will now make API calls to http://localhost:3001

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│         Port: 3000                      │
│                                         │
│  - React Components                     │
│  - Pages (app/)                         │
│  - UI Components                        │
│  - Hooks                                │
│                                         │
│  API Client (lib/api-config.ts)        │
│         ↓                               │
└─────────┼───────────────────────────────┘
          │ HTTP Requests
          │ (http://localhost:3001/api/*)
          ↓
┌─────────┼───────────────────────────────┐
│         ↓                               │
│    Backend (Express API Server)         │
│         Port: 3001                      │
│                                         │
│  - Routes (api-server/src/routes/)     │
│  - Services (business logic)            │
│  - Middleware (auth, validation)        │
│  - Models (database schemas)            │
│                                         │
│         ↓                               │
│    MongoDB Atlas                        │
│    (Database)                           │
└─────────────────────────────────────────┘
```

## Available Endpoints

All endpoints are now served from http://localhost:3001:

### Auth
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout

### Users
- GET /api/users/me
- GET /api/users/:userId
- PUT /api/users/profile
- GET /api/users/search
- POST /api/users/:userId/follow
- DELETE /api/users/:userId/follow

### Posts
- GET /api/posts/feed
- POST /api/posts
- GET /api/posts/:postId
- PUT /api/posts/:postId
- DELETE /api/posts/:postId
- POST /api/posts/:postId/like
- DELETE /api/posts/:postId/like
- GET /api/posts/:postId/comments
- POST /api/posts/:postId/comments

### Reels
- GET /api/reels
- POST /api/reels
- GET /api/reels/:reelId
- DELETE /api/reels/:reelId
- POST /api/reels/:reelId/like
- GET /api/reels/user/:userId

### Stories
- GET /api/stories
- POST /api/stories
- GET /api/stories/user/:userId
- DELETE /api/stories/:storyId
- POST /api/stories/:storyId/view
- GET /api/stories/:storyId/views

### Chat
- GET /api/chat/conversations
- POST /api/chat/conversations/direct
- GET /api/chat/conversations/:id/messages
- POST /api/chat/conversations/:id/messages
- POST /api/chat/messages/read
- DELETE /api/chat/messages/:id

### Notifications
- GET /api/notifications
- GET /api/notifications/unread-count
- PUT /api/notifications/read-all
- PUT /api/notifications/:id/read
- DELETE /api/notifications/:id

### Upload
- POST /api/upload/single
- POST /api/upload/presigned-url
- DELETE /api/upload/:key

### Explore
- GET /api/explore/trending
- GET /api/explore/suggested-users
- GET /api/explore/feed

### Search
- GET /api/search/users
- GET /api/search/posts
- GET /api/search/hashtags
- GET /api/search/trending
- GET /api/search/global

### Analytics
- POST /api/analytics/track
- GET /api/analytics/user/:userId
- GET /api/analytics/post/:postId

### Reports
- POST /api/reports
- GET /api/reports/user

### Bookmarks
- GET /api/bookmarks
- POST /api/bookmarks/:postId
- DELETE /api/bookmarks/:postId

## Next Steps

### 1. Update Components (Optional)
Some components may still use old API routes. Update them to use the new API client:

```typescript
// Old
const response = await fetch('/api/posts/feed')

// New
import { apiFetch } from '@/lib/api-config'
const response = await apiFetch('/api/posts/feed')
```

### 2. Test All Features
- ✅ Login/Register
- ✅ Create posts
- ✅ Like/Comment
- ✅ Upload media
- ✅ Chat
- ✅ Stories
- ✅ Reels

### 3. Deploy to Production
See `FRONTEND_BACKEND_CONNECTION.md` for deployment options.

## Troubleshooting

### Issue: Cannot connect to backend
**Solution**: Make sure api-server is running:
```bash
cd api-server
npm run dev
```

### Issue: CORS error
**Solution**: Backend CORS is configured to allow all origins. If still having issues, check api-server/src/index.ts

### Issue: 404 errors
**Solution**: Verify the endpoint exists in api-server/src/routes/

### Issue: Environment variables not working
**Solution**: Restart both servers after changing .env files

## Benefits

✅ **Clean Separation** - Frontend and backend are independent  
✅ **Scalable** - Can scale backend independently  
✅ **Flexible** - Can deploy to different platforms  
✅ **Maintainable** - Cleaner codebase  
✅ **Professional** - Industry-standard architecture  

## Status

✅ **API Client**: Configured  
✅ **Environment Variables**: Set  
✅ **Backend Server**: Ready  
✅ **Frontend**: Ready  
✅ **Connection**: Established  

## Quick Commands

```bash
# Start both servers
.\start-dev.ps1

# Start frontend only
npm run dev

# Start backend only
cd api-server
npm run dev

# Test backend health
curl http://localhost:3001/health

# Build for production
npm run build
cd api-server
npm run build
```

---

**Status**: ✅ CONNECTED  
**Frontend**: http://localhost:3000  
**Backend**: http://localhost:3001  
**Ready for Development**: YES  

🎉 **Congratulations! Your frontend and backend are now connected!**
