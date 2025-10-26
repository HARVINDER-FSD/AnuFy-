# 🎵 Spotify Web Playback SDK - Quick Setup

## What You Get

With Web Playback SDK, users can play **full songs** (3-5 minutes) instead of just 30-second previews.

## Current Status

✅ **Search API** - Already working (30s previews)
⚠️ **Web Playback SDK** - Needs setup for full songs

## Setup Steps

### Step 1: Update Spotify App Settings

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app: "Anufy Music" (or whatever you named it)
3. Click **"Settings"**
4. Scroll to **"Redirect URIs"**
5. Add these URIs:
   ```
   http://localhost:3000/api/spotify/callback
   ```
   
   For production, also add:
   ```
   https://yourdomain.com/api/spotify/callback
   ```

6. Click **"Add"** then **"Save"**

### Step 2: Environment Variables

✅ Already added to your `.env`:
```env
SPOTIFY_CLIENT_ID=82101352a7cc4ce188358e7e3ec432f9
SPOTIFY_CLIENT_SECRET=1788bd8c2748453e886d0d6433bec0f9
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=82101352a7cc4ce188358e7e3ec432f9
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Restart Your Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Files Already Created

You already have these files ready:
- ✅ `lib/spotify-auth.ts` - OAuth authentication
- ✅ `lib/spotify-player.ts` - Web Playback SDK wrapper
- ✅ `app/api/spotify/callback/route.ts` - OAuth callback
- ✅ `app/api/spotify/refresh/route.ts` - Token refresh
- ✅ `components/stories/spotify-full-song-player.tsx` - Full song player UI

## How It Works

### Two Modes

#### Mode 1: Preview Mode (Current - No Login)
```
User searches → Spotify API → 30s preview URLs
```
- ✅ No login required
- ✅ Works immediately
- ⚠️ Only 30-second previews

#### Mode 2: Full Song Mode (With Login)
```
User searches → Clicks song → Login prompt → Full song playback
```
- ⚠️ Requires Spotify login
- ✅ Full songs (3-5 minutes)
- ✅ High-quality streaming

## User Flow

### First Time User
1. User searches for music
2. Selects a song
3. Sees "Login with Spotify" prompt
4. Clicks login → Redirects to Spotify
5. Authorizes app
6. Redirects back to your app
7. Can now play full songs!

### Returning User
1. User searches for music
2. Selects a song
3. Plays immediately (tokens cached)

## Integration with Your Music Trimmer

Update your music trimmer component to use the full song player:

```typescript
import { SpotifyFullSongPlayer } from '@/components/stories/spotify-full-song-player'

// In your component
{showFullPlayer && (
  <SpotifyFullSongPlayer
    song={selectedSong}
    trimStart={trimStart}
    trimEnd={trimEnd}
    onClose={() => setShowFullPlayer(false)}
    onTimeUpdate={(time) => setCurrentTime(time)}
  />
)}
```

## What Users Need

### Requirements
- ✅ Spotify account (free or premium)
- ✅ Modern browser (Chrome, Firefox, Safari, Edge)
- ✅ Internet connection

### Permissions Requested
When users login, they'll see:
- `streaming` - Play music
- `user-read-email` - Basic profile
- `user-read-private` - Account type
- `user-read-playback-state` - Current playback
- `user-modify-playback-state` - Control playback

## Testing

### Test Preview Mode (Current)
1. Search for "Blinding Lights"
2. Should see results with 30s previews
3. Can play preview immediately

### Test Full Song Mode (After Setup)
1. Search for "Blinding Lights"
2. Click on a song
3. Should see "Login with Spotify" prompt
4. Login with your Spotify account
5. Should play full song (3:22)

## Comparison

| Feature | Preview Mode | Full Song Mode |
|---------|-------------|----------------|
| Login Required | ❌ No | ✅ Yes |
| Song Duration | 30 seconds | Full (3-5 min) |
| Setup Required | ✅ Done | ⚠️ Add redirect URI |
| User Experience | Quick | Professional |
| Audio Quality | Medium | High |

## Troubleshooting

### "Redirect URI mismatch" error
- Go to Spotify Dashboard → Settings
- Add exact URI: `http://localhost:3000/api/spotify/callback`
- Must match exactly (including http/https)

### "Login with Spotify" button doesn't appear
- Check `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` is set
- Restart dev server
- Clear browser cache

### Songs still play 30s previews
- User hasn't logged in yet
- Check if login prompt appears
- Verify tokens in localStorage (browser dev tools)

### "Player not ready" error
- Spotify account may be inactive
- Try refreshing the page
- Check browser console for errors

## Production Deployment

When deploying to Vercel/production:

1. **Add redirect URI in Spotify Dashboard:**
   ```
   https://yourdomain.com/api/spotify/callback
   ```

2. **Update environment variables:**
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Redeploy**

## Next Steps

### Option A: Keep It Simple (Current)
- ✅ Already working
- ✅ No user login needed
- ✅ 30-second previews
- ✅ Good for most use cases

### Option B: Add Full Songs (Recommended)
1. ✅ Add redirect URI to Spotify app
2. ✅ Environment variables already set
3. ✅ Restart server
4. ✅ Test login flow
5. 🎵 Enjoy full songs!

## Quick Decision Guide

**Choose Preview Mode if:**
- You want simplicity
- 30 seconds is enough
- Don't want users to login

**Choose Full Song Mode if:**
- You want professional experience
- Need full-length songs
- Users are willing to login

## Current Status Summary

✅ **Search API** - Working with Spotify
✅ **Preview Playback** - 30s clips working
✅ **Environment Variables** - Configured
✅ **SDK Files** - Already created
⚠️ **Redirect URI** - Need to add in Spotify Dashboard
⚠️ **Integration** - Need to use SpotifyFullSongPlayer component

---

**You're 90% there!** Just add the redirect URI in Spotify Dashboard and you can enable full song playback. Or keep using preview mode - it's already working great!
