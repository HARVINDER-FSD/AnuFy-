# 🔍 Debug: User Posts Not Showing Username

## 🎯 Problem

- **Feed section**: Posts show usernames correctly ✅
- **Profile section**: Posts don't show usernames ❌

## 🔍 Root Cause

The issue is that when you upload a post, it might not have the `user_id` field properly set, or the populate isn't working.

## 🛠️ Solutions

### **Solution 1: Check MongoDB Data**

```bash
# Open MongoDB shell
mongosh

# Use your database
use socialmedia

# Check a post
db.posts.findOne()

# Should show:
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),  # ← This should be an ObjectId
  caption: "...",
  media_urls: ["..."],
  ...
}
```

### **Solution 2: Check if user_id is String or ObjectId**

If `user_id` is stored as a **string** instead of **ObjectId**, the populate won't work!

```javascript
// Wrong (string)
user_id: "507f1f77bcf86cd799439011"

// Correct (ObjectId)
user_id: ObjectId("507f1f77bcf86cd799439011")
```

### **Solution 3: Fix Post Creation**

When creating a post, make sure to save `user_id` as ObjectId:

```typescript
// In post creation API
import { ObjectId } from 'mongodb'

await Post.create({
  user_id: new ObjectId(userId),  // ← Convert to ObjectId
  caption: "...",
  media_urls: ["..."]
})
```

### **Solution 4: Alternative - Use Aggregation**

If populate doesn't work, use MongoDB aggregation like the feed does:

```typescript
const posts = await Post.aggregate([
  {
    $match: { 
      user_id: new ObjectId(userId),
      is_deleted: false 
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'user'
    }
  },
  {
    $unwind: '$user'
  },
  {
    $sort: { created_at: -1 }
  }
])
```

## 🧪 Testing Steps

### **Step 1: Check Browser Console**

Open browser console and look for:
```
Fetching posts for user: 507f1f77bcf86cd799439011
Found posts: 3
First post user_id: { _id: ..., username: '...', ... }
```

If you see:
```
First post user_id: 507f1f77bcf86cd799439011  # ← String, not object!
```

Then populate didn't work!

### **Step 2: Check Network Tab**

1. Open DevTools → Network tab
2. Go to profile page
3. Look for: `GET /api/posts/user/[userId]`
4. Check response:

```json
{
  "posts": [
    {
      "id": "...",
      "user": {
        "username": "johndoe",  // ← Should have this
        "avatar_url": "...",
        "is_verified": false
      }
    }
  ]
}
```

If `user` is `null`, populate didn't work!

### **Step 3: Check MongoDB**

```bash
mongosh
> use socialmedia
> db.posts.findOne()

# Check the user_id field type
> db.posts.findOne().user_id
ObjectId("...")  # ← Should be ObjectId, not string
```

## 🔧 Quick Fixes

### **Fix 1: Update API Endpoint (Already Done)**

Added logging and null checks to `/api/posts/user/[userId]/route.ts`

### **Fix 2: Convert user_id to ObjectId**

If posts have string user_id, convert them:

```bash
mongosh
> use socialmedia
> db.posts.find().forEach(function(post) {
    if (typeof post.user_id === 'string') {
      db.posts.updateOne(
        { _id: post._id },
        { $set: { user_id: ObjectId(post.user_id) } }
      )
    }
  })
```

### **Fix 3: Use Test Posts**

The test posts in profile page now have correct structure, so they should work!

## ✅ Expected Behavior

### **After Fix**

1. Go to profile
2. See posts in grid
3. Click any post
4. ✅ Should show your username
5. ✅ Should show your avatar
6. ✅ Should show verified badge (if applicable)

### **Console Logs**

```
Fetching posts for user: 507f1f77bcf86cd799439011
Found posts: 3
First post user_id: {
  _id: ObjectId("..."),
  username: "johndoe",
  full_name: "John Doe",
  avatar_url: "...",
  is_verified: false
}
Transformed posts: 3
First transformed post user: {
  id: "...",
  username: "johndoe",
  full_name: "John Doe",
  avatar: "...",
  avatar_url: "...",
  is_verified: false
}
```

## 🎯 Comparison

### **Feed (Working)**
```typescript
// Uses aggregation with $lookup
const posts = await postsCollection.aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'user'
    }
  }
])
```

### **Profile (Need to Fix)**
```typescript
// Uses Mongoose populate
const posts = await Post.find({ user_id: userId })
  .populate('user_id', 'username full_name avatar_url is_verified')
```

## 🚀 Recommended Solution

Use the same aggregation approach as feed:

```typescript
import { ObjectId } from 'mongodb'

const posts = await Post.aggregate([
  {
    $match: { 
      user_id: new ObjectId(userId),
      is_deleted: false,
      is_archived: false
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'user'
    }
  },
  {
    $unwind: '$user'
  },
  {
    $project: {
      _id: 1,
      user_id: 1,
      caption: 1,
      media_urls: 1,
      media_type: 1,
      location: 1,
      likes_count: 1,
      comments_count: 1,
      shares_count: 1,
      created_at: 1,
      'user.username': 1,
      'user.full_name': 1,
      'user.avatar_url': 1,
      'user.is_verified': 1
    }
  },
  {
    $sort: { created_at: -1 }
  }
])
```

## 📝 Next Steps

1. Check browser console for logs
2. Check Network tab for API response
3. Check MongoDB data structure
4. If needed, convert user_id to ObjectId
5. Or use aggregation instead of populate

---

**The logging is now added, so check your browser console to see what's happening!** 🔍
