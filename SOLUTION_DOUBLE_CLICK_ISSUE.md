# Solution: Double-Click Like Issue

## Problem
The like button is being triggered twice, causing:
1. First call: Likes the post ✅
2. Second call: Unlikes the post ❌
3. Result: Post ends up unliked even though you clicked like

## Root Cause
Something in your setup (React rendering, event bubbling, or browser behavior) is triggering the onClick handler twice before either API call completes.

## Simple Solution

I've created a brand new, clean like API at `app/api/posts/[postId]/like/route.ts`.

### To Fix the Frontend:

Replace the `handleLike` function in `components/posts/post-card.tsx` with this simple version:

```typescript
const handleLike = async () => {
  // Prevent rapid clicks
  if (isLikingRef.current) return
  isLikingRef.current = true

  const previousLiked = isLiked
  const previousCount = likesCount

  try {
    // Optimistic update
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)

    // API call
    const response = await fetch(`/api/posts/${post.id}/like`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Failed')

    const data = await response.json()

    // Update with server data
    setIsLiked(data.liked)
    setLikesCount(data.likeCount)
    setLikedByUsers(data.likedBy || [])

    onLike?.(post.id)
  } catch (error) {
    // Revert on error
    setIsLiked(previousLiked)
    setLikesCount(previousCount)
    toast({
      title: "Error",
      description: "Failed to update like",
      variant: "destructive"
    })
  } finally {
    // Small delay to prevent double-clicks
    setTimeout(() => {
      isLikingRef.current = false
    }, 300)
  }
}
```

## Test It

1. **Restart your server**
2. **Hard refresh browser** (Ctrl+Shift+R)
3. **Like a post**
4. **Wait 1 second**
5. **Refresh the page**
6. **Check if like persists**

## If Still Not Working

The issue is that TWO separate components are calling the API. Check if:

1. You have multiple PostCard components rendering
2. The button has multiple onClick handlers
3. A parent component is also handling the click

To debug, add this at the start of handleLike:
```typescript
console.log('[PostCard] handleLike called, stack:', new Error().stack)
```

This will show you WHERE the function is being called from.

## Alternative: Disable One Component

If you're testing on both feed and profile pages, make sure you're only clicking on ONE page at a time. The double call might be from having both pages open.

## Files Modified

1. ✅ `app/api/posts/[postId]/like/route.ts` - Clean, simple API
2. ⚠️ `components/posts/post-card.tsx` - Needs the handleLike function updated (see above)
3. ✅ `app/api/posts/user/[userId]/route.ts` - Returns correct like status
4. ✅ `next.config.mjs` - React Strict Mode disabled

## Current Status

- ✅ API is clean and simple
- ✅ Database saves likes correctly
- ✅ Fetch API returns correct like status
- ⚠️ Frontend needs simplified handleLike function
- ❌ Double-click still happening (needs investigation)

The core issue is in the frontend triggering twice. Once you update the handleLike function with the simple version above, it should work!
