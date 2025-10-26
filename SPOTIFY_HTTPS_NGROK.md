# 🎵 Spotify with HTTPS - Ngrok Solution

## The Problem

Spotify now requires HTTPS for ALL redirect URIs, including localhost. This means `http://localhost:3000` won't work.

## The Solution: Ngrok

Ngrok creates an HTTPS tunnel to your localhost instantly - no SSL certificates needed!

## Setup (5 Minutes)

### Step 1: Install Ngrok

**Option A: Using Chocolatey**
```powershell
choco install ngrok
```

**Option B: Using Scoop**
```powershell
scoop install ngrok
```

**Option C: Manual Download**
1. Go to: https://ngrok.com/download
2. Download Windows version
3. Extract `ngrok.exe`
4. Add to PATH or use from download folder

### Step 2: Sign Up (Free)

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (free account)
3. Copy your authtoken
4. Run:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Step 3: Start Your App

```bash
npm run dev
```

Your app runs at: http://localhost:3000

### Step 4: Start Ngrok Tunnel

Open a **new terminal** and run:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### Step 5: Update Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app → Settings
3. Add Redirect URI:
   ```
   https://abc123.ngrok-free.app/api/spotify/callback
   ```
   (Replace with your actual ngrok URL)
4. Save

### Step 6: Update .env

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

(Replace with your actual ngrok URL)

### Step 7: Restart Your App

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 8: Test

Visit your ngrok URL: `https://abc123.ngrok-free.app`

## How It Works

```
User Browser
    ↓ HTTPS
Ngrok Tunnel (https://abc123.ngrok-free.app)
    ↓ HTTP
Your Localhost (http://localhost:3000)
```

## Advantages

✅ **No SSL certificates** - Ngrok handles HTTPS
✅ **Instant setup** - Works in minutes
✅ **Free tier** - Perfect for development
✅ **Shareable** - Can share URL with others
✅ **Works everywhere** - No firewall issues

## Disadvantages

⚠️ **URL changes** - New URL each time you restart ngrok (free tier)
⚠️ **Warning page** - Ngrok shows a warning page first (click "Visit Site")
⚠️ **Rate limits** - Free tier has limits (but generous)

## Pro Tips

### Keep Same URL (Paid Feature)

Ngrok paid plans ($8/month) give you a permanent URL:
```bash
ngrok http 3000 --domain=your-domain.ngrok-free.app
```

### Skip Warning Page

Add to your ngrok config:
```bash
ngrok http 3000 --region=us
```

### Multiple Tunnels

Run multiple apps:
```bash
# Terminal 1
ngrok http 3000

# Terminal 2  
ngrok http 3001
```

## Alternative: Use Vercel Preview

Deploy to Vercel for automatic HTTPS:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Get preview URL with HTTPS
```

## Workflow

### Daily Development

1. **Terminal 1**: Start your app
   ```bash
   npm run dev
   ```

2. **Terminal 2**: Start ngrok
   ```bash
   ngrok http 3000
   ```

3. **Copy ngrok URL** from terminal

4. **Update .env** with new URL (if changed)

5. **Update Spotify Dashboard** with new URL (if changed)

6. **Develop normally** - Use ngrok URL instead of localhost

## Troubleshooting

### "ngrok: command not found"

Install ngrok first:
```powershell
choco install ngrok
```

### "Authtoken not found"

Sign up and add your token:
```bash
ngrok config add-authtoken YOUR_TOKEN
```

### "Redirect URI mismatch"

Make sure Spotify Dashboard has the exact ngrok URL:
```
https://abc123.ngrok-free.app/api/spotify/callback
```

### URL changed after restart

Free ngrok URLs change each time. Either:
- Update Spotify Dashboard with new URL
- Upgrade to ngrok paid plan for permanent URL
- Use Vercel for permanent preview URLs

### Warning page appears

This is normal for free ngrok. Click "Visit Site" to continue.

## Quick Commands

```bash
# Start your app
npm run dev

# Start ngrok (new terminal)
ngrok http 3000

# Copy the HTTPS URL and update:
# 1. .env -> NEXT_PUBLIC_APP_URL
# 2. Spotify Dashboard -> Redirect URI
```

## Summary

Ngrok is the fastest way to get HTTPS for Spotify development:

1. ✅ Install ngrok
2. ✅ Run `ngrok http 3000`
3. ✅ Copy HTTPS URL
4. ✅ Add to Spotify Dashboard
5. ✅ Update .env
6. 🎵 Test Spotify integration!

---

**This is the easiest solution for Spotify's HTTPS requirement!** No SSL certificates, no complex setup - just run ngrok and you're done. 🚀
