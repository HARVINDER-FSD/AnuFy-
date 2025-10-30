# Instagram-Style Create Page Guide

## 🎉 New Page Created: `/create/new`

### Features

#### 📱 **Instagram-Style Interface**
- Full-screen black background
- Top header with X button, "New post" title, and "Next" button
- Large preview area for selected media
- Gallery grid at the bottom
- 3 tabs: POST, STORY, REEL

#### 📸 **Camera Integration**
- **Camera Tile**: First tile in the gallery grid with camera icon
- **Click to Open**: Opens fullscreen real-time camera
- **Capture Photo**: Big circular button at bottom to take photo
- **Auto-Add**: Captured photos automatically added to gallery
- **Close Camera**: X button to exit camera view

#### 🖼️ **Gallery Features**
- **Grid Layout**: 3 columns of images
- **Recents Header**: Dropdown to select albums (currently shows "Recents")
- **SELECT MULTIPLE**: Button to upload multiple files from device
- **Click to Select**: Tap any image to preview it
- **Visual Feedback**: 
  - Blue ring around selected image
  - Check mark icon on selected items
- **Video Support**: Shows duration badge on video thumbnails

#### 🎯 **Tab System**
- **POST**: For regular posts with photos
- **STORY**: For 24-hour stories
- **REEL**: For short videos
- **Active State**: White text for active tab, gray for inactive
- **Dynamic Accept**: Changes file input to accept videos when REEL tab is active

#### 🔄 **Integration Flow**
1. User selects media from gallery or captures with camera
2. Clicks "Next" button
3. Media is stored in sessionStorage
4. Routes to appropriate page:
   - POST → `/create/post`
   - STORY → `/stories/create`
   - REEL → `/create/reel`
5. Target page loads media from sessionStorage

### How to Access

#### Option 1: From Main Create Page
1. Go to `/create`
2. Click the first card: "New Post (Instagram Style)"
3. Opens `/create/new`

#### Option 2: Direct URL
- Navigate directly to `/create/new`
- Optional: Add `?tab=STORY` or `?tab=REEL` to pre-select tab

### Technical Details

#### Camera Permissions
- Uses `navigator.mediaDevices.getUserMedia()`
- Requests camera access with `facingMode: "environment"` (back camera)
- Handles permission errors gracefully
- Cleans up camera stream on unmount

#### File Handling
- Accepts images for POST and STORY tabs
- Accepts videos for REEL tab
- Multiple file selection supported
- Converts files to base64 data URLs for preview

#### State Management
- Uses React hooks for local state
- sessionStorage for passing media between pages
- Proper cleanup of camera streams

### Browser Compatibility
- ✅ Chrome/Edge (full support)
- ✅ Safari (full support)
- ✅ Firefox (full support)
- ⚠️ Requires HTTPS for camera access (or localhost)

### Mobile Experience
- Optimized for mobile screens
- Touch-friendly interface
- Native camera integration
- Gallery access through file input

### Next Steps

The page is fully functional! You can now:
1. Test the camera functionality
2. Upload images from your device
3. Switch between tabs
4. Select media and proceed to create posts/stories/reels

### Customization Options

Want to customize? You can easily:
- Change colors (currently black theme)
- Add filters or editing tools
- Add more tabs
- Customize gallery layout
- Add album selection
- Add image cropping
- Add text overlays

Enjoy your new Instagram-style create experience! 🚀
