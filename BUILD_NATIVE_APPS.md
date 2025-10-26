# Build Native iOS & Android Apps 📱

Your app is now fully configured for native builds! Follow these steps to create iOS and Android apps.

## Prerequisites

### For iOS (Mac only):
- macOS computer
- Xcode 14+ (from App Store)
- Apple Developer Account ($99/year)
- CocoaPods: `sudo gem install cocoapods`

### For Android:
- Android Studio (any OS)
- Java JDK 17+
- Android SDK 33+

## Step 1: Install Dependencies

```bash
npm install
```

This installs all Capacitor plugins and dependencies.

## Step 2: Build Your Web App

```bash
npm run build
```

This creates an optimized static export in the `out/` directory.

## Step 3: Add Native Platforms

### Add iOS:
```bash
npm run cap:add:ios
```

### Add Android:
```bash
npm run cap:add:android
```

You only need to do this once!

## Step 4: Sync Web App with Native Projects

```bash
npm run cap:sync
```

This copies your web app into the native projects.

## Step 5: Build Native Apps

### For iOS:

1. Open in Xcode:
```bash
npm run cap:ios
```

2. In Xcode:
   - Select your development team
   - Choose a device/simulator
   - Click the ▶️ Play button
   - Done! App runs on device

### For Android:

1. Open in Android Studio:
```bash
npm run cap:android
```

2. In Android Studio:
   - Wait for Gradle sync
   - Choose a device/emulator
   - Click the ▶️ Run button
   - Done! App runs on device

## Quick Commands

```bash
# Build and open iOS
npm run native:ios

# Build and open Android
npm run native:android

# Just sync changes
npm run cap:sync
```

## Development Workflow

### Making Changes:

1. Edit your code
2. Run `npm run build`
3. Run `npm run cap:sync`
4. Refresh app in Xcode/Android Studio

### Live Reload (Development):

```bash
# Start dev server
npm run dev

# In capacitor.config.ts, temporarily add:
server: {
  url: 'http://localhost:3000',
  cleartext: true
}

# Then sync and run
npm run cap:sync
npm run cap:ios  # or cap:android
```

## App Configuration

### Change App Name:
Edit `capacitor.config.ts`:
```typescript
appName: 'Your App Name'
```

### Change Bundle ID:
Edit `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.yourapp'
```

### Change App Icon:
- iOS: Replace `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: Replace `android/app/src/main/res/mipmap-*/ic_launcher.png`

### Change Splash Screen:
- iOS: Replace `ios/App/App/Assets.xcassets/Splash.imageset/`
- Android: Replace `android/app/src/main/res/drawable*/splash.png`

## Native Features Available

Your app now has access to:

✅ Camera (photos & videos)
✅ Push Notifications
✅ File System
✅ Share functionality
✅ Haptic feedback
✅ Status bar control
✅ Keyboard handling
✅ Network status
✅ App state management
✅ Splash screen

## Using Native Features in Code

### Camera:
```typescript
import { Camera } from '@capacitor/camera'

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: 'uri'
})
```

### Push Notifications:
```typescript
import { PushNotifications } from '@capacitor/push-notifications'

await PushNotifications.requestPermissions()
await PushNotifications.register()
```

### Haptics:
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics'

await Haptics.impact({ style: ImpactStyle.Light })
```

### Share:
```typescript
import { Share } from '@capacitor/share'

await Share.share({
  title: 'Check this out!',
  text: 'Amazing content',
  url: 'https://yourapp.com',
})
```

## Troubleshooting

### iOS Build Fails:
```bash
cd ios/App
pod install
cd ../..
npm run cap:sync
```

### Android Build Fails:
- File → Invalidate Caches / Restart in Android Studio
- Clean build: Build → Clean Project
- Rebuild: Build → Rebuild Project

### App Won't Load:
- Check `out/` directory exists
- Run `npm run build` again
- Run `npm run cap:sync` again
- Check console for errors

### White Screen:
- Ensure `output: 'export'` in `next.config.mjs`
- Check all API calls use absolute URLs
- Verify `webDir: 'out'` in `capacitor.config.ts`

## Publishing to App Stores

### iOS App Store:

1. In Xcode: Product → Archive
2. Click "Distribute App"
3. Choose "App Store Connect"
4. Follow prompts
5. Submit for review in App Store Connect

### Google Play Store:

1. In Android Studio: Build → Generate Signed Bundle
2. Create/use signing key
3. Build release AAB
4. Upload to Google Play Console
5. Fill out store listing
6. Submit for review

## Performance Tips

✅ Already implemented:
- Static export for fast loading
- Optimized images
- Code splitting
- Compression
- Hardware acceleration
- Native scrolling

## App Size

Expected sizes:
- iOS: ~30-40MB
- Android: ~25-35MB

## Next Steps

1. Test on real devices
2. Add app icons and splash screens
3. Configure push notifications
4. Set up deep linking
5. Submit to app stores

## Support

- Capacitor Docs: https://capacitorjs.com
- iOS Guide: https://capacitorjs.com/docs/ios
- Android Guide: https://capacitorjs.com/docs/android

## Success! 🎉

You now have:
- ✅ Native iOS app
- ✅ Native Android app
- ✅ Same codebase as web
- ✅ Native performance
- ✅ App Store ready

Your web app is now a real native app!
