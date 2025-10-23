# ✅ Comment Features Summary

## Current Features (Working Now!)

### ✅ All Users Can See Comments
- **GET endpoint is public** - No authentication required to view
- **Anyone can read comments** on posts and reels
- **Comments display for everyone** - Logged in or not

### ✅ Viewing Comments:
- ✅ Click comment button on post/reel
- ✅ Modal opens showing all comments
- ✅ See username, avatar, timestamp
- ✅ See comment content
- ✅ Scrollable list
- ✅ Real-time updates

### ✅ Adding Comments:
- ✅ Must be logged in to comment
- ✅ Type in text area
- ✅ Click send button
- ✅ Comment posts immediately
- ✅ Appears in list
- ✅ Count updates

## Features NOT Yet Implemented

### ❌ Like Comments (Not Implemented)
Currently, users **cannot** like individual comments.

**To Add This Feature, You Would Need:**

1. **Database Collection:**
```javascript
// comment_likes collection
{
  comment_id: ObjectId("..."),
  user_id: ObjectId("..."),
  created_at: Date
}
```

2. **API Endpoint:**
```
POST /api/comments/{commentId}/like
GET /api/comments/{commentId}/like
```

3. **UI Changes:**
```typescript
// Add to comment display
<Button onClick={() => likeComment(comment._id)}>
  <Heart className={comment.liked ? "fill-current" : ""} />
  <span>{comment.likes_count}</span>
</Button>
```

### ❌ Reply to Comments (Not Implemented)
Currently, users **cannot** reply to specific comments.

**To Add This Feature, You Would Need:**

1. **Database Schema Update:**
```javascript
// Add to comments collection
{
  _id: ObjectId("..."),
  post_id: ObjectId("..."),
  user_id: ObjectId("..."),
  content: "Comment text",
  parent_comment_id: ObjectId("...") || null,  // ← NEW FIELD
  created_at: Date
}
```

2. **API Endpoint:**
```
POST /api/comments/{commentId}/reply
GET /api/comments/{commentId}/replies
```

3. **UI Changes:**
```typescript
// Add reply button to each comment
<Button onClick={() => replyToComment(comment._id)}>
  Reply
</Button>

// Show nested replies
{comment.replies?.map(reply => (
  <div className="ml-8">
    {/* Reply display */}
  </div>
))}
```

## How to Implement Comment Likes

### Step 1: Create Database Collection
```javascript
// MongoDB collection: comment_likes
{
  comment_id: ObjectId,
  user_id: ObjectId,
  created_at: Date
}
```

### Step 2: Create API Route
**File:** `/app/api/comments/[commentId]/like/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  // Verify user is logged in
  const token = getToken(req);
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Check if already liked
  const existingLike = await db.collection("comment_likes").findOne({
    comment_id: new ObjectId(params.commentId),
    user_id: new ObjectId(decoded.userId)
  });
  
  if (existingLike) {
    // Unlike
    await db.collection("comment_likes").deleteOne({ _id: existingLike._id });
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await db.collection("comment_likes").insertOne({
      comment_id: new ObjectId(params.commentId),
      user_id: new ObjectId(decoded.userId),
      created_at: new Date()
    });
    return NextResponse.json({ liked: true });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  const likeCount = await db.collection("comment_likes")
    .countDocuments({ comment_id: new ObjectId(params.commentId) });
  
  return NextResponse.json({ likeCount });
}
```

### Step 3: Update Comment Display
**File:** `/components/reels/reel-player.tsx` or `/components/posts/post-card.tsx`

```typescript
// Add state for comment likes
const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});

// Add like handler
const likeComment = async (commentId: string) => {
  const response = await fetch(`/api/comments/${commentId}/like`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setCommentLikes({ ...commentLikes, [commentId]: data.liked });
};

// Update comment display
comments.map((comment) => (
  <div key={comment._id}>
    {/* Existing comment display */}
    <div className="flex items-center gap-2 mt-2">
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => likeComment(comment._id)}
      >
        <Heart className={commentLikes[comment._id] ? "fill-current text-red-500" : ""} />
        <span>{comment.likes_count || 0}</span>
      </Button>
    </div>
  </div>
))
```

