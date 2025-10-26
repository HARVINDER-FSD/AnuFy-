# 🔍 Debug Music Playback

## Added Debug Logging

I've added detailed console logging to help diagnose the playback issue. 

## How to Debug

### 1. Open Browser Console

Press `F12` or right-click → Inspect → Console tab

### 2. Try Playing Music

1. Search for a song
2. Click on a song
3. Click the play button
4. Watch the console

### 3. Check Console Messages

You should see these messages:

```
✅ Good Flow:
"Selected song: {title, artist, previewUrl...}"
"Audio element src: https://..."
"Preview URL: https://..."
"Audio loaded successfully"
"Audio can play"
"Attempting to play: https://..."
"Playback started successfully"
```

```
❌ Problem Flow:
"Selected song: {title, artist, previewUrl...}"
"Audio element src: https://..."
"Preview URL: https://..."
"Audio load error: ..."  ← Problem here!
OR
"Playback error: ..."    ← Or here!
```

## Common Issues

### Issue 1: Preview URL is null/undefined

**Symptom:**
```
Preview URL: null
```

**Cause:** API didn't return a preview URL

**Solution:** 
- Spotify/Deezer/iTunes sometimes don't have previews for all songs
- Try a different song
- Check if API is working

### Issue 2: CORS Error

**Symptom:**
```
Access to audio at '...' from origin '...' has been blocked by CORS policy
```

**Cause:** Audio source doesn't allow cross-origin requests

**Solution:** Already added `crossOrigin="anonymous"` to audio element

### Issue 3: Network Error

**Symptom:**
```
Audio load error: NetworkError
```

**Cause:** 
- Preview URL is broken
- Network connection issue
- API returned invalid URL

**Solution:**
- Check internet connection
- Try different song
- Verify API credentials

### Issue 4: NotAllowedError

**Symptom:**
```
Playback error: NotAllowedError
```

**Cause:** Browser requires user interaction before playing audio

**Solution:** Already handled - play is triggered by button click

## Quick Test

### Test with Known Working Song

Try searching for these songs (they usually have previews):
- "Blinding Lights" by The Weeknd
- "Shape of You" by Ed Sheeran
- "Levitating" by Dua Lipa

### Check API Response

Open Network tab in browser:
1. Search for a song
2. Look for request to `/api/music/search`
3. Check response - does it have `previewUrl`?

Example good response:
```json
{
  "songs": [
    {
      "id": "123",
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "previewUrl": "https://p.scdn.co/mp3-preview/...",  ← Must exist!
      "source": "spotify"
    }
  ]
}
```

## Manual Test

Try this in browser console:

```javascript
// Test if audio can play at all
const audio = new Audio('https://p.scdn.co/mp3-preview/test.mp3')
audio.play()
  .then(() => console.log('Audio works!'))
  .catch(err => console.error('Audio failed:', err))
```

## Next Steps

Based on console output:

### If you see "Audio load error"
→ The preview URL is invalid or blocked
→ Try different songs or check API

### If you see "Playback error"
→ Browser blocking playback
→ Check browser permissions

### If you see nothing
→ Button click not working
→ Check if togglePlayback is being called

---

**After checking console, share the error messages and I'll help fix it!** 🎵
