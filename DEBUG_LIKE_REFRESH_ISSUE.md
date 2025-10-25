# Debug: Like Removed After Refresh

## How to Debug This Issue

### Step 1: Open Browser Console
Press F12 to open Developer Tools and go to the Console tab.

### Step 2: Like a Post
1. Go to your profile page
2. Click on a post to open the modal
3. Click the heart icon to like it
4. Watch the console for these logs:

**Expected logs when liking:**
```
[Modal] Like clicked - current state: { isLiked: false, likesCount: X, itemId: "..." }
[Modal] Calling API: /api/posts/.../like
[Like API] Post ID: ...
[Like API] Token found: true
[Like API] User ID: ...
[Like API] Post found: true
[Like API] Inserting like: { post_id: ObjectId(...), user_id: ObjectId(...), created_at: ... }
[Like API] Like inserted with ID: ...
[Like API] Success - liked: true count: X likedBy: [...]
```

**Key things to check:**
- ✅ Is the like being inserted? Look for "Like inserted with ID"
- ✅ What are the post_id and user_id values?
- ✅ Is the response showing `liked: true`?

### Step 3: Refresh the Page
Press F5 to refresh the page and watch for these logs:

**Expected logs when loading posts:**
```
Fetching posts for user: ...
Current user ID: ...
Found posts: X
[User Posts API] Found likes: X
[User Posts API] Sample like: { _id: ..., post_id: ObjectId(...), user_id: ObjectId(...), created_at: ... }
[User Posts API] User has liked X posts: ["postId1", "postId2", ...]
[User Posts API] Post postId1: is_liked=true, likes_count=X
[User Posts API] Post postId2: is_liked=false, likes_count=X
[User Posts API] Transformed posts: X
```

**Key things to check:**
- ✅ Is "Found likes" showing the correct number?
- ✅ Does the liked posts array include your post ID?
- ✅ Is the post showing `is_liked=true`?

### Step 4: Compare IDs
This is the most common issue - the post IDs don't match!

**In the like API logs, note the post_id:**
```
[Like API] Inserting like: { post_id: ObjectId("507f1f77bcf86cd799439011"), ... }
```

**In the user posts API logs, note the post IDs:**
```
[User Posts API] User has liked 1 posts: ["507f1f77bcf86cd799439011"]
[User Posts API] Post 507f1f77bcf86cd799439011: is_liked=true
```

**If the IDs don't match, that's your problem!**

## Common Issues

### Issue 1: Post ID Mismatch
**Symptom:** Like is saved but not showing after refresh
**Cause:** The post ID used when liking doesn't match the post ID when fetching
**Check:** 
- Look at the post ID in the like API logs
- Look at the post IDs in the user posts API logs
- They should be identical strings

**Fix:** The issue might be in how the post ID is being passed to the modal or API.

### Issue 2: User ID Mismatch
**Symptom:** Likes are saved but not associated with the right user
**Cause:** The user ID in the like doesn't match the current user ID
**Check:**
- Look at `user_id` in the like insertion log
- Look at `Current user ID` in the user posts API log
- They should be identical

**Fix:** Check token decoding in both APIs.

### Issue 3: Like Not Being Saved
**Symptom:** No "Like inserted with ID" log appears
**Cause:** The like API is failing silently or returning an error
**Check:**
- Look for error messages in the console
- Check if the API response shows `success: false`

**Fix:** Check the API error logs.

### Issue 4: Database Connection Issue
**Symptom:** Likes collection is empty even after liking
**Cause:** Database connection or collection name mismatch
**Check:**
- Verify MongoDB is running
- Check the collection name is "likes" (not "post_likes" or something else)

**Fix:** Check your MongoDB connection and collection names.

### Issue 5: Token Not Being Sent
**Symptom:** "No current user ID or invalid format" in logs
**Cause:** Authentication token is not being sent with the request
**Check:**
- Look for "Current user ID: ..." in the logs
- If it says "No current user ID", the token is missing

**Fix:** Check that cookies are being sent with the API request.

## Manual Database Check

If you want to verify the database directly:

### Check if like was saved:
```javascript
// In MongoDB shell or Compass
db.likes.find({ user_id: ObjectId("YOUR_USER_ID") })
```

### Check post IDs:
```javascript
db.posts.find({ user_id: ObjectId("YOUR_USER_ID") }, { _id: 1 })
```

### Verify like exists for specific post:
```javascript
db.likes.findOne({ 
  post_id: ObjectId("YOUR_POST_ID"),
  user_id: ObjectId("YOUR_USER_ID")
})
```

## What Should Happen

### Correct Flow:
1. **Like Post:**
   - API receives post ID and user ID
   - Inserts document into `likes` collection
   - Returns `{ success: true, liked: true, likeCount: X }`

2. **Refresh Page:**
   - API fetches all posts for user
   - API queries `likes` collection for current user
   - API checks if each post ID is in the liked set
   - API returns posts with correct `is_liked` status

3. **Display:**
   - Profile page receives posts with `is_liked: true`
   - Grid shows red heart on hover
   - Modal shows red filled heart

## Next Steps

Based on the console logs, identify which step is failing:

1. **If like is not being inserted** → Check like API
2. **If like is inserted but not found on refresh** → Check ID matching
3. **If like is found but not displayed** → Check UI components
4. **If no logs appear** → Check if APIs are being called

## Report Your Findings

When reporting the issue, include:
1. Screenshot of console logs when liking
2. Screenshot of console logs after refresh
3. The post ID from both logs
4. The user ID from both logs
5. Any error messages

This will help identify the exact problem!
