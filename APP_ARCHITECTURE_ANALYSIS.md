# 📊 Complete App Architecture Analysis

## 🏗️ Architecture Overview

### **Stack**
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes + Express (hybrid)
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Upstash Redis (optional)
- **Auth**: JWT (jsonwebtoken)
- **Real-time**: Socket.io
- **Storage**: Cloudinary
- **Styling**: Tailwind CSS + Radix UI

### **Key Finding**: MIXED DATABASE APPROACH ⚠️
Your app uses **BOTH**:
1. **MongoDB** (Mongoose) - Primary database
2. **PostgreSQL-style queries** - In some API routes (lib/database.ts has `query()` function)

This is causing the 404 errors!

## 📁 Project Structure

```
socialmedia/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes (Next.js)
│   │   ├── posts/[postId]/      # Post endpoints
│   │   ├── reels/[reelId]/      # Reel endpoints
│   │   ├── users/               # User endpoints
│   │   └── ...
│   ├── profile/                  # Profile pages
│   ├── feed/                     # Feed page
│   └── ...
├── models/                       # Mongoose Models
│   ├── user.ts                   # User model
│   ├── post.ts                   # Post model
│   ├── reel.ts                   # Reel model
│   └── ...
├── routes/                       # Express Routes (NOT USED)
│   ├── posts.ts                  # ❌ Not connected
│   ├── reels.ts                  # ❌ Not connected
│   └── ...
├── services/                     # Business Logic
│   ├── post.ts                   # ❌ Uses PostgreSQL
│   └── ...
├── lib/                          # Utilities
│   ├── mongodb.ts                # MongoDB connection
│   ├── database.ts               # Mixed DB utils
│   └── ...
├── components/                   # React Components
│   ├── profile/                  # Profile components
│   │   ├── instagram-post-modal.tsx  # Instagram modal
│   │   └── content-grid.tsx
│   └── ...
├── server.js                     # Express server (NOT USED)
└── server.ts                     # TypeScript server (NOT USED)
```

## 🔍 Current Issues

### 1. **Database Confusion**
```typescript
// lib/database.ts has PostgreSQL-style query function
export async function query(sql: string, params: any[]) {
  // This expects PostgreSQL but you're using MongoDB!
}

// models/ use Mongoose (MongoDB)
const Post = mongoose.model('Post', postSchema)
```

### 2. **Unused Express Servers**
- `server.js` - Not running
- `server.ts` - Not running
- `routes/` directory - Not connected

### 3. **API Routes Structure**
```
app/api/posts/[postId]/
├── route.ts              # ✅ GET, PUT, DELETE
├── like/route.ts         # ✅ POST, DELETE
├── save/route.ts         # ✅ POST, DELETE
├── comment/route.ts      # ✅ POST
├── comments/route.ts     # ❌ MISSING (we just created)
└── likes/route.ts        # ❌ MISSING (we just created)
```

## 📊 Data Models

### **User Model** (MongoDB/Mongoose)
```typescript
{
  _id: ObjectId
  username: string
  email: string
  password: string (hashed)
  full_name: string
  avatar_url: string
  is_verified: boolean
  is_private: boolean
  followers_count: number
  following_count: number
  posts_count: number
  created_at: Date
}
```

### **Post Model** (MongoDB/Mongoose)
```typescript
{
  _id: ObjectId
  user_id: ObjectId (ref: User)
  caption: string
  media_urls: string[]
  media_type: 'text' | 'image' | 'video' | 'carousel'
  location: string
  likes_count: number
  comments_count: number
  shares_count: number
  is_archived: boolean
  is_deleted: boolean
  hashtags: string[]
  mentions: string[]
  created_at: Date
}
```

### **Missing Models** ⚠️
- ❌ Comment model
- ❌ Like model
- ❌ Save/Bookmark model

## 🔌 API Endpoints Status

### **Working** ✅
```
POST   /api/posts/[postId]/like       - Like post
DELETE /api/posts/[postId]/like       - Unlike post
POST   /api/posts/[postId]/save       - Save post
DELETE /api/posts/[postId]/save       - Unsave post
POST   /api/posts/[postId]/comment    - Add comment
GET    /api/posts/[postId]            - Get post
DELETE /api/posts/[postId]            - Delete post
```

### **Missing** ❌
```
GET /api/posts/[postId]/comments  - Get all comments
GET /api/posts/[postId]/likes     - Get all likes
```

### **Same for Reels**
```
GET /api/reels/[reelId]/comments  - Missing
GET /api/reels/[reelId]/likes     - Missing
```

## 🎯 Instagram Modal Requirements

### **What It Needs**
1. ✅ Post/Reel data with user info
2. ❌ Comments list with user data
3. ❌ Likes list with user data
4. ✅ Like/unlike functionality
5. ✅ Add comment functionality
6. ✅ Save/unsave functionality
7. ✅ Delete functionality

