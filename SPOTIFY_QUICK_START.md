# 🎵 Spotify Quick Start (2 Minutes)

## TL;DR

1. Go to: https://developer.spotify.com/dashboard
2. Create app → Copy Client ID & Secret
3. Add to `.env` file
4. Restart server
5. Done! 🎉

## Detailed Steps

### 1. Get Credentials (1 minute)

```
1. Visit: https://developer.spotify.com/dashboard
2. Click "Create App"
3. Fill in:
   - Name: "Anufy Music"
   - Description: "Music for stories"
   - Redirect: https://example.com (any URL works, not used)
4. Click "Save"
5. Click "Settings"
6. Copy "Client ID"
7. Click "View client secret"
8. Copy "Client Secret"
```

**Note:** Redirect URI is required by the form but never used in Client Credentials flow.

### 2. Update .env (30 seconds)

Open `.env` and replace:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

With your actual values:

```env
SPOTIFY_CLIENT_ID=abc123...
SPOTIFY_CLIENT_SECRET=def456...
```

### 3. Restart Server (30 seconds)

```bash
# Press Ctrl+C to stop
npm run dev
```

## ✅ Test It

Search for "Blinding Lights" - you should see:
```
Blinding Lights
The Weeknd
3:22 ✨ Full Song  ← Success!
```

## 🎵 What You Get

- ✅ Full songs (not just 30s previews)
- ✅ 100M+ tracks
- ✅ High quality audio
- ✅ Free forever
- ✅ No rate limits

## ⚠️ Important

**DON'T use the token from Spotify's code examples!**

❌ Wrong:
```javascript
const token = 'BQDKo5e-WFBDa...' // This expires in 1 hour!
```

✅ Correct:
```env
SPOTIFY_CLIENT_ID=abc123...
SPOTIFY_CLIENT_SECRET=def456...
```

Our code automatically handles tokens for you!

## 🔄 Fallback

If you skip this setup:
- ✅ App still works
- ✅ Uses iTunes API
- ❌ Only 30-second previews

## Need Help?

See detailed guides:
- `SPOTIFY_SETUP_VISUAL_GUIDE.md` - Step-by-step with screenshots
- `WHY_CLIENT_CREDENTIALS_IS_BETTER.md` - Technical explanation
- `SPOTIFY_MUSIC_API_SETUP.md` - Complete documentation

---

**Ready!** Add credentials, restart, enjoy full songs! 🎵
