# 🔍 BLACK SCREEN - COMPLETE DEBUG SOLUTION

## THE PROBLEM

Your app shows a black screen because it can't load the web content. This happens when:
1. The server URL is wrong or unreachable
2. The emulator can't connect to the internet
3. CORS issues with your backend
4. The Vercel app isn't deployed properly

## ✅ SOLUTION - TEST YOUR VERCEL URL FIRST

### Step 1: Test if Your Vercel App Works

Open your browser and go to:
```
https://socialmediabackendfinalss.vercel.app
```

**What do you see?**
- ✅ If you see your app/login page → URL is good, continue to Step 2
- ❌ If you see "404" or error → Your app isn't deployed, see Step 3

### Step 2: Check Logcat for Exact Error

In Android Studio:
1. Click **Logcat** tab (bottom)
2. Clear log (trash icon)
3. Run app again
4. Filter by typing: `Capacitor`
5. Look for RED lines

**Common errors you might see:**
- `net::ERR_CONNECTION_REFUSED` = Can't reach server
- `net::ERR_NAME_NOT_RESOLVED` = Wrong URL
- `net::ERR_CLEARTEXT_NOT_PERMITTED` = HTTP not allowed (need HTTPS)
- `CORS error` = Backend blocking requests

### Step 3: If Vercel App Not Deployed

Your app needs to be deployed to Vercel first!

```bash
# Make sure you're logged in to Vercel
vercel login

# Deploy your app
vercel --prod
```

Copy the URL it gives you (e.g., `https://your-app-xyz.vercel.app`)

## 🔧 FIX THE CONFIG

Once you have a working Vercel URL, update the config:

### Option A: Use Vercel (Production)

Update `capacitor.config.ts`:
```typescript
server: {
  url: 'https://YOUR-ACTUAL-VERCEL-URL.vercel.app',  // Your real URL!
  cleartext: false,
  androidScheme: 'https',
  iosScheme: 'https',
  allowNavigation: ['*']
},
```

Then run:
```bash
npx cap sync android
```

Rebuild in Android Studio.

### Option B: Use Localhost (Development)

If you want to test with your local server:

**1. Start your dev server:**
```bash
npm run dev
```

**2. Find your computer's IP:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**3. Update `capacitor.config.ts`:**
```typescript
server: {
  url: 'http://192.168.1.100:3000',  // YOUR IP!
  cleartext: true,
  androidScheme: 'http',
  iosScheme: 'http',
  allowNavigation: ['*']
},
```

**4. Sync and rebuild:**
```bash
npx cap sync android
```

Rebuild in Android Studio.

## 🎯 QUICK TEST - REMOVE SERVER URL

Try this to see if it's a URL issue:

**1. Update `capacitor.config.ts` - REMOVE the server section:**
```typescript
const config: CapacitorConfig = {
  appId: 'com.anufy.app',
  appName: 'Anufy',
  webDir: 'public',
  // NO server section!
  
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
}
```

**2. Sync:**
```bash
npx cap sync android
```

**3. Rebuild in Android Studio**

If you still see black screen, the problem is with the web assets themselves.

## 🐛 OTHER POSSIBLE FIXES

### Fix 1: Clear App Data

In emulator:
1. Long press the app icon
2. App info
3. Storage
4. Clear data
5. Run app again

### Fix 2: Wipe Emulator

In Android Studio:
1. Device Manager
2. Click dropdown on your emulator
3. Wipe Data
4. Start emulator
5. Run app again

### Fix 3: Enable Internet in Emulator

Make sure emulator has internet:
1. Open Chrome in emulator
2. Try browsing google.com
3. If no internet, restart emulator

### Fix 4: Check AndroidManifest.xml

Make sure you have internet permission.

File: `android/app/src/main/AndroidManifest.xml`

Should have:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## 📱 WHAT SHOULD WORK

After fixing, you should see:
- ✅ App launches
- ✅ Shows login/register screen
- ✅ Can interact with the app
- ✅ No black screen!

## 🆘 STILL BLACK SCREEN?

Send me:
1. The error from Logcat (red lines)
2. What you see when you open your Vercel URL in browser
3. Screenshot of the black screen

I'll help you fix it!
