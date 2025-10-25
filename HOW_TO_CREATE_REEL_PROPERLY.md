# How to Create a Reel Properly

## The Problem
You're getting `ERR_OUT_OF_RANGE` because you're trying to send the video file directly to the `/api/reels` endpoint. MongoDB has a 16MB limit, and your video is ~17MB.

## The Solution
Upload the video to Cloudinary FIRST, then send only the URL to create the reel.

## Step-by-Step Process

### 1. Upload Video to Cloudinary
```typescript
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary-upload';

const handleCreateReel = async (videoFile: File, caption: string) => {
  try {
    // Step 1: Validate the file
    const validation = validateFile(videoFile);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Step 2: Upload to Cloudinary (with progress)
    setUploading(true);
    const uploadResult = await uploadToCloudinary(videoFile, (progress) => {
      setUploadProgress(progress);
    });

    // Step 3: Create the reel with the URL
    const response = await fetch('/api/reels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        video_url: uploadResult.url,  // ← Just the URL!
        thumbnail_url: uploadResult.url,
        caption: caption,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create reel');
    }

    const reel = await response.json();
    toast.success('Reel created successfully!');
    router.push('/reels');

  } catch (error) {
    console.error('Error creating reel:', error);
    toast.error('Failed to create reel');
  } finally {
    setUploading(false);
  }
};
```

## What NOT to Do

❌ **WRONG** - Sending file data directly:
```typescript
const formData = new FormData();
formData.append('video', videoFile);  // ← This is too large!

await fetch('/api/reels', {
  method: 'POST',
  body: formData,  // ← Will cause ERR_OUT_OF_RANGE
});
```

✅ **CORRECT** - Upload first, then send URL:
```typescript
// 1. Upload to Cloudinary
const { url } = await uploadToCloudinary(videoFile);

// 2. Send only the URL
await fetch('/api/reels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ video_url: url }),  // ← Just the URL!
});
```

## Complete Example Component

```typescript
'use client'

import { useState } from 'react'
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary-upload'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function CreateReelForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoFile) {
      toast({ title: 'Please select a video', variant: 'destructive' })
      return
    }

    try {
      setUploading(true)

      // Validate
      const validation = validateFile(videoFile)
      if (!validation.valid) {
        toast({ title: validation.error, variant: 'destructive' })
        return
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(videoFile, setProgress)

      // Create reel with URL
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_url: result.url,
          thumbnail_url: result.url,
          caption: caption,
        }),
      })

      if (!response.ok) throw new Error('Failed to create reel')

      toast({ title: 'Reel created successfully!' })
      router.push('/reels')

    } catch (error) {
      console.error('Error:', error)
      toast({ title: 'Failed to create reel', variant: 'destructive' })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption..."
      />
      <button type="submit" disabled={uploading}>
        {uploading ? `Uploading ${progress}%` : 'Create Reel'}
      </button>
    </form>
  )
}
```

## Key Points

1. **Always upload to Cloudinary first** using `uploadToCloudinary()`
2. **Only send the URL** to your API, never the file data
3. **Show progress** to users during upload
4. **Validate files** before uploading

This approach:
- ✅ Works with files up to 100MB
- ✅ Bypasses MongoDB's 16MB limit
- ✅ Bypasses Vercel's 4.5MB limit
- ✅ Shows upload progress
- ✅ Faster and more reliable
