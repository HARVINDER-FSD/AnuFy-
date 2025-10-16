# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ✅ FIXED: Module Not Found Errors

#### Issue 1: `socket.io-client` not found
```
Error: Can't resolve 'socket.io-client'
```

**Solution**: ✅ FIXED
```bash
npm install socket.io-client
```

#### Issue 2: `jsonwebtoken` file missing
```
Error: ENOENT: no such file or directory, open '.../jsonwebtoken/index.js'
```

**Solution**: ✅ FIXED
```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

---

## General Troubleshooting Steps

### 1. Clear Next.js Cache
If you're experiencing build or runtime errors:

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force .next

# Then restart dev server
npm run dev
```

### 2. Reinstall Dependencies
If packages are corrupted or missing:

```bash
# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall everything
npm install
```

### 3. Clear npm Cache
If installations are failing:

```bash
npm cache clean --force
npm install
```

### 4. Check Node Version
Ensure you're using a compatible Node.js version:

```bash
node --version
# Should be v18.x or higher
```

---

## Chat-Specific Issues

### WebSocket Connection Fails

**Symptoms**:
- Messages not sending
- Typing indicators not working
- "Connecting to chat server..." message persists

**Solutions**:

1. **Check Socket.IO server is running**:
   - Make sure your backend server is running
   - Check the server logs for Socket.IO initialization

2. **Verify environment variable**:
   ```env
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   ```

3. **Check browser console**:
   - Look for connection errors
   - Verify the WebSocket URL is correct

4. **CORS issues**:
   - Ensure your backend allows CORS from your frontend domain
   ```javascript
   // Backend server.js
   const io = require('socket.io')(server, {
     cors: {
       origin: "http://localhost:3001", // Your Next.js dev server
       methods: ["GET", "POST"]
     }
   });
   ```

### Authentication Issues

**Symptoms**:
- "Authentication required" errors
- Redirected to login page
- Token not found errors

**Solutions**:

1. **Check cookies**:
   - Open DevTools → Application → Cookies
   - Verify `token` or `client-token` exists

2. **Clear cookies and re-login**:
   ```javascript
   // In browser console
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

3. **Check token format**:
   - Ensure JWT token is valid
   - Verify token hasn't expired

### File Upload Issues

**Symptoms**:
- Images/videos not uploading
- "Upload failed" errors

**Solutions**:

1. **Check file size limits**:
   - Default Next.js limit is 4MB
   - Increase in `next.config.js`:
   ```javascript
   module.exports = {
     api: {
       bodyParser: {
         sizeLimit: '10mb',
       },
     },
   }
   ```

2. **Verify upload endpoint**:
   - Check `/api/messages/conversations/:id/upload` exists
   - Ensure proper authentication

3. **Check file types**:
   - Verify accepted MIME types
   - Check file extension validation

---

## Build Errors

### TypeScript Errors

**Issue**: Type errors during build
```
Type 'X' is not assignable to type 'Y'
```

**Solutions**:

1. **Install missing type definitions**:
   ```bash
   npm install --save-dev @types/package-name
   ```

2. **Check tsconfig.json**:
   - Ensure `strict: true` is set
   - Verify `include` paths are correct

3. **Restart TypeScript server**:
   - In VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Import Errors

**Issue**: Module resolution errors
```
Cannot find module '@/components/...'
```

**Solutions**:

1. **Check tsconfig.json paths**:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

2. **Verify file exists**:
   - Check the file path is correct
   - Ensure file extension matches (.tsx, .ts, .jsx, .js)

---

## Performance Issues

### Slow Message Loading

**Solutions**:

1. **Implement pagination**:
   - Load messages in batches (50 at a time)
   - Use infinite scroll

2. **Add message caching**:
   - Cache recent conversations
   - Use React Query or SWR

3. **Optimize images**:
   - Use Next.js Image component
   - Compress images before upload

### High Memory Usage

**Solutions**:

1. **Limit message history**:
   - Only keep recent messages in state
   - Unload old messages on scroll

2. **Optimize re-renders**:
   - Use React.memo for message components
   - Implement virtual scrolling

---

## Database Issues

### MongoDB Connection Errors

**Issue**: Can't connect to database
```
MongoServerError: Authentication failed
```

**Solutions**:

1. **Check connection string**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/social-media
   ```

