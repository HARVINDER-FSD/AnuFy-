# Profile Post/Reel Modal - Visual Guide

## Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [X]                                                                 │
│  ┌──────────────────────────┬────────────────────────────────────┐ │
│  │                          │  [@username] [Location]      [🗑️]  │ │
│  │                          │  ────────────────────────────────── │ │
│  │                          │                                     │ │
│  │                          │  [@username] Caption text here...   │ │
│  │      IMAGE/VIDEO         │  2 hours ago                        │ │
│  │      (60% width)         │  ────────────────────────────────── │ │
│  │                          │                                     │ │
│  │                          │  💬 Comments (scrollable)           │ │
│  │                          │  ┌─────────────────────────────┐   │ │
│  │                          │  │ [@user1] Great post!        │   │ │
│  │                          │  │ 1 hour ago                  │   │ │
│  │                          │  │                             │   │ │
│  │                          │  │ [@user2] Love this!         │   │ │
│  │                          │  │ 30 minutes ago              │   │ │
│  │                          │  └─────────────────────────────┘   │ │
│  │                          │  ────────────────────────────────── │ │
│  │                          │  ❤️ 💬                              │ │
│  │                          │                                     │ │
│  │                          │  42 likes ▼                         │ │
│  │                          │  ┌─────────────────────────────┐   │ │
│  │                          │  │ [@user1] John Doe           │   │ │
│  │                          │  │ [@user2] Jane Smith         │   │ │
│  │                          │  └─────────────────────────────┘   │ │
│  │                          │                                     │ │
│  │                          │  2 HOURS AGO                        │ │
│  │                          │  ────────────────────────────────── │ │
│  │                          │  [Add a comment...        ] [Send]  │ │
│  └──────────────────────────┴────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```
┌─────────────────────────────┐
│           [X]               │
├─────────────────────────────┤
│                             │
│                             │
│      IMAGE/VIDEO            │
│      (Full width)           │
│                             │
│                             │
├─────────────────────────────┤
│ [@username] [Location] [🗑️] │
├─────────────────────────────┤
│ [@username] Caption here... │
│ 2 hours ago                 │
├─────────────────────────────┤
│ 💬 Comments                 │
│ ┌─────────────────────────┐ │
│ │ [@user1] Great!         │ │
│ │ 1 hour ago              │ │
│ │                         │ │
│ │ [@user2] Love this!     │ │
│ │ 30 minutes ago          │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ❤️ 💬                       │
│ 42 likes ▼                  │
├─────────────────────────────┤
│ [Add comment...   ] [Send]  │
└─────────────────────────────┘
```

## Component States

### 1. Initial State (Closed)
```
Profile Grid:
┌───┬───┬───┐
│ 📷│ 📷│ 📷│  ← Click any thumbnail
├───┼───┼───┤
│ 📷│ 📷│ 📷│
└───┴───┴───┘
```

### 2. Loading State
```
┌─────────────────────────┐
│  [X]                    │
│  ┌──────────┬─────────┐ │
│  │          │ Loading │ │
│  │  IMAGE   │ ...     │ │
│  │          │         │ │
│  └──────────┴─────────┘ │
└─────────────────────────┘
```

### 3. Liked State
```
❤️ (filled red) 43 likes
```

### 4. Unliked State
```
🤍 (outline) 42 likes
```

### 5. Likes Expanded
```
42 likes ▼
┌─────────────────────────┐
│ Liked by                │
│ 👤 @user1 John Doe      │
│ 👤 @user2 Jane Smith    │
│ 👤 @user3 Bob Johnson   │
│ ...                     │
└─────────────────────────┘
```

### 6. Likes Collapsed
```
42 likes ▶
```

### 7. No Comments State
```
┌─────────────────────────┐
│      💬                 │
│   No comments yet       │
│ Be the first to comment │
└─────────────────────────┘
```

### 8. Delete Confirmation
```
┌─────────────────────────┐
│ Delete this post?       │
│ This will permanently   │
│ remove it.              │
│                         │
│ [Cancel]  [Delete]      │
└─────────────────────────┘
```

## Interaction Flow

### Like/Unlike Flow
```
User clicks ❤️
    ↓
Optimistic update (instant)
    ↓
API call to backend
    ↓
Success: Keep updated state
Failure: Revert + show error
```

### Comment Flow
```
User types comment
    ↓
User presses Enter/Send
    ↓
Disable input (submitting...)
    ↓
API call to backend
    ↓
Success: Add to list + clear input
Failure: Show error + keep text
```

### Delete Flow
```
User clicks 🗑️
    ↓
Show confirmation dialog
    ↓
User confirms
    ↓
API call to backend
    ↓
Success: Close modal + remove from grid
Failure: Show error + keep modal open
```

## Color Scheme

### Light Mode
- Background: White (#FFFFFF)
- Text: Dark Gray (#1F2937)
- Border: Light Gray (#E5E7EB)
- Like (active): Red (#EF4444)
- Like (inactive): Gray (#6B7280)

### Dark Mode
- Background: Dark Gray (#111827)
- Text: Light Gray (#F9FAFB)
- Border: Dark Gray (#374151)
- Like (active): Red (#EF4444)
- Like (inactive): Gray (#9CA3AF)

## Responsive Breakpoints

```
Mobile:    < 768px  (Vertical layout)
Tablet:    768px - 1024px (Adaptive)
Desktop:   > 1024px (Horizontal layout)
```

## Animation Timings

```
Modal open:     300ms ease-out
Modal close:    200ms ease-in
Like heart:     150ms ease-in-out
Button hover:   100ms ease-in-out
```

## Z-Index Layers

```
Modal backdrop:  z-50
Modal content:   z-50
Close button:    z-10 (relative to modal)
```

## Accessibility Features

### Keyboard Navigation
- `Tab` - Navigate between interactive elements
- `Enter` - Submit comment / Like
- `Esc` - Close modal
- `Space` - Toggle like

### Screen Reader
- Modal has `role="dialog"`
- Close button has `aria-label="Close"`
- Like button has `aria-label="Like post"`
- Comment input has `aria-label="Add a comment"`

## Example Usage Scenarios

### Scenario 1: Viewing Own Post
```
1. User clicks their post
2. Modal opens
3. Delete button visible (red)
4. User can like/comment
5. User clicks delete
6. Confirmation appears
7. Post removed
```

### Scenario 2: Viewing Others' Post
```
1. User clicks friend's post
2. Modal opens
3. No delete button
4. User can like/comment
5. User likes post
6. Heart fills red
7. Count increases
```

### Scenario 3: Adding Comment
```
1. User types "Great photo!"
2. User presses Enter
3. Comment appears immediately
4. Timestamp shows "Just now"
5. Input clears
```

### Scenario 4: Viewing Likes
```
1. User clicks "42 likes"
2. List expands
3. Shows avatars + usernames
4. User can scroll if many
5. Click again to collapse
```

## Performance Metrics

- Modal open time: < 100ms
- API response time: < 500ms
- Image load time: Depends on size
- Smooth 60fps animations

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile Safari
✅ Chrome Mobile

## Common Issues & Solutions

### Issue: Modal doesn't close on outside click
**Solution**: Click the X button or press ESC

### Issue: Comments not loading
**Solution**: Check internet connection and refresh

### Issue: Can't delete post
**Solution**: Ensure you're the post owner

### Issue: Like button not responding
**Solution**: Ensure you're logged in

### Issue: Video not playing
**Solution**: Check video format and browser support
