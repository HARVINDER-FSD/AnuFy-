# 🚀 Firebase Chat - Quick Start Guide

## Step 1: Install Firebase (5 seconds)

```bash
npm install firebase
```

## Step 2: Create Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Name it "anufy-chat"
4. Disable Google Analytics
5. Click "Create Project"

## Step 3: Enable Firestore (1 minute)

1. Click "Firestore Database" in left menu
2. Click "Create Database"
3. Choose "Start in production mode"
4. Select your region
5. Click "Enable"

## Step 4: Enable Storage (1 minute)

1. Click "Storage" in left menu
2. Click "Get Started"
3. Click "Next" → "Done"

## Step 5: Get Your Config (1 minute)

1. Click gear icon → "Project Settings"
2. Scroll to "Your apps"
3. Click web icon (</>)
4. Register app as "Anufy Web"
5. Copy the config values

## Step 6: Add to .env (30 seconds)

Add these to your `.env` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=anufy-chat.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=anufy-chat
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=anufy-chat.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 7: Set Security Rules (2 minutes)

### Firestore Rules
1. Go to Firestore → Rules tab
2. Paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

### Storage Rules
1. Go to Storage → Rules tab
2. Paste this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

## Step 8: Test It! (1 minute)

1. Restart your dev server:
```bash
npm run dev
```

2. Go to `/messages` in your app

3. Open in two browsers, login as different users

4. Send a message - it should appear instantly! 🎉

## 🎯 That's It!

Your real-time chat is now working with Firebase!

## 📱 Usage in Your App

### Open Chat
```tsx
import { FirebaseChat } from '@/components/chat/firebase-chat'

<FirebaseChat
  conversationId="conv_123"
  recipient={{
    id: "user_123",
    username: "john",
    full_name: "John Doe",
    avatar: "/avatar.jpg"
  }}
/>
```

### Show Chat List
```tsx
import { FirebaseChatList } from '@/components/chat/firebase-chat-list'

<FirebaseChatList
  onSelectConversation={(id, recipient) => {
    // Open chat with this conversation
  }}
/>
```

## 🔥 Features Working

✅ Real-time messaging (instant)
✅ Image & video sharing
✅ Message reactions (❤️😂😮)
✅ Reply to messages
✅ Delete messages
✅ Read receipts
✅ Unread counts
✅ Emoji picker
✅ Media preview

## 🐛 Troubleshooting

**Messages not appearing?**
- Check Firebase console for data
- Verify .env variables are correct
- Check browser console for errors

**Can't upload images?**
- Verify Storage is enabled
- Check Storage rules are published
- File must be under 50MB

**Real-time not working?**
- Restart dev server after adding .env
- Check Firebase config is correct
- Verify Firestore is enabled

## 💡 Next Steps

- Add typing indicators
- Add online status
- Add voice messages
- Add message search
- Add group chats

See `FIREBASE_CHAT_SETUP.md` for detailed documentation!
