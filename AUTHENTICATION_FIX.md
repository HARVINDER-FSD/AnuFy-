# Authentication Fix for Story, Reel, and Post Creation

## Problem
When creating stories, reels, or posts, users were getting "You must be logged in to create" error even when they were logged in.

## Root Cause
The frontend component `create-story.tsx` was calling `/api/stories/instagram` endpoint, but this route didn't exist. Only `/api/stories` route was available, which had different authentication handling.

## Solution Implemented

### 1. Created Missing API Route
Created `/app/api/stories/instagram/route.ts` with:
- Proper JWT token authentication from both Authorization header and cookies
- Support for `client-token` and `token` cookies
- FormData handling for media file uploads
- Cloudinary integration for media storage
- MongoDB integration for story persistence
- 24-hour expiration for stories

### 2. Authentication Flow
The authentication now works as follows:

**Token Storage:**
- Tokens are stored in both `client-token` cookie (accessible by JavaScript) and `token` cookie (httpOnly)
- Backup storage in localStorage
- 7-day expiration

**Token Retrieval in API Routes:**
```typescript
// Check Authorization header first
const authHeader = request.headers.get('Authorization');
if (authHeader && authHeader.startsWith('Bearer ')) {
  token = authHeader.split(' ')[1];
} else {
  // Fallback to cookies
  const cookies = request.headers.get('cookie');
  const tokenCookie = parts.find(c => c.startsWith('token=')) || 
                      parts.find(c => c.startsWith('client-token='));
  if (tokenCookie) token = tokenCookie.split('=')[1];
}
```

**Frontend Token Sending:**
```typescript
let token = document.cookie.split(';')
  .find(c => c.trim().startsWith('client-token='))?.split('=')[1] || 
  localStorage.getItem('token') || ''
if (token) token = token.replace(/^["']|["']$/g, '')

const response = await fetch('/api/stories/instagram', {
  method: 'POST',
  body: formData,
  headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
})
```

### 3. Verified Working Endpoints

**Stories:**
- ✅ POST `/api/stories/instagram` - Create story (NEW)
- ✅ POST `/api/stories` - Create story (existing)
- ✅ GET `/api/stories` - Get all stories

**Posts:**
- ✅ POST `/api/posts/instagram` - Create post
- ✅ POST `/api/posts` - Create post
- ✅ GET `/api/posts` - Get all posts

**Reels:**
- ✅ POST `/api/reels` - Create reel
- ✅ GET `/api/reels` - Get all reels

## Files Modified

### Created:
- `/app/api/stories/instagram/route.ts` - New Instagram-style story creation endpoint

### Existing Files (Verified Working):
- `/app/api/posts/instagram/route.ts` - Post creation with authentication
- `/app/api/reels/route.ts` - Reel creation with authentication
- `/components/stories/create-story.tsx` - Frontend story creation
- `/components/posts/create-post.tsx` - Frontend post creation
- `/app/create/reel/page.tsx` - Frontend reel creation

## Testing Steps

1. **Login:**
   - Go to `/login`
   - Login with valid credentials
   - Verify `client-token` cookie is set

2. **Create Story:**
   - Go to story creation page
   - Upload an image or video
   - Add caption
   - Click "Share Story"
   - Should succeed without "login required" error

3. **Create Post:**
   - Go to feed page
   - Use create post component
   - Upload media and add content
   - Click "Post"
   - Should succeed without authentication error

4. **Create Reel:**
   - Go to `/create/reel`
   - Upload a video
   - Add caption
   - Click "Share Reel"
   - Should succeed without authentication error

## Technical Details

**JWT Secret:** Uses `process.env.JWT_SECRET` or fallback
**MongoDB URI:** `mongodb://127.0.0.1:27017/socialmedia`
**Token Expiry:** 7 days
**Story Expiry:** 24 hours
**Media Storage:** Cloudinary

## Error Handling

All endpoints now return proper error messages:
- `401` - "You must be logged in to create" (no token)
- `401` - "Invalid or expired token" (bad token)
- `404` - "User not found" (user doesn't exist)
- `400` - "Media file is required" (missing media)
- `500` - "Failed to create" (server error)
