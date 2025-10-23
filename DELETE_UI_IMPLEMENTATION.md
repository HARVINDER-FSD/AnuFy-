# Delete UI Implementation Guide

## Overview
This document describes where and how users can delete their posts, reels, and stories in the UI.

## Delete Button Locations

### 📱 Posts (`components/posts/post-card.tsx`)

**Location:** Top-right corner of each post card

**How to Access:**
1. Click the **three dots (⋯)** button in the post header
2. A dropdown menu appears
3. **If you own the post:** "Delete Post" option appears in red
4. **If you don't own the post:** "Report Post" option appears instead

**Delete Flow:**
1. Click "Delete Post" from dropdown
2. Confirmation dialog appears: "Delete Post?"
3. Click "Delete" button (red) to confirm or "Cancel" to abort
4. Post is permanently deleted and removed from view
5. Success toast notification appears

---

### 🎬 Reels (`components/reels/reel-player.tsx`)

**Location:** Top-right corner of reel player

**How to Access:**
1. Click the **three dots (⋯)** button in the top-right
2. A dropdown menu appears
3. **If you own the reel:** "Delete Reel" option appears in red
4. **If you don't own the reel:** "Report Reel" option appears instead

**Delete Flow:**
1. Click "Delete Reel" from dropdown
2. Confirmation dialog appears: "Delete Reel?"
3. Warning message: "This will permanently delete your reel and remove it from our servers"
4. Click "Delete" button (red) to confirm or "Cancel" to abort
5. Reel is permanently deleted including video files
6. Success toast notification appears

---

### 📖 Stories (`components/stories/story-viewer.tsx`)

**Location:** Top-right corner of story viewer

**How to Access:**
1. Click the **three dots (⋯)** button next to the X (close) button
2. A dropdown menu appears
3. **If you own the story:** "Delete Story" option appears in red
4. **If you don't own the story:** "Report Story" option appears instead

**Delete Flow:**
1. Click "Delete Story" from dropdown
2. Confirmation dialog appears: "Delete Story?"
3. Warning message: "This will permanently delete your story"
4. Click "Delete" button (red) to confirm or "Cancel" to abort
5. Story is deleted and story viewer closes
6. Success toast notification appears

---

## Visual Design

### Dropdown Menu
- **Icon:** Three horizontal dots (MoreHorizontal)
- **Position:** Top-right corner of content
- **Style:** Ghost button, subtle hover effect

### Delete Option
- **Icon:** Trash can icon (Trash2)
- **Text Color:** Red (destructive)
- **Visibility:** Only shown to content owners

### Confirmation Dialog
- **Title:** "Delete [Content Type]?"
- **Description:** Warning about permanent deletion
- **Buttons:**
  - **Cancel:** Gray, left-aligned
  - **Delete:** Red background, right-aligned

---

## Authorization Logic

### Ownership Detection
```typescript
const isOwner = currentUserId === content.user.id || content.isOwner
```

### Conditional Rendering
- **Owner sees:** Delete option
- **Non-owner sees:** Report option
- **Not logged in:** No dropdown menu

---

## Component Props

### PostCard
```typescript
interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
  currentUserId?: string
  // ... other props
}
```

### ReelPlayer
```typescript
interface ReelPlayerProps {
  reel: Reel
  onDelete?: (reelId: string) => void
  currentUserId?: string
  // ... other props
}
```

### StoryViewer
```typescript
interface StoryViewerProps {
  stories: Story[]
  onDelete?: (storyId: string) => void
  currentUserId?: string
  // ... other props
}
```

---

## API Integration

### Delete Endpoints

**Posts:**
```typescript
DELETE /api/posts/:postId
```

**Reels:**
```typescript
DELETE /api/reels/:reelId
```

**Stories:**
```typescript
DELETE /api/stories/:storyId
```

### Error Handling

**403 Forbidden:**
- Message: "You can only delete your own [content]"
- Action: Shows error toast, keeps content visible

**Other Errors:**
- Message: "Failed to delete [content]"
- Action: Shows error toast, keeps content visible

**Success:**
- Message: "Your [content] has been deleted successfully"
- Action: Removes content from view, shows success toast

---

## User Experience Features

### ✅ Ownership Verification
- Delete button only visible to content owners
- Server-side validation prevents unauthorized deletions

### ✅ Confirmation Dialog
- Prevents accidental deletions
- Clear warning about permanent action
- Easy to cancel

### ✅ Visual Feedback
- Toast notifications for all actions
- Loading states during deletion
- Immediate UI update on success

### ✅ Accessibility
- Keyboard navigation supported
- Screen reader friendly
- Clear button labels

---

## Testing Checklist

### As Content Owner:
- [ ] Can see delete option in dropdown
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] Content disappears after deletion
- [ ] Success toast appears

### As Non-Owner:
- [ ] Cannot see delete option
- [ ] See "Report" option instead
- [ ] Cannot delete others' content

### Error Scenarios:
- [ ] Network error shows error toast
- [ ] 403 error shows permission denied message
- [ ] Content remains visible on error

---

## Screenshots Locations

### Post Delete Button
- **File:** `post-card.tsx`
- **Line:** 329-351
- **Element:** DropdownMenu with Trash2 icon

### Reel Delete Button
- **File:** `reel-player.tsx`
- **Line:** 332-354
- **Element:** DropdownMenu with Trash2 icon

### Story Delete Button
- **File:** `story-viewer.tsx`
- **Line:** 177-199
- **Element:** DropdownMenu with Trash2 icon

---

## Dependencies

### UI Components Used:
- `DropdownMenu` - For options menu
- `AlertDialog` - For confirmation
- `Button` - For all interactive elements
- `useToast` - For notifications

### Icons Used:
- `MoreHorizontal` - Three dots menu icon
- `Trash2` - Delete icon
- `X` - Close icon

---

## Future Enhancements

Potential improvements:
- Bulk delete multiple items
- Soft delete with undo option
- Delete history/trash folder
- Scheduled deletion
- Delete analytics
