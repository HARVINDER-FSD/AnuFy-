# Test Profile Picture Upload

## Quick Test Steps

### 1. Start Servers
```powershell
# Terminal 1
cd api-server
npm run dev

# Terminal 2 (from root)
npm run dev
```

### 2. Test Upload
1. Open: `http://localhost:3000/profile/edit`
2. Click camera icon on avatar
3. Select any image (JPG or PNG)
4. Click "Save Changes"

### 3. Watch for Messages
You should see these toasts in order:
1. ⏳ "Uploading image..." 
2. ✅ "Image uploaded! Saving your profile..."
3. ✅ "Profile updated! Refreshing..."

### 4. Verify Success
After redirect, check:
- [ ] Profile page shows new picture
- [ ] Story bar shows new picture
- [ ] Browser console shows: `Image uploaded successfully: https://res.cloudinary.com/...`

## What to Check in Browser Console

Open DevTools (F12) and look for:

```
Updating profile with data: {
  name: "Your Name",
  bio: "Your bio",
  avatar: "https://res.cloudinary.com/dcm470yhl/image/upload/..."
}
```

The `avatar` field should be a Cloudinary URL, NOT a base64 string!

## If It's Not Working

### Check 1: Cloudinary Credentials
Open `api-server/.env` and verify:
```
CLOUDINARY_CLOUD_NAME=dcm470yhl
CLOUDINARY_API_KEY=832377464323471
CLOUDINARY_API_SECRET=RV8uRIhI2IL5eyl6InvU5s8OX2g
CLOUDINARY_UPLOAD_PRESET=profilePicsUnsigned
```

### Check 2: Upload API
Test the upload endpoint:
```powershell
# Get your token from browser cookies
# Then test:
curl http://localhost:3000/api/upload -X POST -H "Authorization: Bearer YOUR_TOKEN"
```

Should return:
```json
{
  "success": true,
  "cloudName": "dcm470yhl",
  "uploadPreset": "profilePicsUnsigned",
  ...
}
```

### Check 3: Database Update
After upload, check MongoDB:
```javascript
// In MongoDB Compass or shell
db.users.findOne({ username: "your_username" })
```

The `avatar` and `avatar_url` fields should contain the Cloudinary URL.

## Common Issues

### Issue: "Failed to get upload configuration"
**Solution:** Make sure API server is running on port 8000

### Issue: "Failed to upload image"
**Solution:** Check Cloudinary credentials and upload preset

### Issue: Image uploads but doesn't show
**Solution:** Clear cache at `http://localhost:3000/clear-profile-cache.html`

### Issue: "Authentication token not found"
**Solution:** Log out and log back in to get a fresh token

## Success Indicators

✅ Console shows Cloudinary URL (not base64)
✅ Database has Cloudinary URL in `avatar` field
✅ Picture shows immediately after redirect
✅ Picture shows in story bar
✅ Picture persists after page refresh

## Next Steps After Success

1. Test on different pages (feed, reels, etc.)
2. Test with different image sizes
3. Test with different image formats (JPG, PNG, WebP)
4. Verify old pictures are replaced, not duplicated

Your profile picture upload is now fully functional! 🚀
