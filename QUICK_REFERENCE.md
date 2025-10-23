# Instagram Modal - Quick Reference Card

## 🚀 Quick Start

```tsx
import { InstagramPostModal } from "@/components/profile/instagram-post-modal"

<InstagramPostModal
  item={post}
  type="posts"
  currentUserId={user?.id}
  isOpen={true}
  onClose={() => setShowModal(false)}
  onDelete={(id) => handleDelete(id)}
/>
```

## 📋 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `item` | `any` | ✅ | Post/reel object |
| `type` | `"posts" \| "reels"` | ✅ | Content type |
| `currentUserId` | `string` | ❌ | Current user ID |
| `isOpen` | `boolean` | ✅ | Modal visibility |
| `onClose` | `() => void` | ✅ | Close handler |
| `onDelete` | `(id: string) => void` | ❌ | Delete callback |

## 📦 Item Object

```typescript
{
  id: string
  user: {
    id: string
    username: string
    avatar_url?: string
    full_name?: string
    is_verified?: boolean
  }
  caption?: string
  content?: string
  image?: string
  media_urls?: string[]
  video_url?: string
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
  is_saved?: boolean
  created_at?: string
  location?: string
}
```

## 🎯 Features

- ✅ Like/Unlike
- ✅ Add Comments
- ✅ View Likes List
- ✅ Save/Unsave
- ✅ Delete (owner)
- ✅ More Options Menu
- ✅ Verified Badges
- ✅ User Avatars
- ✅ Timestamps
- ✅ Responsive

## 🔌 API Endpoints

### Posts
- `GET /api/posts/:id/comments`
- `POST /api/posts/:id/comments`
- `GET /api/posts/:id/likes`
- `POST /api/posts/:id/like`
- `DELETE /api/posts/:id/like`
- `POST /api/posts/:id/save`
- `DELETE /api/posts/:id/save`
- `DELETE /api/posts/:id`

### Reels
- `GET /api/reels/:id/comments`
- `POST /api/reels/:id/comments`
- `GET /api/reels/:id/likes`
- `POST /api/reels/:id/like`
- `DELETE /api/reels/:id/like`
- `POST /api/reels/:id/save`
- `DELETE /api/reels/:id/save`
- `DELETE /api/reels/:id`

## 🎨 Key Components

```tsx
// Header
<Avatar /> + Username + Verified + More Menu

// Comments
<ScrollArea>
  Caption + User Comments with Avatars
</ScrollArea>

// Actions
❤️ Like | 💬 Comment | ✈️ Share | 🔖 Save

// Likes
"42 likes" (clickable) → Opens modal

// Comment Input
😊 [Add a comment...] [Post]
```

## 💡 Common Patterns

### Open Modal
```tsx
const [selectedPost, setSelectedPost] = useState(null)
const [showModal, setShowModal] = useState(false)

<div onClick={() => {
  setSelectedPost(post)
  setShowModal(true)
}}>
  <img src={post.image} />
</div>
```

### Handle Delete
```tsx
onDelete={(postId) => {
  setPosts(posts.filter(p => p.id !== postId))
  toast({ title: "Deleted" })
}}
```

### Handle Close
```tsx
onClose={() => {
  setShowModal(false)
  setSelectedPost(null)
}}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal doesn't open | Check `isOpen` prop |
| No user data | Verify API returns user objects |
| Can't like | Ensure user is logged in |
| Delete not showing | Check `currentUserId` matches |
| Comments not loading | Check API endpoint |

## 📱 Responsive

- **Desktop**: 60/40 split layout
- **Mobile**: Vertical stack layout
- **Tablet**: Adaptive layout

## 🎨 Customization

### Layout Ratio
```tsx
// Change from 60/40 to 70/30
<div className="md:w-[70%]"> {/* Media */}
<div className="md:w-[30%]"> {/* Details */}
```

### Colors
```tsx
// Like: fill-red-500
// Save: fill-current
// Verified: text-blue-500
// Delete: text-red-600
```

## ⚡ Performance

- Lazy load comments
- Lazy load likes
- Optimistic updates
- Efficient re-renders

## 📚 Documentation

- `INSTAGRAM_MODAL_COMPLETE.md` - Full docs
- `INSTAGRAM_VS_BASIC_COMPARISON.md` - Comparison
- `FINAL_INSTAGRAM_MODAL_SUMMARY.md` - Summary

## ✅ Checklist

- [ ] Import component
- [ ] Pass required props
- [ ] Test like/unlike
- [ ] Test add comment
- [ ] Test view likes
- [ ] Test save/unsave
- [ ] Test delete (owner)
- [ ] Test mobile view
- [ ] Test dark mode

## 🎉 Done!

Your Instagram-style modal is ready to use!
