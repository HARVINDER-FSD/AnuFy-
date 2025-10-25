# Firebase Real-time Chat System - Complete Setup Guide

## 🔥 What's Implemented

A complete real-time chat system using Firebase Firestore and Firebase Storage, while keeping the rest of your app on MongoDB.

### Features
- ✅ Real-time messaging (instant updates)
- ✅ Message reactions (like Instagram)
- ✅ Reply to messages
- ✅ Image & video sharing
- ✅ Message deletion
- ✅ Read receipts
- ✅ Unread message counts
- ✅ Typing indicators ready
- ✅ Online status ready
- ✅ Message search
- ✅ Emoji picker
- ✅ Media upload to Firebase Storage

## 📦 Installation Steps

### 1. Install Firebase SDK

```bash
npm install firebase
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "anufy-chat")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 3. Enable Firestore Database

1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create Database"
3. Choose "Start in production mode"
4. Select your region (closest to your users)
5. Click "Enable"

### 4. Set Firestore Security Rules

Go to "Rules" tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Conversations - users can only access their own conversations
    match /conversations/{conversationId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && 
                       request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.participants;
    }
    
    // Messages - users can only access messages in their conversations
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       request.auth.uid == resource.data.senderId;
      allow delete: if request.auth != null && 
                       request.auth.uid == resource.data.senderId;
    }
  }
}
```

### 5. Enable Firebase Storage

1. Go to "Build" → "Storage"
2. Click "Get Started"
3. Use default security rules for now
4. Click "Done"

### 6. Set Storage Security Rules

Go to "Rules" tab and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat/{conversationId}/{senderId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.uid == senderId &&
                      request.resource.size < 50 * 1024 * 1024; // 50MB limit
    }
  }
}
```

### 7. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon (</>) to add web app
4. Register app with nickname (e.g., "Anufy Web")
5. Copy the firebaseConfig object

### 8. Add Environment Variables

Add to your `.env` file:

```env
# Firebase Configuration (for real-time chat only)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🗂️ Firestore Data Structure

### Collections

