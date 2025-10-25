# 🧪 Test Story Upload - Quick Guide

## Test Scenario 1: Basic Story Upload

### Steps:
1. Navigate to `/stories/create`
2. Click camera icon (top left)
3. Select a photo from your device
4. Wait for photo to load
5. Type a caption: "My first story!"
6. Click "Your story" button (blue)
7. Watch progress: 20% → 50% → 80% → 100%
8. See success message
9. Get redirected to `/stories`
10. Verify your story appears

**Expected Result:** ✅ Story uploaded and visible

---

## Test Scenario 2: Story with Text

### Steps:
1. Navigate to `/stories/create`
2. Select a photo
3. Click "Aa" icon (text)
4. Type: "Hello World!"
5. Change color to red
6. Click "Done"
7. Drag text to center
8. Click "Your story"
9. Wait for upload
10. View story on `/stories`

**Expected Result:** ✅ Text appears on story at correct position

---

## Test Scenario 3: Story with Stickers

### Steps:
1. Navigate to `/stories/create`
2. Select a photo
3. Click sticker icon (smiley face)
4. Search for "happy"
5. Click a sticker
6. Resize sticker (pinch gesture)
7. Rotate sticker (two-finger twist)
8. Drag to position
9. Click "Friends" button (green)
10. Wait for upload

**Expected Result:** ✅ Sticker appears on story with correct size/position

---

## Test Scenario 4: Story with Poll

### Steps:
1. Navigate to `/stories/create`
2. Select a photo
3. Click sticker icon
4. Click "POLL" button
5. Type question: "Which is better?"
6. Option 1: "Coffee"
7. Option 2: "Tea"
8. Click "Add Poll"
9. Position poll sticker
10. Click "Your story"

**Expected Result:** ✅ Poll sticker appears and is interactive

---

## Test Scenario 5: Story with Music

### Steps:
1. Navigate to `/stories/create`
2. Select a photo
3. Click music icon (♪)
4. Search for a song
5. Click a song to preview
6. Click "Add to Story"
7. See music sticker appear
8. Click "Your story"
9. Wait for upload

**Expected Result:** ✅ Music sticker appears with song info

---

## Test Scenario 6: Story with Filter

### Steps:
1. Navigate to `/stories/create`
2. Select a photo
3. Click filter icon (sparkles)
4. Select "Clarendon" filter
5. See filter applied to photo
6. Add caption: "Filtered!"
7. Click "Your story"

**Expected Result:** ✅ Filter applied to story

---

## Test Scenario 7: Complex Story (All Features)

### Steps:
1. Navigate to `/stories/create`
2. Select a photo
3. Add text: "Amazing Day!"
4. Add 2-3 stickers
5. Add a poll
6. Add music
7. Apply a filter
8. Add caption: "Best day ever 🎉"
9. Click "Friends" button
10. Wait for upload

**Expected Result:** ✅ All elements preserved and visible

---

## Test Scenario 8: Error Handling

### Test 8a: No Media Selected
1. Navigate to `/stories/create`
2. Click "Your story" (without selecting media)
3. See alert: "Please select a photo or video first"

**Expected Result:** ✅ Error message shown

### Test 8b: Upload Failure
1. Disconnect internet
2. Create story with photo
3. Click "Your story"
4. See error message
5. Reconnect internet
6. Try again

**Expected Result:** ✅ Error handled gracefully

---

## Test Scenario 9: Upload Progress

### Steps:
1. Create a story with large video
2. Click "Your story"
3. Watch progress indicator:
   - Spinner appears
   - Percentage shows: 20%, 50%, 80%, 100%
   - Button disabled during upload
   - Caption input disabled
4. Wait for completion

**Expected Result:** ✅ Progress shown accurately

---

## Test Scenario 10: Both Share Options

### Test 10a: Your Story
1. Create story
2. Click "Your story" (blue button)
3. Verify story appears in public feed

### Test 10b: Friends
1. Create another story
2. Click "Friends" (green button)
3. Verify story marked for friends only

**Expected Result:** ✅ Both options work correctly

---

## Verification Checklist

After uploading, verify on `/stories` page:

- [ ] Story appears in feed
- [ ] User avatar and name correct
- [ ] Media displays correctly
- [ ] Text overlays in correct positions
- [ ] Stickers in correct positions
- [ ] Stickers correct size and rotation
- [ ] Filter applied to media
- [ ] Music sticker shows song info
- [ ] Caption displays below story
- [ ] Story expires in 24 hours
- [ ] View count increments
- [ ] Can swipe between stories
- [ ] Can tap to advance

---

## Common Issues & Solutions

### Issue: "Please select a photo or video first"
**Solution:** Click camera icon and select media before uploading

### Issue: Upload stuck at 20%
**Solution:** Check internet connection, Cloudinary might be slow

### Issue: Story not appearing
**Solution:** Refresh `/stories` page, check if logged in

### Issue: Text/stickers missing
**Solution:** Ensure they were added before clicking upload button

### Issue: "Failed to upload media"
**Solution:** Check Cloudinary configuration in `.env` file

---

## Performance Expectations

- **Photo upload:** 2-5 seconds
- **Video upload:** 5-15 seconds (depends on size)
- **Story creation:** < 1 second
- **Redirect:** Instant
- **Story display:** < 1 second

---

## Browser Console Checks

Open DevTools Console and verify:

```
✅ No errors during upload
✅ "Uploading to Cloudinary..." log
✅ "Story created successfully" log
✅ No 401/403/500 errors
✅ Cloudinary response received
✅ API response received
```

---

**Ready to Test!** 🚀

Start with Scenario 1 and work your way through. Each scenario tests different features to ensure everything works perfectly.
