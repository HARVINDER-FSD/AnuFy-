# Photo Not Showing - Debug Guide

## Issue
When selecting a photo in story creator, the image doesn't display.

## Added Debug Logs
I've added console.log statements to track the issue:

1. **File Selection**: Logs when file is selected
2. **FileReader**: Logs when preview data is ready
3. **Image Load**: Logs when image successfully renders
4. **Errors**: Logs any errors during load

## How to Debug

### Step 1: Open Browser Console
- Press F12 or right-click → Inspect
- Go to Console tab

### Step 2: Try Selecting Photo
1. Go to `/stories/create`
2. Click "Photo" button
3. Select an image file
4. Watch the console

### Expected Console Output
```
File selected: photo.jpg image/jpeg
FileReader loaded, setting preview
Image loaded successfully
```

### Possible Issues & Solutions

#### Issue 1: No logs at all
**Problem**: File input not triggering
**Solution**: Check if button click is working
```javascript
// The button should trigger: fileInputRef.current?.click()
```

#### Issue 2: "File selected" but no "FileReader loaded"
**Problem**: FileReader failing
**Solution**: File might be corrupted or wrong format

#### Issue 3: "FileReader loaded" but no "Image loaded"
**Problem**: Image not rendering
**Possible causes**:
- CSS hiding the image
- selectedMedia state not updating
- React not re-rendering

#### Issue 4: Image load error
**Problem**: Invalid data URL or file format
**Check**: File type and size

## Quick Test
Try this in browser console after selecting photo:
```javascript
// Check if state has media
console.log('Has media:', document.querySelector('img[alt="Story"]'))

// Check if file input exists
console.log('File input:', document.querySelector('input[type="file"][accept="image/*"]'))
```

## Common Fixes

### Fix 1: Clear browser cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Fix 2: Check file size
- Very large files might timeout
- Try with a small image first (< 1MB)

### Fix 3: Check file format
- Supported: JPG, PNG, GIF, WebP
- Try different image format

### Fix 4: Check browser permissions
- Some browsers block file access
- Try different browser

## Code Changes Made

### 1. Added console logs to handleMediaSelect
```typescript
console.log('File selected:', file.name, file.type)
console.log('FileReader loaded, setting preview')
console.log('Cloudinary upload success:', result.url)
```

### 2. Added image load handlers
```typescript
onLoad={() => console.log('Image loaded successfully')}
onError={(e) => console.error('Image load error:', e)}
```

### 3. Added background color
```typescript
className="relative w-full h-full max-w-md bg-black"
```

## Next Steps
1. Open browser console
2. Select a photo
3. Share the console output with me
4. I'll identify the exact issue

The debug logs will tell us exactly where the process is failing!
