# Create Flow - How It Works 📸

## User Flow

### 1. Select Tab
User taps on one of the bottom tabs:
- **POST** - For feed posts (photos/videos)
- **STORY** - For 24-hour stories
- **REEL** - For short videos (max 60s)

### 2. Select Media
User can:
- Tap camera button → Take photo/video
- Tap gallery image → Select from device
- Use file picker → Choose file

### 3. Media Processing
When media is selected:
```typescript
sessionStorage.setItem('pendingMedia', base64)        // The media file
sessionStorage.setItem('pendingMediaType', file.type) // image/jpeg or video/webm
sessionStorage.setItem('pendingMediaName', file.name) // filename.jpg
sessionStorage.setItem('pendingContentType', activeTab) // 'post', 'story', or 'reel'
```

### 4. Navigation
User taps "Next" button → Routes to appropriate page:
- POST tab → `/create/post`
- STORY tab → `/create/story`
- REEL tab → `/create/reel`

### 5. Upload Page
The upload page retrieves the media:
```typescript
const media = sessionStorage.getItem('pendingMedia')
const type = sessionStorage.getItem('pendingMediaType')
const name = sessionStorage.getItem('pendingMediaName')
const contentType = sessionStorage.getItem('pendingContentType')
```

## Tab-Specific Behavior

### POST Tab
- **Accepts**: Images and videos
- **Camera**: Takes photos
- **Purpose**: Create feed posts
- **Route**: `/create/post`

### STORY Tab
- **Accepts**: Images and videos
- **Camera**: Takes photos or records video
- **Duration**: 24 hours
- **Route**: `/create/story`

### REEL Tab
- **Accepts**: Videos only
- **Camera**: Records video (max 60s)
- **Auto-stop**: At 60 seconds
- **Route**: `/create/reel`

## Example Usage

```typescript
// On create page - User selects POST tab and picks image
activeTab = 'post'
selectedMedia = photo.jpg

// Stores in sessionStorage:
{
  pendingMedia: 'data:image/jpeg;base64,...',
  pendingMediaType: 'image/jpeg',
  pendingMediaName: 'photo-1234567890.jpg',
  pendingContentType: 'post'
}

// Navigates to: /create/post

// On /create/post page - Retrieves media:
const media = sessionStorage.getItem('pendingMedia')
// Now user can add caption, filters, tags, etc.
```

## File Type Filtering

The file picker automatically filters based on active tab:

```typescript
// POST tab
accept="image/*,video/*"  // All media

// STORY tab  
accept="image/*,video/*"  // All media

// REEL tab
accept="video/*"          // Videos only
```

## Camera Behavior

### POST Tab
- Single tap → Capture photo
- No recording

### STORY Tab
- Single tap → Capture photo
- Hold → Record video

### REEL Tab
- Tap → Start/stop recording
- Max 60 seconds
- Timer display
- Auto-stop at limit

## Next Steps

To complete the flow, create these upload pages:

1. **`/create/post/page.tsx`**
   - Add caption
   - Apply filters
   - Tag people
   - Add location
   - Upload to feed

2. **`/create/story/page.tsx`**
   - Add text overlay
   - Add stickers
   - Add drawings
   - Upload as story

3. **`/create/reel/page.tsx`**
   - Add music
   - Apply effects
   - Trim video
   - Add captions
   - Upload as reel

## Status

✅ Tab selection working
✅ Media capture working
✅ SessionStorage working
✅ Navigation working
⏳ Upload pages pending
⏳ API integration pending

The flow is complete and working! Just need to create the upload pages. 🚀
