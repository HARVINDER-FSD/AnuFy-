# Create Flow - Tab Navigation System

## Overview
The create flow now uses a tab-based navigation system where users select media on the main `/create` page and then navigate to specific pages for editing.

## Flow Structure

### 1. Main Create Page (`/create`)
- **Gallery & Camera Interface**: Users can browse gallery or use camera to capture/select media
- **Bottom Tabs**: POST | STORY | REEL
- **Next Button**: Navigates to the specific create page based on selected tab

**Features:**
- Camera with front/back switching
- Photo capture for posts
- Video recording for stories/reels (60s limit for reels)
- Flash toggle
- Gallery grid with file picker
- Tab selection (Post/Story/Reel)

### 2. Individual Create Pages

#### `/create/post`
- Receives selected media from sessionStorage
- Square aspect ratio preview
- Caption input
- Options: Add location, Tag people, Add emoji
- Share button uploads to `/api/posts/instagram`

#### `/create/story`
- Receives selected media from sessionStorage
- Full-screen preview
- Editing tools: Add text, Stickers, Download
- Share to Story button uploads to `/api/stories/instagram`
- Stories expire after 24 hours

#### `/create/reel`
- Receives selected media from sessionStorage
- 9:16 aspect ratio preview
- Caption input
- Options: Add music, Add effects, Adjust volume
- Share button uploads to `/api/reels`

## Data Flow

1. User selects/captures media on `/create`
2. User clicks tab (POST/STORY/REEL)
3. User clicks "Next"
4. Media is stored in sessionStorage:
   - `createMedia`: Base64 data URL
   - `createMediaType`: MIME type (image/jpeg, video/webm, etc.)
   - `createMediaName`: File name
5. Router navigates to `/create/{type}`
6. Individual page retrieves media from sessionStorage
7. After successful upload, sessionStorage is cleared

## Session Storage Keys
- `createMedia` - Base64 encoded media preview
- `createMediaType` - MIME type of the media
- `createMediaName` - Original file name

## User Experience

**Before (Old Flow):**
- Separate pages with duplicate camera/gallery code
- Confusing navigation

**After (New Flow):**
- Single media selection interface
- Clear tab-based navigation
- Consistent UX across all content types
- Selected media persists across navigation
- Type-specific editing features on dedicated pages

## Testing

1. Go to `/create`
2. Select a photo from gallery or capture with camera
3. Click POST tab → Next → Should see post editor
4. Go back, select video
5. Click REEL tab → Next → Should see reel editor with 9:16 preview
6. Verify media persists correctly
7. Test upload functionality for each type
