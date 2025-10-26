# 🔒 HTTPS Local Development Setup

## Why HTTPS?

Spotify Web Playback SDK requires HTTPS for security. Running your app with HTTPS locally allows you to:
- ✅ Test Spotify full song playback
- ✅ Use Web APIs that require secure context
- ✅ Match production environment
- ✅ Test PWA features properly

## Quick Setup (3 Steps)

### Step 1: Install mkcert

**Option A: Using Chocolatey (Recommended for Windows)**
```powershell
# Run PowerShell as Administrator
choco install mkcert
```

**Option B: Using Scoop**
```powershell
scoop bucket add extras
scoop install mkcert
```

**Option C: Manual Download**
Download from: https://github.com/FiloSottile/mkcert/releases
- Download `mkcert-v1.4.4-windows-amd64.exe`
- Rename to `mkcert.exe`
- Add to PATH

### Step 2: Run Setup Script

```powershell
# Run in your project directory
.\setup-https.ps1
```

This will:
1. Install local certificate authority
2. Generate SSL certificates for localhost
3. Save certificates in `./certificates/` folder

### Step 3: Start HTTPS Server

```bash
npm run dev:https
```

Your app will now run at: **https://localhost:3000** 🎉

## Manual Setup (If Script Fails)

### 1. Install Certificate Authority
```bash
mkcert -install
```

### 2. Create Certificates Directory
```bash
mkdir certificates
cd certificates
```

### 3. Generate Certificates
```bash
mkcert localhost 127.0.0.1 ::1
```

This creates:
- `localhost+2.pem` (certificate)
- `localhost+2-key.pem` (private key)

### 4. Start Server
```bash
npm run dev:https
```

## Usage

### Development with HTTPS
```bash
npm run dev:https
```
Access at: https://localhost:3000

### Development without HTTPS (Regular)
```bash
npm run dev
```
Access at: http://localhost:3000

## Spotify Configuration

### For HTTPS Development
Add to Spotify Dashboard:
```
https://localhost:3000/api/spotify/callback
```

### For Production
Add to Spotify Dashboard:
```
https://yourdomain.com/api/spotify/callback
```

## Browser Trust

When you first visit https://localhost:3000, your browser will trust the certificate automatically because mkcert installed it in your system's trust store.

### If You See Security Warning

1. **Chrome/Edge**: Click "Advanced" → "Proceed to localhost"
2. **Firefox**: Click "Advanced" → "Accept the Risk"
3. **Safari**: Click "Show Details" → "Visit Website"

This should only happen if mkcert wasn't installed correctly.

## Troubleshooting

### "mkcert: command not found"

**Solution 1: Install Chocolatey first**
```powershell
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Then install mkcert:
```powershell
choco install mkcert
```

**Solution 2: Download manually**
- Go to: https://github.com/FiloSottile/mkcert/releases
- Download Windows executable
- Add to PATH

### "Cannot find module 'https'"

This is a Node.js built-in module. Make sure you're using Node.js 14+:
```bash
node --version
```

### "ENOENT: no such file or directory, open 'certificates/localhost+2.pem'"

Run the setup script first:
```powershell
.\setup-https.ps1
```

Or manually create certificates:
```bash
mkdir certificates
cd certificates
mkcert localhost 127.0.0.1 ::1
```

### Port 3000 already in use

Stop any running dev servers:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Certificate not trusted

Reinstall the certificate authority:
```bash
mkcert -uninstall
mkcert -install
```

Then regenerate certificates:
```bash
cd certificates
del *.pem
mkcert localhost 127.0.0.1 ::1
```

## Files Created

```
your-project/
├── certificates/              # SSL certificates (gitignored)
│   ├── localhost+2.pem       # Certificate
│   └── localhost+2-key.pem   # Private key
├── server-https.js           # HTTPS server
├── setup-https.ps1           # Setup script
└── package.json              # Updated with dev:https script
```

## Security Notes

### Local Development
- ✅ Certificates are self-signed
- ✅ Only trusted on your machine
- ✅ Safe for local development
- ✅ Automatically gitignored

### Production
- ⚠️ Never use these certificates in production
- ✅ Use proper SSL from Let's Encrypt, Cloudflare, etc.
- ✅ Vercel/Netlify provide SSL automatically

## Comparison

| Feature | HTTP (dev) | HTTPS (dev:https) | Production |
|---------|-----------|-------------------|------------|
| Spotify SDK | ❌ No | ✅ Yes | ✅ Yes |
| Web APIs | Limited | Full | Full |
| PWA | Limited | Full | Full |
| Setup | None | One-time | Automatic |
| Speed | Fast | Fast | Fast |

## When to Use Each

### Use `npm run dev` (HTTP) when:
- ✅ Regular development
- ✅ Not testing Spotify full songs
- ✅ Quick prototyping
- ✅ No HTTPS-only features needed

### Use `npm run dev:https` (HTTPS) when:
- ✅ Testing Spotify Web Playback SDK
- ✅ Testing PWA features
- ✅ Using Web APIs requiring secure context
- ✅ Matching production environment

## Next Steps

1. ✅ Run setup script: `.\setup-https.ps1`
2. ✅ Start HTTPS server: `npm run dev:https`
3. ✅ Visit: https://localhost:3000
4. ✅ Add redirect URI to Spotify: `https://localhost:3000/api/spotify/callback`
5. 🎵 Test Spotify full song playback!

## Quick Commands Reference

```bash
# Setup (one-time)
.\setup-https.ps1

# Start with HTTPS
npm run dev:https

# Start without HTTPS (regular)
npm run dev

# Reinstall certificates
mkcert -uninstall
mkcert -install
cd certificates
mkcert localhost 127.0.0.1 ::1
```

---

**You're all set!** Run `.\setup-https.ps1` once, then use `npm run dev:https` whenever you need HTTPS for Spotify or other secure features. 🔒
