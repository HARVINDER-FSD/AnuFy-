# 🔍 Test Profile Data Loading

## How to Debug

### Step 1: Open Profile Edit
1. Go to: `http://localhost:3000/profile/edit`
2. Open browser console (F12)
3. Go to "Console" tab

### Step 2: Check the Logs

You should see these logs in order:

```
[Profile Edit] Starting to load user data...
[Profile Edit] Fetching fresh user data from JWT Manager...
[Profile Edit] Fresh user data received: {
  "id": "...",
  "username": "...",
  "email": "...",
  "name": "...",
  "avatar": "...",
  "bio": "...",
  ...
}
[Profile Edit] Avatar from data: ...
[Profile Edit] Bio from data: ...
[Profile Edit] Name from data: ...
[Profile Edit] Setting form data: {...}
[Profile Edit] Setting avatar preview: ...
[Profile Edit] Avatar preview set successfully
[Profile Edit] Data loading complete
```

### Step 3: Check What Data You Got

Look at the "Fresh user data received" log. Check:

**Avatar:**
- ✅ Good: `"avatar": "https://res.cloudinary.com/..."`
- ❌ Bad: `"avatar": "data:image/webp;base64,..."`
- ❌ Bad: `"avatar": "/placeholder-user.jpg"`
- ❌ Bad: `"avatar": ""`

**Bio:**
- ✅ Good: `"bio": "your actual bio text"`
- ❌ Bad: `"bio": ""`

**Name:**
- ✅ Good: `"name": "Your Name"`
- ❌ Bad: `"name": ""`

### Step 4: Check the Form

After the logs, check if the form fields are populated:
- Username field
- Email field
- Full Name field
- Bio textarea
- Avatar preview image

## Common Issues

### Issue 1: Avatar is base64
**Log shows:**
```
"avatar": "data:image/webp;base64,..."
```

**Solution:**
1. Go to `/fix-my-avatar.html`
2. Click "Load My Profile"
3. Click "Fix My Avatar"
4. Wait for conversion
5. Try `/profile/edit` again

### Issue 2: Bio is empty
**Log shows:**
```
"bio": ""
```

**Cause:** No bio in database

**Solution:** This is normal if you haven't set a bio yet. Just type one and save.

### Issue 3: No data at all
**Log shows:**
```
[Profile Edit] No data returned from JWT Manager
```

**Solutions:**
1. Check if API server is running on port 8000
2. Check if you're logged in
3. Try: `/force-logout-login.html` then log in again

### Issue 4: Form fields stay empty
**Logs show data but form is empty**

**Solution:** This is a React state issue. Try:
1. Refresh the page
2. Clear browser cache
3. Check for JavaScript errors in console

## Manual Test

If logs don't help, test the API directly:

### Test 1: Check /api/users/me
Open a new tab and paste this in console:
```javascript
fetch('/api/users/me', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie.split('token=')[1]?.split(';')[0]
  }
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
```

This shows exactly what the API returns.

### Test 2: Check JWT Manager
```javascript
import('/lib/jwt-manager.js').then(JWTManager => {
  JWTManager.default.fetchUserData(true).then(data => {
    console.log('JWT Manager data:', data)
  })
})
```

## What to Report

If it's still not working, tell me:
1. What do the console logs show?
2. Is avatar base64 or Cloudinary URL?
3. Is bio empty or has text?
4. Are form fields populated?
5. Any errors in console?

With this info, I can fix the exact issue! 🔍
