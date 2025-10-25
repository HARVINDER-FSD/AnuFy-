# Like Persistence Debug Guide

## Changes Made

### 1. Added State Synchronization
**File:** `components/profile/instagram-post-modal.tsx`

Added a new `useEffect` to sync the modal's internal state when the item prop changes:
```typescript
// Sync state when item prop changes (for like updates from parent)
useEffect(() => {
    if (item) {
        setIsLiked(item.liked || item.is_liked || false)
        setLikesCount(item.likes || item.likes_count || 0)
    }
}, [item?.liked, item?.is_liked, item?.likes, item?.likes_count])
```

This ensures that when the parent component updates the item, the modal reflects those changes.

### 2. Enhanced Logging
Added comprehensive console logging to track the like flow:

**In Modal (`instagram-post-modal.tsx`):**
- Logs when like button is clicked
- Logs API endpoint being called
- Logs API response
- Logs when parent is notified
- Warns if no callback is provided

**In ContentGrid (`content-grid.tsx`):**
- Logs when like update is received
- Logs the updated local items
- Logs the updated selected item
- Logs when parent component is notified

### 3. Visual Feedback in Grid
**File:** `components/profile/content-grid.tsx`

Updated the hover overlay to show red heart when post is liked:
```typescript
<Heart className={`w-6 h-6 ${item.is_liked || item.liked ? 'fill-red-500 text-red-500' : 'fill-white'}`} />
```

## How to Debug

### Step 1: Open Browser Console
Open your browser's developer tools (F12) and go to the Console tab.

### Step 2: Like a Post
1. Go to your profile page
2. Click on a post to open the modal
3. Click the heart icon to like the post

### Step 3: Check Console Logs
You should see logs in this order:

```
[Modal] Like clicked - current state: { isLiked: false, likesCount: 0, itemId: "..." }
[Modal] Calling API: /api/posts/.../like
[Like API] Post ID: ...
[Like API] Token found: true
[Like API] User ID: ...
[Like API] Post found: true
[Like API] Success - liked: true count: 1 likedBy: ["username"]
[Modal] API response: { success: true, liked: true, likeCount: 1, likedBy: [...] }
[Modal] Notifying parent: { itemId: "...", liked: true, count: 1 }
[ContentGrid] Like update received: { itemId: "...", isLiked: true, likesCount: 1 }
[ContentGrid] Updated local items: { ..., is_liked: true, liked: true, likes: 1, likes_count: 1 }
[ContentGrid] Updated selected item: { ..., is_liked: true, liked: true, likes: 1, likes_count: 1 }
```

### Step 4: Verify Visual Updates
After liking:
1. The heart icon in the modal should be red and filled
2. The like count should increase
3. Close the modal
4. Hover over the post in the grid - the heart should be red
5. The like count in the hover overlay should be updated

### Step 5: Test Unlike
1. Open the same post again
2. Click the heart icon to unlike
3. Check console logs - should show `liked: false` and decremented count
4. Verify the heart is no longer red

## Common Issues

### Issue: "No onLikeUpdate callback provided"
**Cause:** The ContentGrid is not passing the callback to the modal.
**Fix:** Check that ContentGrid is passing `onLikeUpdate={handleLikeUpdate}` to InstagramPostModal.

### Issue: Like count updates in modal but not in grid
**Cause:** The local state in ContentGrid is not being updated.
**Fix:** Check the console logs to see if `[ContentGrid] Like update received` appears.

### Issue: Like reverts after closing modal
**Cause:** The parent component (profile page) is not receiving updates.
**Fix:** The profile page needs to pass an `onLikeUpdate` callback to ContentGrid.

### Issue: API returns error
**Cause:** Authentication issue or post not found.
**Fix:** Check the `[Like API]` logs for specific error messages.

## Testing Checklist

- [ ] Like a post - heart turns red, count increases
- [ ] Unlike a post - heart turns gray, count decreases
- [ ] Close modal and reopen - like state persists
- [ ] Hover over post in grid - shows correct like count
- [ ] Like multiple posts - each maintains its own state
- [ ] Refresh page - likes persist (from database)
- [ ] Check notifications collection - notification created on like
- [ ] Unlike post - notification removed

## Next Steps

If likes still don't persist:
1. Check if the profile page is re-fetching posts and overwriting the state
2. Verify the API is actually saving to the database
3. Check if there's a race condition with multiple state updates
4. Ensure the item IDs match between grid and modal

## Remove Debug Logs

Once everything works, remove the console.log statements:
- Search for `console.log('[Modal]` in `instagram-post-modal.tsx`
- Search for `console.log('[ContentGrid]` in `content-grid.tsx`
- Remove or comment out these lines