2. **Verify MongoDB is running**:
   ```bash
   # Check if MongoDB service is running
   Get-Service MongoDB
   ```

3. **Check credentials**:
   - Verify username/password
   - Ensure user has correct permissions

---

## Production Deployment Issues

### Environment Variables Not Working

**Solutions**:

1. **Rebuild after adding env vars**:
   ```bash
   npm run build
   npm start
   ```

2. **Use NEXT_PUBLIC_ prefix for client-side vars**:
   ```env
   NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
   ```

3. **Check deployment platform**:
   - Vercel: Add in Project Settings → Environment Variables
   - Netlify: Add in Site Settings → Environment Variables

### WebSocket Not Working in Production

**Solutions**:

1. **Use HTTPS for WebSocket**:
   ```env
   NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
   ```

2. **Configure reverse proxy**:
   - Nginx: Add WebSocket upgrade headers
   - Cloudflare: Enable WebSocket support

3. **Check firewall rules**:
   - Allow WebSocket connections
   - Open required ports

---

## Quick Fixes Checklist

When something breaks, try these in order:

- [ ] Restart dev server (`Ctrl+C` then `npm run dev`)
- [ ] Clear Next.js cache (`Remove-Item -Recurse -Force .next`)
- [ ] Check browser console for errors
- [ ] Verify environment variables are set
- [ ] Check network tab for failed requests
- [ ] Reinstall dependencies (`npm install`)
- [ ] Clear npm cache (`npm cache clean --force`)
- [ ] Restart VS Code / IDE
- [ ] Check Git for recent changes
- [ ] Revert to last working commit

---

## Getting Help

### Useful Commands

```bash
# Check installed packages
npm list socket.io-client
npm list jsonwebtoken

# Verify package integrity
npm audit

# Update packages
npm update

# Check for outdated packages
npm outdated
```

### Debug Mode

Enable verbose logging:

```javascript
// In your component
console.log('Socket connected:', isConnected)
console.log('Messages:', messages)
console.log('User:', user)
```

### Browser DevTools

1. **Console**: Check for JavaScript errors
2. **Network**: Monitor API calls and WebSocket connections
3. **Application**: Inspect cookies and local storage
4. **Sources**: Set breakpoints for debugging

---

## Contact & Support

If you're still experiencing issues:

1. Check the documentation files:
   - `ENHANCED_CHATROOM_FEATURES.md`
   - `DEPENDENCIES_INSTALLED.md`
   - `CHATROOM_SYSTEM_DESIGN.md`

2. Review the code comments in:
   - `components/chat/enhanced-chat-window.tsx`
   - `hooks/use-socket.ts`

3. Check the browser console and network tab for specific error messages

---

## Recent Fixes

### ✅ lucide-react Icon Names Updated

**Issue**: `MoreVertical` icon not found in newer lucide-react versions
```
Error: Failed to read source code from .../ellipsis-vertical.js
```

**Solution**: Updated to use new icon names
- Changed `MoreVertical` → `EllipsisVertical`
- Reinstalled lucide-react@latest

**Files Updated**:
- `components/chat/enhanced-chat-window.tsx`

---

## Status: All Issues Resolved ✅

Current status of known issues:

- ✅ socket.io-client installed
- ✅ jsonwebtoken fixed and reinstalled
- ✅ @types/jsonwebtoken installed
- ✅ js-cookie installed
- ✅ lucide-react updated to latest version
- ✅ Icon names updated (MoreVertical → EllipsisVertical)
- ✅ TypeScript interfaces fixed
- ✅ All dependencies verified

**The chat system should now work without errors!** 🎉
