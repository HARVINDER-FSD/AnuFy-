# Debug Shared Reel Issues - Step by Step Guide

## Issue: Thumbnail Not Showing & Reel Not Opening

### Step 1: Open Browser Console
1. Press `F12` or `Right-click → Inspect`
2. Go to the **Console** tab
3. Clear any old messages
4. Refresh the chat page

### Step 2: Check What's Being Logged

When you view a shared reel in chat, you should see:

```javascript
[SharedContentPreview] Rendering: {
  contentType: "post",
  contentId: "67890abc...",
  hasPreviewData: true,
  media_url: "http://localhost:3000/uploads/video.mp4",  // ← Check this URL
  media_type: "video",
  username: "milanrangollarts",  // ← Check this exists
  fullPreviewData: { ... }
}
```

### Step 3: Diagnose the Problem

#### Problem A: `media_url` is undefined or null
```javascript
media_url: undefined  // ← BAD
```

**Cause:** The reel video URL wasn't saved when sharing

**Fix:** Check that when sharing, the reel player passes `reel.video`:
```typescript
// In components/reels/reel-player.tsx
<ShareModal
  previewData={{
    media_url: reel.video,  // ← Must be the video URL
    media_type: 'video',
    caption: reel.caption,
    username: reel.user.username,
    avatar: reel.user.avatar
  }}
/>
```

#### Problem B: `media_url` is wrong format
```javascript
media_url: "video.mp4"  // ← BAD (no path)
media_url: "/uploads/video.mp4"  // ← GOOD
```

**Cause:** Relative URL without proper path

**Fix:** Ensure video URLs are complete paths

#### Problem C: Image fails to load
```javascript
[SharedContentPreview] Image load error: http://...
```

**Cause:** 
- File doesn't exist
- CORS issue
- Wrong URL

**Fix:** 
1. Copy the URL from console
2. Paste it in browser address bar
3. See if it loads
4. If 404, file is missing
5. If CORS error, check server headers

#### Problem D: `username` is undefined
```javascript
username: undefined  // ← BAD
```

**Cause:** Username not passed when sharing

**Fix:** Ensure username is included in preview data

### Step 4: Test Click Functionality

Click on the shared reel and check console:

```javascript
[SharedContentPreview] Clicked: {
  contentType: "post",
  contentId: "...",
  previewData: { username: "milanrangollarts" }
}
[SharedContentPreview] Navigating to profile: milanrangollarts
```

If you see this, navigation should work!

#### Problem E: Click does nothing
**Symptoms:** No console log when clicking

**Causes:**
- Element is covered by another element
- Click handler not attached
- JavaScript error blocking execution

**Fix:**
1. Check for JavaScript errors in console
2. Try clicking different parts of the card
3. Check if other elements are blocking it

#### Problem F: Navigation fails
```javascript
[SharedContentPreview] Navigating to profile: milanrangollarts
// But page doesn't change
```

**Causes:**
- Router not working
- Profile page doesn't exist
- Navigation blocked

**Fix:**
1. Try manually going to `/profile/milanrangollarts`
2. If that works, router issue
3. If that fails, profile page issue

### Step 5: Check Network Tab

1. Open **Network** tab in DevTools
2. Reload the chat
3. Look for image/video requests
4. Check their status:
   - ✅ 200 = Success
   - ❌ 404 = Not found
   - ❌ 403 = Forbidden
   - ❌ 500 = Server error

### Step 6: Verify Data in Database

The message should be stored like this:

```javascript
{
  content: "Shared a post",
  message_type: "shared_post",
  shared_content: {
    content_type: "post",
    content_id: "67890abc...",
    preview_data: {
      media_url: "http://localhost:3000/uploads/video.mp4",
      media_type: "video",
      caption: "Check this out!",
      username: "milanrangollarts",
      avatar: "http://localhost:3000/uploads/avatar.jpg"
    }
  }
}
```

Check MongoDB:
```bash
# Connect to MongoDB
mongosh

# Use your database
use socialmedia

# Find recent messages
db.messages.find().sort({created_at: -1}).limit(1).pretty()

# Check if shared_content exists
db.messages.findOne({message_type: "shared_post"})
```

### Step 7: Common Fixes

#### Fix 1: Thumbnail Not Showing
```typescript
// Make sure video URL is correct when sharing
previewData={{
  media_url: reel.video || reel.video_url,  // Try both
  media_type: 'video',
  // ...
}}
```

#### Fix 2: Click Not Working
```typescript
// Add stopPropagation
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()  // ← Prevents event bubbling
  // ... navigation code
}
```

#### Fix 3: Wrong Navigation
```typescript
// Use window.location as fallback
if (previewData?.username) {
  try {
    router.push(`/profile/${previewData.username}`)
  } catch (error) {
    window.location.href = `/profile/${previewData.username}`
  }
}
```

### Step 8: Test with Simple Data

Create a test message manually:

```javascript
// In browser console on chat page
const testMessage = {
  _id: "test123",
  sender_id: "currentUserId",
  content: "Test shared reel",
  message_type: "shared_post",
  shared_content: {
    content_type: "post",
    content_id: "test456",
    preview_data: {
      media_url: "https://via.placeholder.com/400x600",  // Test image
      media_type: "video",
      caption: "Test caption",
      username: "testuser",
      avatar: "https://via.placeholder.com/100"
    }
  },
  created_at: new Date()
}

// This should render a preview with the placeholder image
```

### Step 9: Enable Verbose Logging

The component now logs:
- When rendering
- When image loads
- When image fails
- When clicked
- Where navigating

Check all these logs to find where it fails.

### Step 10: Quick Fixes to Try

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Restart dev server**
4. **Check if logged in** (auth token exists)
5. **Try different browser**
6. **Check mobile vs desktop**

## Expected Console Output

### When Sharing
```
[ShareModal] Sharing with data: {
  content: "Shared a post",
  message_type: "shared_post",
  shared_content: {
    content_type: "post",
    content_id: "abc123",
    preview_data: {
      media_url: "http://localhost:3000/uploads/video.mp4",
      media_type: "video",
      username: "milanrangollarts",
      ...
    }
  }
}
```

### When Viewing
```
[SharedContentPreview] Rendering: {
  contentType: "post",
  hasPreviewData: true,
  media_url: "http://localhost:3000/uploads/video.mp4",
  ...
}
[SharedContentPreview] Image loaded successfully: http://localhost:3000/uploads/video.mp4
```

### When Clicking
```
[SharedContentPreview] Clicked: { contentType: "post", ... }
[SharedContentPreview] Navigating to profile: milanrangollarts
```

## Still Not Working?

Share these details:
1. Console logs (all of them)
2. Network tab screenshot
3. The actual media_url value
4. Any error messages
5. Browser and OS

## Quick Test

Try this in browser console on the chat page:
```javascript
// Test if router works
window.location.href = '/reels'

// If that works, try
window.location.href = '/profile/testuser'
```

If these work, the issue is with the click handler or data.
