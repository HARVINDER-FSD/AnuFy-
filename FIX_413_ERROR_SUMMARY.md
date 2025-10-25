# Fix for 413 Payload Too Large Error

## What I Fixed

The **413 error** happens because Vercel has a **4.5MB limit** for API routes. When you upload videos or large images, they exceed this limit.

## Solution Implemented

I've changed the upload system to use **direct Cloudinary uploads** instead of going through your API:

### Files Created/Modified:

1. **`lib/cloudinary-upload.ts`** - New utility for direct uploads
   - Uploads files directly to Cloudinary
   - Bypasses Vercel's 4.5MB limit
   - Includes progress tracking
   - Supports up to 100MB videos, 10MB images

2. **`app/api/upload/route.ts`** - Modified
   - Now only returns Cloudinary config (tiny payload)
   - Still checks authentication
   - No longer processes the actual file

3. **`next.config.mjs`** - Added body size limit config

4. **`CLOUDINARY_DIRECT_UPLOAD_GUIDE.md`** - Usage instructions

## How to Use in Your Code

Replace your current upload code with:

```typescript
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary-upload';

// Validate file
const validation = validateFile(file);
if (!validation.valid) {
  throw new Error(validation.error);
}

// Upload with progress
const result = await uploadToCloudinary(file, (progress) => {
  setUploadProgress(progress); // Update UI
});

// Use result.url for your post/reel
console.log('Uploaded:', result.url);
```

## Next Steps

1. **Commit and push** these changes:
   ```bash
   git add -A
   git commit -m "Fix 413 error: Implement direct Cloudinary uploads"
   git push
   ```

2. **Update your frontend code** to use the new `uploadToCloudinary` function

3. **Test** - You should now be able to upload large files without 413 errors

## Benefits

✅ No more 413 errors
✅ Upload files up to 100MB (videos) or 10MB (images)
✅ Progress tracking included
✅ Faster uploads (direct to Cloudinary)
✅ Works on Vercel

The upload now happens directly from browser → Cloudinary, completely bypassing Vercel's limits!
