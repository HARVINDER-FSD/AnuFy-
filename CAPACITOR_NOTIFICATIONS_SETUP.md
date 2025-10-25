# 📱 Capacitor Push Notifications & Chat Popups - Complete Setup

## 🎯 What You Get

✅ **Native push notifications** (iOS & Android)
✅ **Real-time chat popups** with avatar & message preview
✅ **Badge count** on app icon (unread messages)
✅ **Notification sound** when message arrives
✅ **Click to open** conversation directly
✅ **Works on web** (fallback to Web Notifications API)
✅ **Auto-dismiss** after 5 seconds
✅ **Multiple notifications** stack nicely

---

## 📦 Installation (5 minutes)

### Step 1: Install Capacitor & Plugins

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/push-notifications @capacitor/local-notifications @capacitor/badge
npm install @capacitor/android @capacitor/ios
```

### Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name:** Anufy
- **App ID:** com.anufy.app
- **Web directory:** out

### Step 3: Add Platforms

```bash
# For Android
npx cap add android

# For iOS (Mac only)
npx cap add ios
```

### Step 4: Build Your App

```bash
npm run build
npx cap sync
```

---

## 🔧 Configuration

### Android Setup

1. **Open Android Studio:**
```bash
npx cap open android
```

2. **Add Firebase to Android:**
   - Go to Firebase Console
   - Add Android app
   - Download `google-services.json`
   - Place in `android/app/` folder

3. **Update `android/app/build.gradle`:**
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}
```

4. **Add notification icon:**
   - Create `ic_stat_icon_config_sample.png` in `android/app/src/main/res/drawable/`
   - Use 24x24dp white icon on transparent background

### iOS Setup

1. **Open Xcode:**
```bash
npx cap open ios
```

2. **Enable Push Notifications:**
   - Select your app target
   - Go to "Signing & Capabilities"
   - Click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes" → Check "Remote notifications"

3. **Add Firebase to iOS:**
   - Go to Firebase Console
   - Add iOS app
   - Download `GoogleService-Info.plist`
   - Drag into Xcode project

4. **Update `ios/App/App/AppDelegate.swift`:**
```swift
import Firebase

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }
}
```

---

## 🎨 Usage in Your App

### 1. Add Notification Manager to Layout

Update `app/layout.tsx`:

```tsx
import { NotificationManager } from '@/components/notifications/notification-manager'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <NotificationManager />
      </body>
    </html>
  )
}
```

### 2. Add Chat Icon with Badge

Update your navigation component:

```tsx
import { ChatIconWithBadge } from '@/components/layout/chat-icon-with-badge'

// Replace your current chat icon with:
<ChatIconWithBadge />
```

### 3. Initialize Notifications

The `NotificationManager` component automatically:
- Requests notification permissions
- Registers for push notifications
- Listens for new messages
- Shows popup notifications
- Updates badge count

---

## 🔔 How It Works

### Real-time Flow

```
1. User sends message
   ↓
2. Firebase Firestore updates
   ↓
3. Your app listens via onSnapshot
   ↓
4. Detects new message
   ↓
5. Shows notification popup
   ↓
6. Updates badge count
   ↓
7. Plays notification sound
   ↓
8. User clicks → Opens conversation
```

### Notification Types

**Message Notification:**
```typescript
{
  title: "John Doe",
  body: "Hey! How are you?",
  data: {
    type: "message",
    conversationId: "conv_123",
    avatar: "https://...",
    username: "john"
  }
}
```

**Like Notification:**
```typescript
{
  title: "John Doe liked your post",
  body: "Amazing photo!",
  data: {
    type: "like",
    postId: "post_123"
  }
}
```

---

## 📱 Testing

### Test on Web (Development)

1. Start dev server:
```bash
npm run dev
```

2. Open in browser
3. Allow notifications when prompted
4. Send a message from another account
5. You should see popup notification!

### Test on Android

1. Build and sync:
```bash
npm run build
npx cap sync android
npx cap open android
```

2. Run on device/emulator from Android Studio
3. Send a message
4. Notification should appear!

### Test on iOS

1. Build and sync:
```bash
npm run build
npx cap sync ios
npx cap open ios
```

