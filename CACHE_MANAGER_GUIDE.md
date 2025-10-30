# Master Cache Manager Guide

## 🎯 One File Controls All Caching

All app caching is now controlled from **`lib/cache-manager.ts`**

## 🚀 How to Force Cache Refresh

### Option 1: Update Version (Recommended)
Edit `lib/cache-manager.ts`:
```typescript
export const APP_VERSION = "1.0.4"  // Increment this number
```

**That's it!** All users will automatically get the new version on next page load.

### Option 2: Clear Local Cache
Run the PowerShell script:
```powershell
./clear-all-cache.ps1
```

## 📋 What Gets Cached

### Development Mode
- ❌ No page caching
- ❌ No API caching  
- ❌ No image caching
- ✅ Instant updates

### Production Mode
- ✅ Pages cached (with revalidation)
- ✅ API responses cached (60s)
- ✅ Images cached (1 hour)
- ✅ Optimized performance

## 🔧 Features

### Automatic Version Detection
The app automatically detects version changes and refreshes:
```typescript
// User opens app
// Old version: 1.0.2
// New version: 1.0.3
// → Automatic cache clear + reload
```

### Version in Every Request
All API calls include version header:
```
X-App-Version: 1.0.3
```

### Cache-Busted URLs
```typescript
import { getVersionedUrl } from '@/lib/cache-manager'

const url = getVersionedUrl('/api/posts')
// Result: /api/posts?v=1.0.3
```

### Manual Cache Clear
```typescript
import { clearClientCache } from '@/lib/cache-manager'

// Clear cache and reload
clearClientCache()
```

## 📝 Common Tasks

### Deploy New Features
1. Update code
2. Increment `APP_VERSION` in `lib/cache-manager.ts`
3. Deploy
4. Users automatically get new version

### Fix Cache Issues
1. Increment `APP_VERSION`
2. Restart dev server
3. Refresh browser

### Debug Cache
Check browser console:
```
🔧 Cache Manager: v1.0.3 (development)
```

Check HTML body:
```html
<body data-app-version="1.0.3">
```

## 🎨 Current Version

**v1.0.3** - Instagram-style create page with tabs

## 📊 Version History

- v1.0.3 - Added POST/STORY/REEL tabs to create page
- v1.0.2 - Mobile optimizations
- v1.0.1 - Initial cache manager

## ⚡ Pro Tips

1. **Always increment version** when deploying new features
2. **Use semantic versioning**: Major.Minor.Patch
3. **Test in incognito** to verify cache behavior
4. **Check console** for version logs

## 🐛 Troubleshooting

### Cache not clearing?
- Increment `APP_VERSION`
- Close all browser tabs
- Open in incognito mode

### Old version showing?
- Check `localStorage.getItem('app-version')`
- Clear browser data
- Hard refresh (Ctrl+Shift+R)

---

**Remember:** One version number controls everything! 🎯
