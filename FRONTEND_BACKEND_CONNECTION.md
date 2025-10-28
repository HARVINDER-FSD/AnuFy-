# Frontend-Backend Connection Guide

## Overview

The frontend (Next.js) now connects to the standalone API server (Express) running on port 3001.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Frontend (Next)   │         │  Backend (Express)  │
│   Port: 3000        │ ──────> │  Port: 3001         │
│   localhost:3000    │  HTTP   │  localhost:3001     │
└─────────────────────┘         └─────────────────────┘
```

## Configuration

### 1. Environment Variables

**Frontend (.env)**
```env
# API Server URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# MongoDB
MONGODB_URI=your-mongodb-uri

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Spotify
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-secret
```

**Backend (api-server/.env)**
```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=your-mongodb-uri

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Storage
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### 2. API Client Configuration

The API client is configured in `lib/api-config.ts`:

```typescript
// Automatically uses NEXT_PUBLIC_API_URL from .env
const API_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const getAPIBaseURL = () => {
  return API_SERVER_URL
}
```

## Usage

### Method 1: Using apiFetch (Recommended)

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

// With authentication
const response = await apiFetch('/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Method 2: Using APIClient Class

```typescript
import { apiClient } from '@/lib/api-config'

// GET request
const response = await apiClient.get('/api/posts/feed')
const data = await response.json()

// POST request
const response = await apiClient.post('/api/posts', {
  content: 'Hello World'
})

// PUT request
const response = await apiClient.put('/api/posts/123', {
  content: 'Updated content'
})

// DELETE request
const response = await apiClient.delete('/api/posts/123')
```

### Method 3: Direct fetch

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const response = await fetch(`${API_URL}/api/posts/feed`)
const data = await response.json()
```

## Running Both Servers

### Terminal 1: Frontend
```bash
npm run dev
```
Server runs on: http://localhost:3000

### Terminal 2: Backend
```bash
cd api-server
npm run dev
```
Server runs on: http://localhost:3001

## API Endpoints

All API endpoints are now served from the backend:

### Authentication
- POST http://localhost:3001/api/auth/login
- POST http://localhost:3001/api/auth/register
- POST http://localhost:3001/api/auth/logout

### Users
- GET http://localhost:3001/api/users/me
- GET http://localhost:3001/api/users/:userId
- PUT http://localhost:3001/api/users/profile
- GET http://localhost:3001/api/users/search

### Posts
- GET http://localhost:3001/api/posts/feed
- POST http://localhost:3001/api/posts
- GET http://localhost:3001/api/posts/:postId
- PUT http://localhost:3001/api/posts/:postId
- DELETE http://localhost:3001/api/posts/:postId

### Reels
- GET http://localhost:3001/api/reels
- POST http://localhost:3001/api/reels
- GET http://localhost:3001/api/reels/:reelId

### Stories
- GET http://localhost:3001/api/stories
- POST http://localhost:3001/api/stories
- GET http://localhost:3001/api/stories/user/:userId

### Chat
- GET http://localhost:3001/api/chat/conversations
- POST http://localhost:3001/api/chat/conversations/direct
- GET http://localhost:3001/api/chat/conversations/:id/messages

### And more...

## CORS Configuration

The backend is configured to accept requests from the frontend:

```typescript
// api-server/src/index.ts
app.use(cors({
  origin: '*', // Allow all origins for now
  credentials: true
}))
```

For production, update to:
```typescript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}))
```

## Testing the Connection

### 1. Start Both Servers
```bash
# Terminal 1
npm run dev

# Terminal 2
cd api-server
npm run dev
```

### 2. Test API Endpoint
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Anufy API Server is running"
}
```

### 3. Test from Frontend
Open browser console on http://localhost:3000 and run:
```javascript
fetch('http://localhost:3001/health')
  .then(res => res.json())
  .then(data => console.log(data))
```

## Migration from Next.js API Routes

### Before (Next.js API Routes)
```typescript
// Frontend component
const response = await fetch('/api/posts/feed')
```

### After (Standalone API Server)
```typescript
// Frontend component
import { apiFetch } from '@/lib/api-config'

const response = await apiFetch('/api/posts/feed')
```

The API client automatically adds the correct base URL!

## Troubleshooting

### Issue: CORS Error
**Solution**: Ensure api-server is running and CORS is configured correctly.

### Issue: Connection Refused
**Solution**: Check that api-server is running on port 3001:
```bash
cd api-server
npm run dev
```

### Issue: 404 Not Found
**Solution**: Verify the endpoint exists in api-server/src/routes/

### Issue: Environment Variable Not Working
**Solution**: 
1. Restart the dev server after changing .env
2. Ensure variable starts with NEXT_PUBLIC_ for client-side access

## Production Deployment

### Option 1: Same Domain (Recommended)
Deploy both on same domain with reverse proxy:
- Frontend: https://yourdomain.com
- Backend: https://yourdomain.com/api (proxied to api-server)

### Option 2: Separate Domains
- Frontend: https://app.yourdomain.com
- Backend: https://api.yourdomain.com

Update .env:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Option 3: Vercel + Separate API
- Frontend: Deploy to Vercel
- Backend: Deploy to Railway/Render/AWS

Update .env:
```env
NEXT_PUBLIC_API_URL=https://your-api-server.railway.app
```

## Next Steps

1. ✅ API client configured
2. ✅ Environment variables set
3. ⏳ Update components to use apiFetch
4. ⏳ Test all API endpoints
5. ⏳ Deploy to production

## Example Component Update

### Before
```typescript
// Using Next.js API route
const response = await fetch('/api/posts/feed')
```

### After
```typescript
import { apiFetch } from '@/lib/api-config'

// Using standalone API server
const response = await apiFetch('/api/posts/feed')
```

That's it! The API client handles the rest.

## Benefits

✅ **Separation of Concerns** - Frontend and backend are independent  
✅ **Scalability** - Backend can scale independently  
✅ **Flexibility** - Can deploy to different platforms  
✅ **Performance** - Optimized for API serving  
✅ **Maintainability** - Cleaner codebase  

---

**Status**: ✅ Connected  
**Frontend**: http://localhost:3000  
**Backend**: http://localhost:3001  
**Ready**: Yes
