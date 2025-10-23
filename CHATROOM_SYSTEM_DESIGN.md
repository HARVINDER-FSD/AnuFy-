# 🔒 Private Chatroom System - Complete Design

Instagram-style Direct Messages with real-time communication, multimedia support, and advanced privacy features.

---

## 📋 System Overview

### **Core Features:**
1. ✅ One-on-one conversations
2. ✅ Group chats (multi-user)
3. ✅ Text messages with emojis
4. ✅ Multimedia sharing (photos, videos, voice, GIFs, stickers)
5. ✅ Shared posts/profiles
6. ✅ Message status (Sent, Delivered, Seen)
7. ✅ Unsend messages
8. ✅ Reply to specific messages
9. ✅ React with emojis
10. ✅ Message requests
11. ✅ Privacy controls (Restrict, Block, Report)
12. ✅ Vanish mode
13. ✅ Voice & Video calls
14. ✅ Real-time updates

---

## 🗄️ Database Schema

### **1. conversations Collection**
```javascript
{
  _id: ObjectId,
  type: "direct" | "group",
  participants: [ObjectId], // User IDs
  admins: [ObjectId], // For groups
  name: String, // Group name (optional)
  avatar: String, // Group avatar (optional)
  created_by: ObjectId,
  created_at: Date,
  updated_at: Date,
  last_message_at: Date,
  is_vanish_mode: Boolean,
  settings: {
    notifications_enabled: Boolean,
    message_permissions: "all" | "admins_only"
  }
}
```

### **2. messages Collection**
```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: ObjectId,
  type: "text" | "image" | "video" | "voice" | "gif" | "sticker" | "shared_post" | "shared_profile",
  content: String, // Text or URL
  media_url: String, // For multimedia
  media_type: String,
  reply_to: ObjectId, // Message ID being replied to
  created_at: Date,
  updated_at: Date,
  is_deleted: Boolean,
  deleted_at: Date,
  deleted_for: [ObjectId], // Users who unsent for themselves
  
  // Status tracking
  status: {
    sent: Boolean,
    delivered_to: [ObjectId],
    seen_by: [{
      user_id: ObjectId,
      seen_at: Date
    }]
  },
  
  // Reactions
  reactions: [{
    user_id: ObjectId,
    emoji: String,
    created_at: Date
  }]
}
```

### **3. message_requests Collection**
```javascript
{
  _id: ObjectId,
  from_user_id: ObjectId,
  to_user_id: ObjectId,
  conversation_id: ObjectId,
  status: "pending" | "accepted" | "rejected" | "blocked",
  created_at: Date,
  updated_at: Date
}
```

