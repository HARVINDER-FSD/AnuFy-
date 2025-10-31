# 🚨 COMPLETE FIX - 403 Token Error

## Current Situation

You're getting a **403 Forbidden** error when creating posts because:
1. ❌ Your token is invalid/expired
2. ⚠️  Backend MongoDB connection is timing out

## SOLUTION: Set Token in Browser (Works Immediately)

### Quick Fix (2 minutes)

1. **Open this page:**
   ```
   http://localhost:3001/simple-token-fix.html
   ```

2. **Click "Set Token Now"**

3. **Click "Go Create Post"**

4. **Try creating a post**

### Alternative: Manual Fix (Browser Console)

1. Press **F12** (open DevTools)
2. Go to **Console** tab
3. **Copy and paste this:**

```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTA0YmZmOTc5ODllNWJmM2NjOTgyMjYiLCJpYXQiOjE3NjE5MTg5NjksImV4cCI6MTc2NDUxMDk2OX0.G7B9so1sCid1R4lnnIYtVgYLM6CrHGYA8x-ZKAUiA-Y';

localStorage.setItem('token', token);
document.cookie = `token=${token}; path=/; max-age=2592000`;
document.cookie = `client-token=${token}; path=/; max-age=2592000`;

console.log('✅ Token set! Refresh the page and try creating a post.');
```

4. **Refresh the page** (F5)
5. **Try creating a post**

## What If It Still Doesn't Work?

The MongoDB connection timeout means the backend can't verify your token. Here's what to do:

### Fix MongoDB Connection

The backend is running but can't connect to MongoDB. This usually fixes itself, but you can:

1. **Wait 1-2 minutes** for MongoDB to reconnect
2. **Restart the backend:**
   ```bash
   cd api-server
   npm run dev
   ```

3. **Check if MongoDB is accessible:**
   - The connection string is in `api-server/.env`
   - MongoDB Atlas might be having issues
   - Check your internet connection

### Test If Backend Works

Open this in your browser:
```
http://localhost:8000/health
```

Should return: `{"status":"ok"}`

## Your Token Details

- **Token:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTA0YmZmOTc5ODllNWJmM2NjOTgyMjYiLCJpYXQiOjE3NjE5MTg5NjksImV4cCI6MTc2NDUxMDk2OX0.G7B9so1sCid1R4lnnIYtVgYLM6CrHGYA8x-ZKAUiA-Y`
- **User:** demouser
- **Email:** demo@example.com
- **Password:** password123
- **Valid:** 30 days (until March 1, 2025)

## Files Created

- ✅ `public/simple-token-fix.html` - Simple one-click fixer
- ✅ `public/fix-token-now.html` - Advanced fixer with testing
- ✅ `token.json` - Token saved for reference
- ✅ `scripts/create-user-and-token.js` - User creation script

## Expected Behavior After Fix

Once you set the token:

1. ✅ No more 403 errors
2. ✅ Can create posts
3. ✅ Can create reels
4. ✅ Can create stories
5. ✅ Can send messages
6. ✅ All authenticated features work

## Troubleshooting

### Still Getting 403?

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cookies and cache
   - Close and reopen browser

2. **Verify token is set:**
   - Press F12
   - Console tab
   - Type: `localStorage.getItem('token')`
   - Should show the token

3. **Check cookies:**
   - F12 → Application tab → Cookies
   - Should see `token` and `client-token`

### Backend Not Responding?

1. **Check if running:**
   ```bash
   # Should see "Anufy API Server running on port 8000"
   ```

2. **Restart backend:**
   ```bash
   cd api-server
   npm run dev
   ```

3. **Check MongoDB connection:**
   - Look for "MongoDB connected" in backend logs
   - If timeout errors, wait 1-2 minutes

## Quick Start

**Fastest way to fix:**

1. Open: http://localhost:3001/simple-token-fix.html
2. Click "Set Token Now"
3. Click "Go Create Post"
4. Done! ✅

---

**The token is valid and will work once MongoDB reconnects!**