### **What's Missing**
1. **Comment Model** - To store comments
2. **Like Model** - To store likes
3. **GET comments endpoint** - To fetch comments
4. **GET likes endpoint** - To fetch likes

## 🔧 Authentication Flow

```typescript
// Current auth in API routes
const authHeader = request.headers.get('Authorization')
const token = authHeader?.split(' ')[1]
const payload = jwt.verify(token, JWT_SECRET)
const userId = payload.userId
```

## 💾 Database Connection

### **MongoDB (Primary)**
```typescript
// lib/mongodb.ts
mongoose.connect('mongodb://127.0.0.1:27017/socialmedia')

// Models use Mongoose
const Post = mongoose.model('Post', postSchema)
```

### **PostgreSQL-style (Unused)**
```typescript
// lib/database.ts has query() function
// But it's trying to use PostgreSQL syntax with MongoDB!
export async function query(sql: string, params: any[]) {
  // This won't work with MongoDB
}
```

## 🚀 What Needs to Be Done

### **Phase 1: Create Missing Models**
1. Create `models/comment.ts`
2. Create `models/like.ts`
3. Create `models/bookmark.ts`

### **Phase 2: Create Missing API Routes**
1. `app/api/posts/[postId]/comments/route.ts` - GET, POST
2. `app/api/posts/[postId]/likes/route.ts` - GET
3. `app/api/reels/[reelId]/comments/route.ts` - GET, POST
4. `app/api/reels/[reelId]/likes/route.ts` - GET

### **Phase 3: Update Existing Routes**
1. Fix like/unlike to update Like model
2. Fix comment to use Comment model
3. Update counts in Post/Reel models

### **Phase 4: Test Instagram Modal**
1. Test opening modal
2. Test fetching comments
3. Test fetching likes
4. Test all interactions

## 📝 Recommended Architecture

### **Use Next.js API Routes Only**
```
✅ app/api/          - All API endpoints
❌ routes/           - Remove or ignore
❌ server.js         - Not needed
❌ server.ts         - Not needed
```

### **Use MongoDB/Mongoose Only**
```
✅ models/           - Mongoose models
✅ lib/mongodb.ts    - MongoDB connection
❌ lib/database.ts   - Remove PostgreSQL query()
```

### **Simplified Stack**
```
Frontend: Next.js 14 (App Router)
Backend: Next.js API Routes
Database: MongoDB (Mongoose)
Auth: JWT
Real-time: Socket.io (optional)
```

## 🎨 Instagram Modal Architecture

```
InstagramPostModal
    ↓
Fetches from API
    ↓
/api/posts/[postId]/comments
    ↓
MongoDB (Comment model)
    ↓
Returns comments with user data
    ↓
Display in modal
```

## ✅ Action Plan

### **Step 1: Create Models** (15 min)
```bash
models/comment.ts
models/like.ts
models/bookmark.ts
```

### **Step 2: Create API Routes** (30 min)
```bash
app/api/posts/[postId]/comments/route.ts
app/api/posts/[postId]/likes/route.ts
app/api/reels/[reelId]/comments/route.ts
app/api/reels/[reelId]/likes/route.ts
```

### **Step 3: Update Existing Routes** (20 min)
- Fix like route to use Like model
- Fix comment route to use Comment model
- Update post/reel counts

### **Step 4: Test** (15 min)
- Start Next.js: `npm run dev`
- Open profile
- Click post
- Test all features

## 🎯 Expected Result

After implementation:
```
✅ Modal opens
✅ Comments load with user avatars
✅ Likes list shows with user profiles
✅ Like/unlike works
✅ Add comment works
✅ Save/unsave works
✅ Delete works (owner only)
✅ No 404 errors
✅ Everything looks like Instagram
```

## 📊 Current vs Target

| Feature | Current | Target |
|---------|---------|--------|
| Database | Mixed (MongoDB + PostgreSQL) | MongoDB only |
| API | Partial | Complete |
| Models | Post, User, Reel | + Comment, Like, Bookmark |
| Endpoints | Basic | Full Instagram-style |
| Modal | UI only | Fully functional |

## 🚨 Critical Issues to Fix

1. **Remove PostgreSQL dependencies** - You're using MongoDB
2. **Create missing models** - Comment, Like, Bookmark
3. **Create missing endpoints** - Comments list, Likes list
4. **Fix existing endpoints** - Use proper models
5. **Remove unused files** - server.js, server.ts, routes/

## 🎉 Summary

Your app is **90% complete** but has:
- ✅ Great UI (Instagram-style modal)
- ✅ Good structure (Next.js 14)
- ✅ MongoDB setup
- ❌ Missing models (Comment, Like)
- ❌ Missing endpoints (GET comments, GET likes)
- ❌ Database confusion (PostgreSQL vs MongoDB)

**Solution**: Create missing models and endpoints using MongoDB/Mongoose only!

---

**Ready to implement? Let's start with Phase 1: Creating Models!** 🚀
