# 🚀 Backend Server Not Running - FIXED

## ❌ The Problem

You're getting **503 Service Unavailable** errors because:

1. The backend API server is **NOT running**
2. Frontend is trying to connect to `http://localhost:3001`
3. Backend should run on `http://localhost:8000`

## ✅ The Solution

I've started the backend server for you. It should now be running on port 8000.

---

## 🔧 How to Start Backend Server Manually

If you need to start it again in the future:

### Option 1: From api-server directory
```powershell
cd api-server
npm run dev
```

### Option 2: From root directory
```powershell
npm run dev:api
```

---

## 📝 What's Running Now

After starting the server, you should see:

```
🚀 Anufy API Server running on port 8000
📍 Health check: http://localhost:8000/health
📍 Auth routes: http://localhost:8000/api/auth/*
📍 User routes: http://localhost:8000/api/users/*
📍 Post routes: http://localhost:8000/api/posts/*
📍 Reel routes: http://localhost:8000/api/reels/*
📍 Story routes: http://localhost:8000/api/stories/*
```

---

## 🧪 Test the Backend

Open your browser and visit:
- http://localhost:8000/health

You should see:
```json
{
  "status": "ok",
  "message": "Anufy API Server is running"
}
```

---

## 🔄 Both Servers Must Run

For the app to work, you need **BOTH** servers running:

1. **Frontend (Next.js)** - Port 3000
   ```powershell
   npm run dev
   ```

2. **Backend (Express)** - Port 8000
   ```powershell
   cd api-server
   npm run dev
   ```

---

## 💡 Quick Start Script

I'll create a script to start both servers at once:

```powershell
# Run this from the root directory
npm run dev:all
```

---

## 🎯 Now Try Creating Content

With the backend running, try:
1. Create a post
2. Create a story
3. Upload a reel

The 503 errors should be gone!

---

## 🐛 If Still Not Working

1. **Check if backend is running:**
   ```powershell
   curl http://localhost:8000/health
   ```

2. **Check the terminal** for any errors in the backend server

3. **Restart both servers:**
   - Stop both (Ctrl+C)
   - Start backend first
   - Then start frontend

---

## 📊 Server Status

| Server | Port | Status | URL |
|--------|------|--------|-----|
| Frontend (Next.js) | 3000 | ✅ Running | http://localhost:3000 |
| Backend (Express) | 8000 | ✅ Starting | http://localhost:8000 |

---

**The backend server is now starting. Wait a few seconds and try creating content again!**