2. Run on device from Xcode (simulator doesn't support push)
3. Send a message
4. Notification should appear!

---

## 🎨 Customization

### Change Notification Sound

Add `notification-sound.mp3` to `public/` folder:

```typescript
// In hooks/use-chat-notifications.ts
const audio = new Audio('/notification-sound.mp3')
```

### Change Badge Color

Update `capacitor.config.ts`:

```typescript
LocalNotifications: {
  iconColor: '#FF0000' // Red badge
}
```

### Change Auto-Dismiss Time

Update `components/notifications/notification-popup.tsx`:

```typescript
// Change from 5000 to 10000 (10 seconds)
setTimeout(() => {
  handleClose()
}, 10000)
```

### Custom Notification Style

Edit `components/notifications/notification-popup.tsx`:

```tsx
<div className="bg-gradient-to-r from-primary to-purple-600 text-white">
  {/* Your custom design */}
</div>
```

---

## 🔥 Firebase Cloud Messaging (Optional)

For server-side push notifications:

### 1. Get Server Key

1. Go to Firebase Console
2. Project Settings → Cloud Messaging
3. Copy "Server key"

### 2. Send Push Notification from Backend

```typescript
// Example: Send notification when message is sent
import admin from 'firebase-admin'

async function sendPushNotification(userId: string, message: any) {
  // Get user's FCM token from MongoDB
  const user = await db.collection('users').findOne({ _id: userId })
  
  if (user.fcmToken) {
    await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title: message.senderName,
        body: message.content
      },
      data: {
        type: 'message',
        conversationId: message.conversationId
      }
    })
  }
}
```

---

## 🐛 Troubleshooting

### Notifications Not Showing

**Check permissions:**
```typescript
// In browser console
Notification.permission // Should be "granted"
```

**Check if service is initialized:**
```typescript
// In browser console
notificationService.isInitialized // Should be true
```

### Badge Not Updating

**Android:**
- Some launchers don't support badges
- Try on Pixel, Samsung, or OnePlus devices

**iOS:**
- Badges work on all devices
- Make sure capability is enabled in Xcode

### Sound Not Playing

**Web:**
- User must interact with page first (browser security)
- Add sound file to `public/` folder

**Native:**
- Check notification permissions
- Verify sound file exists

### Click Not Opening App

**Check deep linking:**
```typescript
// In capacitor.config.ts
server: {
  androidScheme: 'https',
  iosScheme: 'https'
}
```

---

## 📊 Features Comparison

| Feature | Web | Android | iOS |
|---------|-----|---------|-----|
| Push Notifications | ✅ | ✅ | ✅ |
| Local Notifications | ✅ | ✅ | ✅ |
| Badge Count | ✅* | ✅ | ✅ |
| Notification Sound | ✅ | ✅ | ✅ |
| Click to Open | ✅ | ✅ | ✅ |
| Background Notifications | ❌ | ✅ | ✅ |
| Notification Actions | ❌ | ✅ | ✅ |

*Web badge requires Chrome 81+ or Edge 81+

---

## 🚀 Production Checklist

Before deploying:

- [ ] Firebase project created
- [ ] FCM configured for Android
- [ ] APNs configured for iOS
- [ ] Notification icons added
- [ ] Tested on real devices
- [ ] Badge count working
- [ ] Click actions working
- [ ] Sound playing
- [ ] Permissions requested properly

---

## 📱 Build for Production

### Android APK

```bash
npm run build
npx cap sync android
npx cap open android
# Build → Generate Signed Bundle/APK
```

### iOS IPA

```bash
npm run build
npx cap sync ios
npx cap open ios
# Product → Archive → Distribute App
```

---

## 🎉 You're Done!

Your app now has:
- ✅ Real-time chat notifications
- ✅ Native push notifications
- ✅ Badge counts on app icon
- ✅ Beautiful popup notifications
- ✅ Click to open conversations
- ✅ Works on web, Android, and iOS

**Test it now:**
1. Open app on two devices
2. Send a message
3. Watch the notification appear instantly!
4. See the badge count update
5. Click to open the conversation

🚀 **Your chat is now production-ready with native notifications!**