### **4. user_chat_settings Collection**
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  conversation_id: ObjectId,
  notifications: {
    messages: Boolean,
    reactions: Boolean,
    calls: Boolean
  },
  is_muted: Boolean,
  is_restricted: Boolean,
  is_blocked: Boolean,
  last_seen_message_id: ObjectId,
  updated_at: Date
}
```

### **5. call_logs Collection**
```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId,
  type: "voice" | "video",
  initiated_by: ObjectId,
  participants: [{
    user_id: ObjectId,
    joined_at: Date,
    left_at: Date
  }],
  status: "ringing" | "ongoing" | "ended" | "missed",
  started_at: Date,
  ended_at: Date,
  duration: Number // seconds
}
```

---

## 🎯 API Endpoints

### **Conversations**

#### `GET /api/messages/conversations`
Get all conversations for current user
```json
Response: {
  "conversations": [
    {
      "id": "...",
      "type": "direct",
      "user": { "id": "...", "username": "...", "avatar": "..." },
      "lastMessage": { "text": "...", "timestamp": "..." },
      "unreadCount": 5,
      "isRequest": false
    }
  ]
}
```

#### `POST /api/messages/conversations/new`
Create new conversation or get existing
```json
Request: { "username": "target_user" }
Response: { "conversationId": "..." }
```

#### `GET /api/messages/conversations/[id]`
Get conversation details with messages
```json
Response: {
  "conversation": { "id": "...", "type": "direct", "participants": [...] },
  "messages": [
    {
      "id": "...",
      "sender": { "id": "...", "username": "..." },
      "type": "text",
      "content": "Hello!",
      "status": { "sent": true, "delivered": true, "seen": true },
      "reactions": [{ "user_id": "...", "emoji": "❤️" }],
      "reply_to": null,
      "created_at": "..."
    }
  ]
}
```

### **Messages**

#### `POST /api/messages/conversations/[id]/messages`
Send a new message
```json
Request: {
  "type": "text",
  "content": "Hello!",
  "reply_to": "message_id" // optional
}
Response: { "messageId": "...", "status": "sent" }
```

#### `DELETE /api/messages/[messageId]`
Unsend a message
```json
Request: { "delete_for": "everyone" | "me" }
Response: { "success": true }
```

#### `POST /api/messages/[messageId]/react`
React to a message
```json
Request: { "emoji": "❤️" }
Response: { "success": true }
```

#### `PATCH /api/messages/[messageId]/status`
Update message status (delivered/seen)
```json
Request: { "status": "seen" }
Response: { "success": true }
```

### **Message Requests**

#### `GET /api/messages/requests`
Get pending message requests
```json
Response: {
  "requests": [
    {
      "id": "...",
      "from_user": { "id": "...", "username": "...", "avatar": "..." },
      "preview": "Hey, how are you?",
      "created_at": "..."
    }
  ]
}
```

#### `POST /api/messages/requests/[id]/accept`
Accept a message request
```json
Response: { "success": true, "conversationId": "..." }
```

#### `POST /api/messages/requests/[id]/reject`
Reject a message request
```json
Response: { "success": true }
```

#### `POST /api/messages/requests/[id]/block`
Block user from message request
```json
Response: { "success": true }
```

### **Privacy Controls**

#### `POST /api/messages/conversations/[id]/restrict`
Restrict a user
```json
Response: { "success": true }
```

#### `POST /api/messages/conversations/[id]/block`
Block a user
```json
Response: { "success": true }
```

#### `POST /api/messages/conversations/[id]/report`
Report a conversation
```json
Request: { "reason": "spam" | "harassment" | "inappropriate" }
Response: { "success": true }
```

#### `POST /api/messages/conversations/[id]/vanish-mode`
Toggle vanish mode
```json
Request: { "enabled": true }
Response: { "success": true }
```

### **Group Management**

#### `POST /api/messages/conversations/[id]/members`
Add members to group
```json
Request: { "user_ids": ["...", "..."] }
Response: { "success": true }
```

#### `DELETE /api/messages/conversations/[id]/members/[userId]`
Remove member from group
```json
Response: { "success": true }
```

#### `PATCH /api/messages/conversations/[id]/admins`
Add/remove group admin
```json
Request: { "user_id": "...", "action": "add" | "remove" }
Response: { "success": true }
```

#### `PATCH /api/messages/conversations/[id]`
Update group details
```json
Request: {
  "name": "New Group Name",
  "avatar": "url",
  "settings": { "message_permissions": "admins_only" }
}
Response: { "success": true }
```

### **Calls**

#### `POST /api/messages/conversations/[id]/call`
Initiate a call
```json
Request: { "type": "voice" | "video" }
Response: { "callId": "...", "token": "..." }
```

#### `POST /api/messages/calls/[id]/join`
Join an ongoing call
```json
Response: { "success": true, "token": "..." }
```

#### `POST /api/messages/calls/[id]/end`
End a call
```json
Response: { "success": true, "duration": 120 }
```

### **Notifications**

#### `PATCH /api/messages/conversations/[id]/notifications`
Update notification settings
```json
Request: {
  "messages": true,
  "reactions": true,
  "calls": false
}
Response: { "success": true }
```

---

## 🎨 Frontend Components

### **1. Messages List Page** (`/app/messages/page.tsx`)
- Conversation list
- Search conversations
- Unread count badges
- Message requests tab
- New message button

### **2. Chat Room** (`/app/messages/[conversationId]/page.tsx`)
- Message thread
- Message input with media upload
- Emoji picker
- Voice recording
- Reply/React UI
- Typing indicators
- Message status indicators
- Call buttons

### **3. Message Request Inbox** (`/app/messages/requests/page.tsx`)
- Pending requests list
- Accept/Delete/Block actions
- Preview messages

### **4. Group Settings** (`/app/messages/[conversationId]/settings/page.tsx`)
- Group name/avatar
- Members list
- Admin management
- Notification settings
- Leave group

---

## 🔐 Security Features

### **1. Message Encryption**
- End-to-end encryption for messages
- Secure media storage
- Token-based authentication

### **2. Privacy Controls**
```typescript
// Check if user can message another user
const canMessage = async (fromUserId, toUserId) => {
  // Check if blocked
  const isBlocked = await checkBlockStatus(fromUserId, toUserId);
  if (isBlocked) return false;
  
  // Check if restricted
  const isRestricted = await checkRestrictStatus(fromUserId, toUserId);
  if (isRestricted) return "request_only";
  
  // Check if following (for non-followers)
  const isFollowing = await checkFollowStatus(fromUserId, toUserId);
  if (!isFollowing) return "request_only";
  
  return true;
};
```

### **3. Message Request Logic**
```typescript
// When sending message to non-follower
if (!isFollowing) {
  // Create message request
  await createMessageRequest(fromUserId, toUserId, conversationId);
  
  // Don't send notification until accepted
  // Store message but mark as "pending"
}
```

---

## ⚡ Real-Time Features

### **WebSocket Events**

```typescript
// Client subscribes to conversation
socket.emit('join_conversation', { conversationId });

