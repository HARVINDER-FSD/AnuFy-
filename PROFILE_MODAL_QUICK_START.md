# Profile Post/Reel Modal - Quick Start Guide

## What's New?

When you click on any post or reel in a profile page, a beautiful modal now opens showing:
- 📸 Full image/video
- ❤️ Likes count + list of who liked
- 💬 All comments with timestamps
- ✍️ Add new comments
- 🗑️ Delete button (if you own the content)

## How to Use

### For Users

1. **View a Post/Reel**:
   - Go to any profile page
   - Click on any post or reel thumbnail
   - Modal opens with full details

2. **Like/Unlike**:
   - Click the heart icon
   - Icon fills red when liked
   - Count updates immediately

3. **View Who Liked**:
   - Click on the likes count (e.g., "42 likes")
   - List expands showing usernames and avatars
   - Click again to collapse

4. **Add a Comment**:
   - Type in the comment box at bottom
   - Press Enter or click Send button
   - Comment appears immediately

5. **Delete Your Content**:
   - Red delete button appears only on your own posts/reels
   - Click to delete
   - Confirmation dialog appears
   - Content removed from database and storage

6. **Close Modal**:
   - Click the X button in top-right
   - Or click outside the modal
   - Or press ESC key

### For Developers

#### Component Usage

```tsx
import { PostDetailModal } from "@/components/profile/post-detail-modal"

<PostDetailModal
  item={selectedPost}           // Post or reel object
  type="posts"                  // "posts" or "reels"
  currentUserId={user?.id}      // Current logged-in user ID
  isOpen={showModal}            // Boolean to control visibility
  onClose={() => setShowModal(false)}  // Close handler
  onDelete={(id) => handleDelete(id)}  // Optional delete callback
/>
```

#### Item Object Structure

```typescript
{
  id: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  caption?: string        // For reels
  content?: string        // For posts
  image?: string          // For posts
  media_urls?: string[]   // For posts
  video_url?: string      // For reels
  thumbnail_url?: string  // For reels
  likes?: number
  likes_count?: number
  comments?: number
  comments_count?: number
  liked?: boolean
  timestamp?: string
  location?: string
  isOwner?: boolean
}
```

## API Endpoints

The modal automatically calls these endpoints:

### Fetch Data
- `GET /api/posts/:id/comments` - Get post comments
- `GET /api/posts/:id/likes` - Get post likes
- `GET /api/reels/:id/comments` - Get reel comments
- `GET /api/reels/:id/likes` - Get reel likes

### User Actions
- `POST /api/posts/:id/like` - Like a post
- `DELETE /api/posts/:id/like` - Unlike a post
- `POST /api/posts/:id/comments` - Add comment to post
- `DELETE /api/posts/:id` - Delete post (owner only)
- `POST /api/reels/:id/like` - Like a reel
- `DELETE /api/reels/:id/like` - Unlike a reel
- `POST /api/reels/:id/comments` - Add comment to reel
- `DELETE /api/reels/:id` - Delete reel (owner only)

## Features

### ✅ Implemented
- Full content display (images/videos)
- Likes count and list
- Comments with timestamps
- Add new comments
- Like/unlike functionality
- Delete for owners
- Responsive design
- Dark mode support
- Loading states
- Error handling
- Toast notifications

### 🔄 Automatic Behaviors
- Fetches comments on open
- Fetches likes on open
- Updates counts after actions
- Closes on outside click
- Validates ownership for delete
- Formats timestamps (e.g., "2 hours ago")

## Troubleshooting

### Modal doesn't open
- Check that `isOpen` prop is true
- Verify `item` prop has data
- Check browser console for errors

### Can't like/comment
- Ensure user is logged in
- Check authentication token
- Verify API endpoints are running

### Delete button not showing
- Verify `currentUserId` matches `item.user.id`
- Check `isOwner` flag on item
- Ensure user is logged in

### Comments/likes not loading
- Check network tab for API errors
- Verify backend routes are registered
- Check database connection

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Performance

- Comments and likes are fetched only when modal opens
- Lazy loading for better performance
- Optimistic UI updates for instant feedback
- Cached data where appropriate

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- Focus management
- ARIA labels on interactive elements

## Need Help?

Check the full documentation in `PROFILE_POST_MODAL_ENHANCEMENT.md`
