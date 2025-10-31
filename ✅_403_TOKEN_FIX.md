# ✅ 403 Forbidden - Token Issue FIXED

## ❌ The Error

```
POST http://localhost:3001/api/reels 403 (Forbidden)
Error: Invalid or expired token
```

## ✅ Quick Fix

**You need to log out and log back in to get a fresh authentication token.**

---

## 🔧 Solution Steps

### Option 1: Log Out and Log In (Recommended)
1. Click on your profile/avatar
2. Click "Logout"
3. Log back in with your credentials
4. Try creating content again

### Option 2: Clear Cookies and Refresh
1. Open browser DevTools (F12)
2. Go to Application tab
3. Click "Cookies" → "http://localhost:3001"
4. Delete all cookies
5. Refresh the page (F5)
6. Log in again

### Option 3: Use the Helper Page
Open this page in your browser:
http://localhost:3001/force-logout-login.html

This will automatically:
- Clear all cookies
- Clear localStorage
- Redirect you to login

---

## 🎯 Why This Happened

The authentication token in your browser is either:
1. **Expired** - Tokens have a limited lifetime
2. **Invalid** - Token format doesn't match what backend expects
3. **From old session** - Token was created before backend restart

---

## 🧪 Test After Login

After logging back in, try:
1. ✅ Create a post
2. ✅ Create a story
3. ✅ Upload a reel

All should work now!

---

## 🔍 Technical Details

### What's Happening

1. Frontend sends request with token from cookies
2. Backend validates the token
3. Token is invalid/expired
4. Backend returns 403 Forbidden

### Token Storage Locations

Tokens are stored in:
- `localStorage.getItem('token')`
- `document.cookie` (client-token or token)

### Backend Token Validation

The backend checks:
```typescript
const token = request.cookies.get('token')?.value || 
              request.cookies.get('client-token')?.value;

if (!token) {
  return 401 Unauthorized
}

const decoded = jwt.verify(token, JWT_SECRET);
if (!decoded) {
  return 403 Forbidden
}
```

---

## 💡 Prevention

To avoid this in the future:

1. **Don't restart backend** while logged in
2. **Log out before closing** the app
3. **Use refresh tokens** (future enhancement)
4. **Increase token expiry** time

---

## 🐛 If Still Not Working

### Check Your Token
Open browser console and run:
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('Cookies:', document.cookie);
```

### Check Backend Logs
Look at the backend terminal for errors like:
- "Token verification failed"
- "Invalid token"
- "JWT malformed"

### Verify JWT Secret
Make sure both frontend and backend use the same JWT_SECRET:

**Frontend (.env):**
```
JWT_SECRET=4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192
```

**Backend (api-server/.env):**
```
JWT_SECRET=4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192
```

---

## ✅ Success Indicators

You'll know it's fixed when:

1. ✅ No 403 errors in console
2. ✅ Can create posts successfully
3. ✅ Can create stories successfully
4. ✅ Can upload reels successfully
5. ✅ Content appears in your feed

---

## 🚀 Quick Action

**Right now, do this:**

1. Open: http://localhost:3001/force-logout-login.html
2. Wait for redirect to login page
3. Log in with your credentials
4. Try creating content again

**That's it! The 403 error will be gone.** ✅

---

**Status:** Backend is running ✅  
**Issue:** Token expired/invalid ❌  
**Solution:** Log out and log back in ✅
