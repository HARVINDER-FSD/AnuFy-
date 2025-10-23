# Ownership Authorization Implementation

## Overview
This document describes the comprehensive ownership authorization system implemented for all delete operations in the social media backend. **Only the account owner who created content can permanently delete it.**

## Implementation Date
Implemented on: Current Session

## Affected Services

### 1. Post Service (`services/post.ts`)
**Method:** `deletePost(postId: string, userId: string)`

**Authorization Flow:**
1. Checks if the post exists and is not already archived
2. Verifies that the requesting user is the post owner
3. Performs soft delete (sets `is_archived = true`)
4. Clears relevant caches

**Error Responses:**
- `404 Not Found` - Post doesn't exist
- `403 Forbidden` - User is not the post owner

**Delete Type:** Soft Delete (archived, not permanently removed from database)

---

### 2. Reel Service (`services/reel.ts`)
**Method:** `deleteReel(reelId: string, userId: string)`

**Authorization Flow:**
1. Checks if the reel exists
2. Verifies that the requesting user is the reel owner
3. Performs hard delete (permanently removes from database)
4. Deletes associated likes and comments
5. Removes media files from S3 storage
6. Clears relevant caches

**Error Responses:**
- `404 Not Found` - Reel doesn't exist
- `403 Forbidden` - User is not the reel owner

**Delete Type:** Hard Delete (permanently removed from database and storage)

---

### 3. Story Service (`services/story.ts`)
**Method:** `deleteStory(storyId: string, userId: string)`

**Authorization Flow:**
1. Checks if the story exists
2. Verifies that the requesting user is the story owner
3. Performs soft delete (sets `is_archived = true`)
4. Deletes associated story views
5. Removes media file from S3 storage
6. Clears relevant caches

**Error Responses:**
- `404 Not Found` - Story doesn't exist
- `403 Forbidden` - User is not the story owner

**Delete Type:** Soft Delete (archived) + Media file removal from storage

---

### 4. Comment Service (`services/comment.ts`)
**Method:** `deleteComment(commentId: string, userId: string)`

**Authorization Flow:**
1. Checks if the comment exists
2. Verifies the comment is not already deleted
3. Verifies that the requesting user is the comment owner
4. Performs soft delete (sets `is_deleted = true`)
5. Updates cached post comment counts
6. Clears relevant caches

**Error Responses:**
- `404 Not Found` - Comment doesn't exist or already deleted
- `403 Forbidden` - User is not the comment owner

**Delete Type:** Soft Delete (marked as deleted, not permanently removed)

---

## Security Features

### 1. **Explicit Ownership Verification**
Every delete operation now includes a dedicated ownership check:
```typescript
if (resource.user_id !== userId) {
  throw errors.forbidden("You don't have permission to delete this [resource]. Only the [resource] owner can delete it.")
}
```

### 2. **Two-Step Verification**
- **Step 1:** Check if resource exists
- **Step 2:** Verify ownership before deletion

### 3. **Clear Error Messages**
Users receive specific error messages:
- Resource not found (404)
- Permission denied with explanation (403)

### 4. **Authentication Required**
All delete endpoints require authentication via the `authenticateToken` middleware in routes.

---

## API Endpoints

### Posts
```
DELETE /api/posts/:postId
Authorization: Bearer <token>
```

### Reels
```
DELETE /api/reels/:reelId
Authorization: Bearer <token>
```

### Stories
```
DELETE /api/stories/:storyId
Authorization: Bearer <token>
```

### Comments
```
DELETE /api/posts/comments/:commentId
Authorization: Bearer <token>
```

---

## Testing Scenarios

### ✅ Authorized Delete (Success)
1. User creates a post/reel/story/comment
2. Same user attempts to delete it
3. **Result:** Successfully deleted with 200 OK

### ❌ Unauthorized Delete (Failure)
1. User A creates a post/reel/story/comment
2. User B attempts to delete it
3. **Result:** 403 Forbidden with message "You don't have permission to delete this [resource]. Only the [resource] owner can delete it."

### ❌ Non-existent Resource (Failure)
1. User attempts to delete a non-existent resource
2. **Result:** 404 Not Found with message "[Resource] not found"

### ❌ Unauthenticated Request (Failure)
1. Request without authentication token
2. **Result:** 401 Unauthorized

---

## Database Impact

### Soft Deletes (Posts, Stories, Comments)
- Records remain in database with flag set
- `posts.is_archived = true`
- `stories.is_archived = true`
- `comments.is_deleted = true`
- Can be recovered if needed
- Still counted in database but filtered from queries

### Hard Deletes (Reels)
- Records permanently removed from database
- Associated data (likes, comments) also deleted
- Media files removed from S3 storage
- Cannot be recovered

---

## Cache Management

All delete operations properly invalidate relevant caches:
- Individual resource caches
- Feed caches
- User-specific caches
- Comment caches

---

## Best Practices Implemented

1. ✅ **Principle of Least Privilege** - Only owners can delete their content
2. ✅ **Fail-Safe Defaults** - Deny access by default, grant only to owners
3. ✅ **Defense in Depth** - Multiple layers of verification
4. ✅ **Clear Audit Trail** - Explicit error messages for debugging
5. ✅ **Consistent Authorization** - Same pattern across all services

---

## Future Enhancements

Potential improvements for consideration:
- Admin override capability for content moderation
- Soft delete for reels (instead of hard delete)
- Bulk delete operations with ownership verification
- Delete operation logging for audit trails
- Scheduled permanent deletion of soft-deleted content

---

## Maintenance Notes

When adding new content types:
1. Implement the same two-step verification pattern
2. Use explicit ownership checks
3. Provide clear error messages
4. Ensure proper cache invalidation
5. Document the delete type (soft vs hard)
