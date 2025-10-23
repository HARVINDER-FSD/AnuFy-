# Testing Guide - Authentication Fix

## What Was Fixed

1. **Created `/api/stories/instagram` route** - Missing endpoint that was causing 404 errors
2. **Fixed `/api/upload` route** - Added `client-token` cookie support and replaced CDNOptimizer with direct Cloudinary
3. **Improved error handling** - Better error messages showing exact authentication issues

## Test Steps

### 1. Check if You're Logged In

Open browser console and run:
```javascript
// Check for token
console.log('client-token:', document.cookie.split(';').find(c => c.trim().startsWith('client-token=')))
console.log('localStorage token:', localStorage.getItem('token'))
```

If no token found, you need to login first.

### 2. Login Test

1. Go to `http://localhost:3000/login`
2. Enter your credentials
3. After login, check console again for tokens
4. Should see `client-token` in cookies

### 3. Create Story Test

1. Go to story creation page
2. Select an image or video
3. Add a caption (optional)
4. Click "Share Story"
5. **Expected:** Story created successfully
6. **If error:** Check browser console for specific error message

### 4. Create Post Test

1. Go to feed page
2. Click on "What's on your mind?"
3. Add text and/or image
4. Click "Post"
5. **Expected:** Post created successfully

### 5. Create Reel Test

1. Go to `http://localhost:3000/create/reel`
2. Upload a video
3. Add caption
4. Click "Share Reel"
5. **Expected:** Reel created successfully

## Common Errors & Solutions

### Error: "You must be logged in to create"
**Cause:** No authentication token found
**Solution:** 
1. Clear cookies and localStorage
2. Login again
3. Verify token exists in cookies

### Error: "Invalid or expired token"
**Cause:** Token is corrupted or expired
**Solution:**
1. Logout
2. Clear cookies: `document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"))`
3. Clear localStorage: `localStorage.clear()`
4. Login again

### Error: "Upload failed" (500)
**Cause:** Cloudinary configuration issue
**Solution:**
Check `.env` file has:
```
CLOUDINARY_CLOUD_NAME=dcm470yhl
CLOUDINARY_API_KEY=832377464323471
CLOUDINARY_API_SECRET=RV8uRIhI2IL5eyl6InvU5s8OX2g
```

### Error: "Failed to create story/post/reel"
**Cause:** Backend API error
**Solution:**
1. Check browser console for detailed error
2. Check terminal/server logs
3. Verify MongoDB is running

## Debug Commands

### Check Authentication Status
```javascript
// In browser console
fetch('/api/users/me', {
  headers: {
    'Authorization': `Bearer ${document.cookie.split(';').find(c => c.trim().startsWith('client-token='))?.split('=')[1]}`
  }
}).then(r => r.json()).then(console.log)
```

### Test Token Validity
```javascript
// In browser console
const token = document.cookie.split(';').find(c => c.trim().startsWith('client-token='))?.split('=')[1]
if (token) {
  const decoded = JSON.parse(atob(token.split('.')[1]))
  console.log('Token payload:', decoded)
  console.log('Expires:', new Date(decoded.exp * 1000))
} else {
  console.log('No token found')
}
```

### Manual Story Creation Test
```javascript
// In browser console (after login)
const token = document.cookie.split(';').find(c => c.trim().startsWith('client-token='))?.split('=')[1]

fetch('/api/stories/instagram', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: (() => {
    const fd = new FormData()
    // You'll need to select a file first
    // fd.append('media', fileInput.files[0])
    fd.append('caption', 'Test story')
    return fd
  })()
}).then(r => r.json()).then(console.log).catch(console.error)
```

## Server Logs to Check

When testing, watch your terminal for:
- ✅ `Token verification failed:` - Shows token issues
- ✅ `Upload error:` - Shows Cloudinary issues
- ✅ `Error creating story:` - Shows story creation issues
- ✅ MongoDB connection errors

## Success Indicators

When everything works correctly:
1. No console errors
2. Success toast notification appears
3. Redirected to appropriate page
4. Content appears in feed/stories/reels

## Still Having Issues?

1. **Restart the development server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Next.js cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check MongoDB is running**
   ```bash
   # Windows
   net start MongoDB
   
   # Or check if process is running
   tasklist | findstr mongod
   ```

4. **Verify all environment variables**
   Check `.env` file exists and has all required values
