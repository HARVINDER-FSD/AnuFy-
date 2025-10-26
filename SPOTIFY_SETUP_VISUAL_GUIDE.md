# 🎵 Spotify Setup - Visual Guide (2 Minutes)

## Step 1: Create Spotify App

### Go to Dashboard
👉 https://developer.spotify.com/dashboard

### Click "Create App"
```
┌─────────────────────────────────────┐
│  Create an App                      │
├─────────────────────────────────────┤
│  App name: Anufy Music              │
│  App description: Music for stories │
│  Redirect URI: https://example.com  │
│  ☑ Web API                          │
│                                     │
│  [Cancel]  [Save]                   │
└─────────────────────────────────────┘
```

**Note:** Redirect URI is required but NOT used for Client Credentials flow.
Use any valid URL like `https://example.com` or your actual domain.

### Click "Settings" → Copy Credentials
```
┌─────────────────────────────────────┐
│  Basic Information                  │
├─────────────────────────────────────┤
│  Client ID:                         │
│  abc123xyz... [Copy] ← Copy this!   │
│                                     │
│  Client Secret:                     │
│  [Show client secret]               │
│  def456uvw... [Copy] ← Copy this!   │
└─────────────────────────────────────┘
```

## Step 2: Add to .env File

Open your `.env` file and replace:

```env
# -------------------------
# Spotify API (Full Songs - Optional)
# -------------------------
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

With your actual credentials:

```env
# -------------------------
# Spotify API (Full Songs - Optional)
# -------------------------
SPOTIFY_CLIENT_ID=abc123xyz...
SPOTIFY_CLIENT_SECRET=def456uvw...
```

## Step 3: Restart Server

```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Test It!

1. Open your app
2. Go to story creator
3. Click "Add Music"
4. Search for "Blinding Lights"
5. You should see:
   ```
   Blinding Lights
   The Weeknd
   3:22 ✨ Full Song  ← This badge means it's working!
   ```

## 🎵 What You Get

### With Spotify (Recommended)
- ✅ Full songs (3-5 minutes)
- ✅ 100M+ tracks
- ✅ High quality
- ✅ "Full Song" badge
- ✅ Trim any 60-second segment

### Without Spotify (Auto Fallback)
- ✅ 30-second previews
- ✅ 40M+ tracks
- ✅ No setup needed
- ✅ Still works great!

## Troubleshooting

### "Search failed" error
❌ **Problem**: Wrong credentials
✅ **Solution**: Double-check Client ID and Secret

### Only 30-second previews
❌ **Problem**: Credentials not loaded
✅ **Solution**: Restart server after adding to .env

### Can't find .env file
❌ **Problem**: File hidden
✅ **Solution**: It's in your project root folder

## Important Notes

⚠️ **Never commit .env to Git!**
- Already in `.gitignore`
- Keeps your credentials safe

✅ **Client Credentials Flow**
- No user login required
- Tokens auto-refresh
- Perfect for search

✅ **Free Forever**
- No rate limits
- Unlimited searches
- Production-ready

---

**That's it!** Add your credentials, restart, and enjoy full-length songs! 🎵

If you skip this step, the app automatically uses iTunes (30s previews) - still works perfectly!