## How to Implement Comment Replies

### Step 1: Update Database Schema
```javascript
// Update comments collection to support replies
{
  _id: ObjectId("..."),
  post_id: ObjectId("..."),  // or reel_id
  user_id: ObjectId("..."),
  content: "Comment text",
  parent_comment_id: null,  // ← NEW: null for top-level, ObjectId for replies
  created_at: Date,
  username: "user123",
  user_avatar: "https://..."
}
```

### Step 2: Create Reply API Route
**File:** `/app/api/comments/[commentId]/reply/route.ts`

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  const { content } = await req.json();
  const token = getToken(req);
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Get parent comment to get post/reel ID
  const parentComment = await db.collection("reel_comments")
    .findOne({ _id: new ObjectId(params.commentId) });
  
  // Create reply
  const reply = {
    reel_id: parentComment.reel_id,
    user_id: new ObjectId(decoded.userId),
    content: content,
    parent_comment_id: new ObjectId(params.commentId),  // ← Link to parent
    created_at: new Date(),
    username: user.username,
    user_avatar: user.avatar
  };
  
  await db.collection("reel_comments").insertOne(reply);
  
  return NextResponse.json({ success: true, reply });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  // Get all replies for this comment
  const replies = await db.collection("reel_comments")
    .find({ parent_comment_id: new ObjectId(params.commentId) })
    .sort({ created_at: 1 })
    .toArray();
  
  return NextResponse.json({ replies });
}
```

### Step 3: Update Comment Display
```typescript
// Fetch comments with replies
const fetchComments = async () => {
  const response = await fetch(`/api/reels/${reel.id}/comment`);
  const data = await response.json();
  
  // Group comments by parent
  const topLevel = data.comments.filter(c => !c.parent_comment_id);
  const replies = data.comments.filter(c => c.parent_comment_id);
  
  // Attach replies to parent comments
  const commentsWithReplies = topLevel.map(comment => ({
    ...comment,
    replies: replies.filter(r => r.parent_comment_id === comment._id)
  }));
  
  setComments(commentsWithReplies);
};

// Display with nested replies
comments.map((comment) => (
  <div key={comment._id}>
    {/* Main comment */}
    <div className="flex gap-3">
      <Avatar />
      <div>
        <span>{comment.username}</span>
        <p>{comment.content}</p>
        <Button onClick={() => setReplyingTo(comment._id)}>Reply</Button>
      </div>
    </div>
    
    {/* Replies (nested) */}
    {comment.replies?.map(reply => (
      <div key={reply._id} className="ml-12 mt-2">
        <div className="flex gap-3">
          <Avatar />
          <div>
            <span>{reply.username}</span>
            <p>{reply.content}</p>
          </div>
        </div>
      </div>
    ))}
    
    {/* Reply input (if replying to this comment) */}
    {replyingTo === comment._id && (
      <div className="ml-12 mt-2">
        <Textarea 
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <Button onClick={() => submitReply(comment._id)}>
          Send Reply
        </Button>
      </div>
    )}
  </div>
))
```

## Current Status

### ✅ Working Now:
- View all comments (public)
- Add comments (requires login)
- See username, avatar, timestamp
- Real-time updates
- Scrollable list
- Empty state

### ❌ Not Implemented Yet:
- Like comments
- Reply to comments
- Edit comments
- Delete comments
- Report comments
- Pin comments

## Summary

**What works now:**
- ✅ All users can see all comments
- ✅ Logged-in users can add comments
- ✅ Comments display with user info

**What needs to be added for full features:**
- ❌ Comment likes (needs API + UI)
- ❌ Comment replies (needs schema update + API + UI)

The foundation is there! Adding likes and replies would require:
1. Database changes
2. New API endpoints
3. UI updates

Would you like me to implement any of these features? 🎉