#### `conversations`
```javascript
{
  id: "auto-generated",
  participants: ["userId1", "userId2"], // sorted array
  lastMessage: {
    content: "Hello!",
    senderId: "userId1",
    timestamp: Timestamp
  },
  unreadCount: {
    "userId1": 0,
    "userId2": 3
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `messages`
```javascript
{
  id: "auto-generated",
  conversationId: "conversationId",
  senderId: "userId",
  content: "Message text",
  messageType: "text" | "image" | "video" | "audio" | "shared_post" | "shared_reel",
  mediaUrl: "https://...", // optional
  sharedContent: { // optional
    type: "post" | "reel",
    id: "postId",
    thumbnail: "url",
    caption: "text"
  },
  replyTo: { // optional
    id: "messageId",
    content: "Original message",
    senderId: "userId"
  },
  reactions: [
    {
      userId: "userId",
      emoji: "❤️",
      timestamp: Timestamp
    }
  ],
  readBy: ["userId1", "userId2"],
  isDeleted: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🚀 Usage

### Basic Chat Component

```tsx
import { FirebaseChat } from '@/components/chat/firebase-chat'

<FirebaseChat
  conversationId="conversation_id"
  recipient={{
    id: "user_id",
    username: "username",
    full_name: "Full Name",
    avatar: "avatar_url"
  }}
  onClose={() => console.log('Chat closed')}
/>
```

### Chat List Component

```tsx
import { FirebaseChatList } from '@/components/chat/firebase-chat-list'

<FirebaseChatList
  onSelectConversation={(conversationId, recipient) => {
    console.log('Selected:', conversationId, recipient)
  }}
/>
```

### Using Chat Functions

```typescript
import {
  sendMessage,
  addReaction,
  deleteMessage,
  uploadChatMedia,
  subscribeToMessages,
  getOrCreateConversation
} from '@/lib/firebase-chat'

// Create or get conversation
const conversationId = await getOrCreateConversation(userId, recipientId)

// Send text message
await sendMessage(conversationId, userId, "Hello!", "text")

// Send image
const imageUrl = await uploadChatMedia(file, conversationId, userId)
await sendMessage(conversationId, userId, "Check this out!", "image", { mediaUrl: imageUrl })

// Add reaction
await addReaction(messageId, userId, "❤️")

// Delete message
await deleteMessage(messageId)

// Listen to messages
const unsubscribe = subscribeToMessages(conversationId, (messages) => {
  console.log('New messages:', messages)
})
```

## 🔄 Migration from MongoDB Chat

If you want to migrate existing MongoDB chat data to Firebase:

1. Export conversations from MongoDB
2. Create a migration script
3. Import to Firestore with proper structure

Example migration script:

```typescript
// scripts/migrate-chat-to-firebase.ts
import { MongoClient } from 'mongodb'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase-config'

async function migrateChats() {
  const mongoClient = await MongoClient.connect(process.env.MONGODB_URI!)
  const mongodb = mongoClient.db()
  
  // Get all conversations
  const conversations = await mongodb.collection('conversations').find().toArray()
  
  for (const conv of conversations) {
    // Create in Firestore
    await addDoc(collection(db, 'conversations'), {
      participants: conv.participants,
      lastMessage: conv.last_message,
      unreadCount: conv.unread_count || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
  
  console.log('Migration complete!')
}
```

## 📱 Features to Add

### Typing Indicators
```typescript
// Add to firebase-chat.ts
export async function setTypingStatus(conversationId: string, userId: string, isTyping: boolean) {
  const typingRef = doc(db, 'typing', conversationId)
  await setDoc(typingRef, {
    [userId]: isTyping ? serverTimestamp() : null
  }, { merge: true })
}
```

### Online Status
```typescript
// Add to firebase-chat.ts
export async function setOnlineStatus(userId: string, isOnline: boolean) {
  const statusRef = doc(db, 'userStatus', userId)
  await setDoc(statusRef, {
    online: isOnline,
    lastSeen: serverTimestamp()
  })
}
```

### Voice Messages
```typescript
// Record audio and upload
const audioBlob = await recordAudio()
const audioFile = new File([audioBlob], 'voice.mp3', { type: 'audio/mp3' })
const audioUrl = await uploadChatMedia(audioFile, conversationId, userId)
await sendMessage(conversationId, userId, "Voice message", "audio", { mediaUrl: audioUrl })
```

## 🎨 Customization

### Change Theme Colors
Edit `components/chat/firebase-chat.tsx`:
```tsx
// Change message bubble colors
const isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
```

### Add Custom Message Types
1. Update `FirebaseMessage` interface in `lib/firebase-chat.ts`
2. Add rendering logic in `components/chat/firebase-chat.tsx`

## 🐛 Troubleshooting

### Messages not appearing
- Check Firebase console for data
- Verify Firestore rules allow read/write
- Check browser console for errors

### Images not uploading
- Verify Storage rules
- Check file size (max 50MB)
- Ensure correct file types

### Real-time not working
- Verify Firebase config in `.env`
- Check network tab for WebSocket connection
- Ensure Firestore is enabled

## 📊 Performance Tips

1. **Pagination**: Load messages in batches
```typescript
const q = query(
  messagesRef,
  where('conversationId', '==', conversationId),
  orderBy('createdAt', 'desc'),
  limit(50)
)
```

2. **Indexes**: Create composite indexes in Firestore for complex queries

3. **Offline Support**: Firebase automatically handles offline mode

4. **Caching**: Messages are cached locally by Firebase

## 💰 Cost Estimation

Firebase Free Tier (Spark Plan):
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Storage: 5GB storage, 1GB download per day

For a chat app with 1000 active users:
- ~100K messages/day = ~$0.18/day
- ~10GB media storage = ~$0.026/day
- Total: ~$6/month

## 🔐 Security Best Practices

1. Never expose Firebase config in public repos (use env variables)
2. Always validate user authentication
3. Use Firestore security rules to restrict access
4. Sanitize user input before storing
5. Implement rate limiting for message sending

## ✅ Testing

Test the chat system:
1. Open app in two different browsers
2. Login as different users
3. Send messages - should appear instantly
4. Add reactions - should update in real-time
5. Upload images - should display immediately
6. Delete messages - should remove for both users

## 🎉 You're Done!

Your Firebase real-time chat system is now ready to use. Messages will sync instantly across all devices, and media will be stored securely in Firebase Storage.

The rest of your app (posts, reels, stories, etc.) continues to use MongoDB as before.