// Server broadcasts events
socket.on('new_message', (message) => {
  // Update UI with new message
});

socket.on('message_status_update', ({ messageId, status }) => {
  // Update message status (delivered/seen)
});

socket.on('user_typing', ({ userId, username }) => {
  // Show typing indicator
});

socket.on('message_reaction', ({ messageId, reaction }) => {
  // Update message with new reaction
});

socket.on('message_deleted', ({ messageId }) => {
  // Remove message from UI
});

socket.on('incoming_call', ({ callId, caller, type }) => {
  // Show call notification
});
```

---

## 📱 UI/UX Features

### **Message Status Indicators**
```
✓ Sent (single checkmark)
✓✓ Delivered (double checkmark)
✓✓ Seen (blue checkmarks)
```

### **Message Types**
- **Text**: Regular text with emoji support
- **Image**: Photo with caption
- **Video**: Video with caption
- **Voice**: Audio waveform with duration
- **GIF**: Animated GIF
- **Sticker**: Sticker image
- **Shared Post**: Post preview card
- **Shared Profile**: Profile preview card

### **Message Actions**
- **Long press/Right-click menu:**
  - Reply
  - React
  - Copy
  - Forward
  - Unsend
  - Report

### **Vanish Mode**
```
🔥 Swipe up to enable vanish mode
Messages disappear after viewing
Disabled when both users leave chat
```

---

## 🚀 Implementation Phases

### **Phase 1: Core Messaging** ✅ (Current)
- [x] Basic conversations
- [x] Text messages
- [x] Message status
- [x] Real-time updates

### **Phase 2: Message Requests & Privacy**
- [ ] Message request system
- [ ] Accept/Reject/Block
- [ ] Restrict users
- [ ] Block users
- [ ] Report functionality

### **Phase 3: Rich Messaging**
- [ ] Reply to messages
- [ ] React with emojis
- [ ] Unsend messages
- [ ] Media upload (images, videos)
- [ ] Voice recording
- [ ] GIF picker
- [ ] Sticker support

### **Phase 4: Group Chats**
- [ ] Create groups
- [ ] Add/remove members
- [ ] Group admins
- [ ] Group settings
- [ ] Message permissions

### **Phase 5: Calls**
- [ ] Voice calls
- [ ] Video calls
- [ ] Call notifications
- [ ] Call logs

### **Phase 6: Advanced Features**
- [ ] Vanish mode
- [ ] Shared posts/profiles
- [ ] Typing indicators
- [ ] Message forwarding
- [ ] Search in chat

---

## 📊 Performance Considerations

### **Scalability**
- **Message pagination**: Load 50 messages at a time
- **Lazy loading**: Load older messages on scroll
- **Caching**: Cache recent conversations
- **Indexing**: Index messages by conversation_id and created_at

### **Real-Time Optimization**
- **WebSocket rooms**: One room per conversation
- **Event throttling**: Limit typing indicator updates
- **Presence tracking**: Track online/offline status

### **Media Handling**
- **Compression**: Compress images/videos before upload
- **CDN**: Serve media from CDN
- **Thumbnails**: Generate thumbnails for videos
- **Progressive loading**: Show low-res first, then high-res

---

## 🎯 Next Steps

### **Immediate Implementation:**
1. ✅ Create conversation API (Done)
2. ✅ Basic message sending (Done)
3. 🔄 Message requests system (Next)
4. 🔄 Privacy controls (Next)
5. 🔄 Reply & React features (Next)

### **Priority Features:**
1. **Message Requests** - Critical for privacy
2. **Block/Restrict** - Essential security
3. **Reply to Messages** - High user demand
4. **React with Emojis** - High engagement
5. **Media Upload** - Core functionality

---

## 📝 Summary

This chatroom system provides:
- ✅ **Secure messaging** - Private and encrypted
- ✅ **Rich interactions** - Text, media, reactions
- ✅ **Privacy controls** - Block, restrict, report
- ✅ **Group support** - Multi-user conversations
- ✅ **Real-time updates** - Instant delivery
- ✅ **Call integration** - Voice & video
- ✅ **Message requests** - Control who can message
- ✅ **Vanish mode** - Temporary messages

**The system is designed to be scalable, secure, and user-friendly, matching Instagram's DM experience!**
