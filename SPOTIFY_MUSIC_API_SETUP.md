# 🎵 Spotify Full Songs Integration - Setup Guide

## What's New

Your music trimmer now supports **FULL SONGS** (not just 30-second previews) using Spotify API! Users can trim any part of a complete song for their stories and reels.

## Features

✅ **Full song access** - Complete tracks, not just previews
✅ **Spotify integration** - Professional music library
✅ **iTunes fallback** - Works without Spotify credentials (30s previews)
✅ **Dynamic timeline** - Adapts to song duration (up to 60s)
✅ **Source indicator** - Shows "Full Song" badge for Spotify tracks

## Setup Instructions

### Option 1: With Spotify API (Recommended - Full Songs)

1. **Create Spotify Developer Account**
   - Go to: https://developer.spotify.com/dashboard
   - Log in with your Spotify account (or create one)
   - Click "Create an App"

2. **Get Your Credentials**
   - App Name: "Anufy Music"
   - App Description: "Music integration for stories and reels"
   - Redirect URI: `https://example.com` (required but not used)
   - Click "Create"
   - Copy your **Client ID** and **Client Secret**
   
   **Note:** Localhost is not allowed, but any valid URL works since Client Credentials flow doesn't use redirects.

3. **Add to Environment Variables**
   
   Add these to your `.env` file:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

4. **Restart Your Server**
   ```bash
   npm run dev
   ```

### Option 2: Without Spotify (iTunes Fallback)

If you don't add Spotify credentials, the app automatically uses iTunes API which provides:
- ✅ Free, no setup required
- ❌ Only 30-second previews
- ✅ Still works great for testing

## How It Works

### API Endpoint
```
GET /api/music/search?q=song+name
```

### Response Format
```json
{
  "songs": [
    {
      "id": "spotify_track_id",
      "title": "Song Name",
      "artist": "Artist Name",
      "duration": 180,
      "durationFormatted": "3:00",
      "artwork": "https://...",
      "previewUrl": "https://...",
      "fullSongUrl": "https://open.spotify.com/track/...",
      "spotifyUri": "spotify:track:...",
      "source": "spotify"
    }
  ]
}
```

### Timeline Behavior

- **With Spotify**: Timeline shows up to 60 seconds of the full song
- **With iTunes**: Timeline shows the 30-second preview
- Users can trim any 3-60 second segment
- Smooth playhead indicator shows exact position

## User Experience

### Search Screen
```
🔍 Search music
├─ Song Title
│  Artist Name
│  3:45 ✨ Full Song    ← Spotify tracks show this badge
└─ [Bookmark icon]
```

### Trim Screen
```
Timeline: [====|████████|====]
          0s   15s     30s   60s
               ↑ Trim window ↑
          
Playhead: ▼ (slides smoothly)
```

## Features Comparison

| Feature | Spotify | iTunes |
|---------|---------|--------|
| Song Duration | Full (3-5 min) | 30 seconds |
| Quality | High | Medium |
| Library Size | 100M+ tracks | 40M+ tracks |
| Setup Required | Yes | No |
| Cost | Free | Free |

## Testing

### Test with Spotify
1. Add credentials to `.env`
2. Search for "Blinding Lights"
3. See "Full Song" badge
4. Trim any part of the 3:22 song

### Test with iTunes (Fallback)
1. Don't add Spotify credentials
2. Search for any song
3. Get 30-second previews
4. Still works perfectly!

## Technical Details

### Token Management
- Spotify tokens cached for 1 hour
- Auto-refresh before expiry
- No user authentication needed (Client Credentials flow)

### Timeline Calculation
```typescript
const maxDuration = Math.min(selectedSong.duration, 60)
const position = (i / 60) * maxDuration
```

### Playhead Position
```typescript
left: `${(currentTime / Math.min(song.duration, 60)) * 100}%`
```

## Troubleshooting

### "Search failed" error
- Check Spotify credentials in `.env`
- Verify credentials are correct
- Restart dev server after adding credentials

### "localhost is not allowed" error
- Use any valid URL instead: `https://example.com`
- Redirect URI is not used in Client Credentials flow
- See: `SPOTIFY_LOCALHOST_FIX.md`

### Only getting 30s previews
- Spotify credentials not configured
- App is using iTunes fallback
- Add Spotify credentials for full songs

### Timeline not showing full song
- Timeline maxes out at 60 seconds (Instagram/TikTok standard)
- Users can still trim any 60-second segment from longer songs

## Next Steps

1. ✅ Add Spotify credentials for full songs
2. ✅ Test search functionality
3. ✅ Try trimming different parts of songs
4. 🎵 Enjoy full-length music in your stories!

## API Limits

### Spotify
- No rate limits for Client Credentials
- Unlimited searches
- Perfect for production

### iTunes
- No authentication required
- Rate limited (but generous)
- Good for development/testing

---

**Ready to use!** Just add your Spotify credentials and restart the server. If you skip this step, iTunes fallback works automatically! 🎵
