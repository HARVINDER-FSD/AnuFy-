# ⚡ Quick Capacitor Setup (10 Minutes)

## 🚀 Install & Setup

```bash
# 1. Install Capacitor (2 min)
npm install @capacitor/core @capacitor/cli
npm install @capacitor/push-notifications @capacitor/local-notifications @capacitor/badge

# 2. Initialize (1 min)
npx cap init

# Enter when prompted:
# App name: Anufy
# App ID: com.anufy.app
# Web directory: out

# 3. Add platforms (2 min)
npx cap add android
# npx cap add ios  # Mac only

# 4. Build & sync (2 min)
npm run build
npx cap sync
```

## 🎨 Add to Your App (3 minutes)

### 1. Update `app/layout.tsx`:

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

### 2. Update your navigation (replace chat icon):

```tsx
import { ChatIconWithBadge } from '@/components/layout/chat-icon-with-badge'

// In your navigation component:
<ChatIconWithBadge />
```

### 3. Update `next.config.mjs`:

```javascript
const nextConfig = {
  output: 'export',  // Required for Capacitor
  images: {
    unoptimized: true
  }
}
```

## 🧪 Test It Now!

### Web (Instant)

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Allow notifications
3. Send a message from another account
4. **Popup appears!** 🎉

### Android (5 min)

```bash
npm run build
npx cap sync android
npx cap open android
```

Run from Android Studio → See notifications!

## ✅ What You Get

- ✅ Real-time chat popups
- ✅ Badge count on chat icon
- ✅ Native push notifications
- ✅ Notification sound
- ✅ Click to open conversation
- ✅ Auto-dismiss after 5 seconds
- ✅ Works on web, Android, iOS

## 🎯 Features

### Chat Popup
```
┌─────────────────────────────┐
│ 👤 John Doe                 │
│ Hey! How are you?           │
│ @john                       │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░  │
└─────────────────────────────┘
```

### Badge Count
```
💬 (3)  ← Shows unread count
```

### Notification Types
- 💬 New message
- ❤️ Post liked
- 💭 New comment
- 👤 New follower

## 🔔 How It Works

```
Message sent → Firebase updates → App detects → Shows popup → Updates badge
```

All in real-time! No polling, no delays.

## 📱 Next Steps

1. **Test on web** - Works immediately
2. **Add Firebase** - For Android/iOS push
3. **Build APK** - Deploy to Play Store
4. **Build IPA** - Deploy to App Store

See `CAPACITOR_NOTIFICATIONS_SETUP.md` for detailed guide!

## 🎉 Done!

Your chat now has Instagram-style notifications! 🚀
