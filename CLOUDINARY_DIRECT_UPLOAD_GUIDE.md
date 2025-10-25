# Cloudinary Direct Upload - Fix for Vercel 413 Error

## Problem
Vercel has a **4.5MB limit** for API route payloads. When uploading large files (videos, high-res images), you get a **413 Payload Too Large** error.

## Solution
Upload files **directly to Cloudinary** from the client, bypassing your API route.

## How to Use

### 1. Import the utility
```typescript
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary-upload';
```

### 2. Replace your upload code

**Before (causes 413 error):**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

**After (works with large files):**
```typescript
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary-upload';

// Validate file first
const validation = validateFile(file);
if (!validation.valid) {
  throw new Error(validation.error);
}

// Upload directly to Cloudinary with progress
const result = await uploadToCloudinary(file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
  setUploadProgress(progress); // Update UI
});

console.log('Uploaded:', result.url);
```

### 3. Complete Example

```typescript
const handleFileUpload = async (file: File) => {
  try {
    setUploading(true);
    setUploadProgress(0);

    // Validate
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Upload with progress
    const result = await uploadToCloudinary(file, (progress) => {
      setUploadProgress(progress);
    });

    // Use the uploaded file URL
    console.log('File uploaded:', result.url);
    
    // Now create your post/reel with the URL
    await createPost({
      media_url: result.url,
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
      // ... other fields
    });

    toast.success('Upload successful!');
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error('Upload failed');
  } finally {
    setUploading(false);
  }
};
```

## File Size Limits

- **Images**: 10MB max
- **Videos**: 100MB max

These limits are much higher than Vercel's 4.5MB API limit!

## How It Works

1. Your `/api/upload` route now only returns Cloudinary config (tiny payload)
2. The client uploads directly to Cloudinary's servers
3. No data goes through your Vercel API = no 413 error
4. You get upload progress tracking for free

## Cloudinary Setup

Make sure these are in your `.env` and Vercel environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

To create an unsigned upload preset:
1. Go to Cloudinary Dashboard
2. Settings → Upload
3. Add upload preset
4. Set to "Unsigned"
5. Copy the preset name
