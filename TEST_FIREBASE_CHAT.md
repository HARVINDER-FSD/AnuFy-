# 🧪 Test Your Firebase Real-time Chat

## ✅ Pre-Flight Checklist

Before testing, make sure:
- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Storage enabled
- [ ] Security rules published
- [ ] `.env` file updated with Firebase credentials
- [ ] `npm install firebase` completed
- [ ] Dev server restarted

## 🚀 Test Steps

### 1. Start Your App

```bash
npm run dev
```

Wait for "compiled successfully" message.

### 2. Open Two Browser Windows

**Window 1:** Chrome (or your main browser)
- Go to `http://localhost:3000`
- Login as User 1

**Window 2:** Chrome Incognito (or different browser)
- Go to `http://localhost:3000`
- Login as User 2

### 3. Navigate to Messages

In both windows:
- Click on Messages icon in navigation
- Or go directly to `/messages`

### 4. Start a Conversation

**In Window 1 (User 1):**
1. Click "New Message" or search for User 2
2. Select User 2 from the list
3. Type "Hello from User 1!" and press Enter

**Expected Result:**
- ✅ Message appears instantly in Window 1
- ✅ Message appears instantly in Window 2 (real-time!)
- ✅ No page refresh needed

### 5. Test Real-time Messaging

**In Window 2 (User 2):**
1. Type "Hi back from User 2!" and send
2. Watch Window 1 - message should appear instantly

**Expected Result:**
- ✅ Messages appear in both windows instantly
- ✅ Conversation updates in real-time
- ✅ Timestamps are correct

### 6. Test Message Reactions

**In Window 1:**
1. Hover over User 2's message
2. Click the ❤️ reaction

**Expected Result:**
- ✅ Heart appears instantly in Window 1
- ✅ Heart appears instantly in Window 2
- ✅ Click again to remove reaction

### 7. Test Image Upload

**In Window 1:**
1. Click the image icon
2. Select an image (JPG, PNG, or GIF)
3. Add optional caption
4. Click send

**Expected Result:**
- ✅ Image preview shows before sending
- ✅ Upload progress indicator
- ✅ Image appears in both windows
- ✅ Image is clickable to view full size

### 8. Test Reply Feature

**In Window 2:**
1. Hover over any message
2. Click the reply icon
3. Type "This is a reply" and send

**Expected Result:**
- ✅ Reply indicator shows which message you're replying to
- ✅ Reply appears with reference to original message
- ✅ Both windows show the reply correctly

### 9. Test Message Deletion

**In Window 1:**
1. Hover over your own message
2. Click the trash icon
3. Confirm deletion

**Expected Result:**
- ✅ Message disappears from Window 1
- ✅ Message disappears from Window 2 instantly
- ✅ Shows "This message was deleted"

### 10. Test Emoji Picker

**In Window 2:**
1. Click the smile icon
2. Select an emoji
3. Send the message

**Expected Result:**
- ✅ Emoji picker opens
- ✅ Emoji is inserted into message
- ✅ Emoji displays correctly in both windows

### 11. Test Unread Counts

**In Window 1:**
1. Send 3 messages to User 2
2. Go back to conversation list

**In Window 2:**
1. Stay on conversation list (don't open chat)

**Expected Result:**
- ✅ Unread badge shows "3" in Window 2
- ✅ Badge updates in real-time
- ✅ Badge disappears when conversation is opened

### 12. Test Video Upload

**In Window 1:**
1. Click image icon
2. Select a video file (MP4)
3. Send

**Expected Result:**
- ✅ Video preview shows
- ✅ Video uploads successfully
- ✅ Video plays in both windows

## 🔍 Check Firebase Console

### Verify Data in Firestore

1. Go to Firebase Console
2. Click "Firestore Database"
3. Check collections:

**conversations:**
```
{
  participants: ["user1_id", "user2_id"],
  lastMessage: {
    content: "Hello from User 1!",
    senderId: "user1_id",
    timestamp: [Timestamp]
  },
  unreadCount: {
    user1_id: 0,
    user2_id: 3
  }
}
```

**messages:**
```
{
  conversationId: "conv_id",
  senderId: "user1_id",
  content: "Hello from User 1!",
  messageType: "text",
  reactions: [],
  readBy: ["user1_id"],
  createdAt: [Timestamp]
}
```

### Verify Files in Storage

1. Go to Firebase Console
2. Click "Storage"
3. Navigate to `chat/` folder
4. You should see uploaded images/videos

## 🐛 Troubleshooting

### Messages Not Appearing?

**Check Browser Console:**
```javascript
// Should see:
🔥 Firebase initialized for real-time chat
📨 Real-time messages received: 5
```

**If you see errors:**
- ❌ "Firebase: Error (auth/invalid-api-key)" → Check `.env` file
- ❌ "Missing or insufficient permissions" → Check Firestore rules
- ❌ "Network error" → Check internet connection

**Fix:**
1. Verify `.env` has correct Firebase credentials
2. Restart dev server: `npm run dev`
3. Clear browser cache
4. Check Firebase Console for errors

### Images Not Uploading?

**Check:**
- File size < 50MB
- File type is image/video
- Storage rules are published
- Storage is enabled in Firebase

**Fix:**
1. Go to Firebase Console → Storage
2. Verify Storage is enabled
3. Check Rules tab - should allow authenticated writes
4. Try smaller file (< 5MB)

### Real-time Not Working?

**Check:**
- WebSocket connection in Network tab
- Firestore rules allow read access
- Both users are authenticated

**Fix:**
1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Should see active WebSocket connection
4. If not, check Firestore is enabled

### Reactions Not Working?

**Check:**
- Message has `id` field
- User is authenticated
- Firestore rules allow updates

**Fix:**
1. Check browser console for errors
2. Verify message structure in Firestore
3. Try refreshing the page

## 📊 Performance Testing

### Test with Multiple Messages

1. Send 50 messages rapidly
2. Check if all appear
3. Check scroll performance
4. Check memory usage

**Expected:**
- ✅ All messages appear
- ✅ Smooth scrolling
- ✅ No memory leaks
- ✅ Real-time updates continue working

### Test with Large Images

1. Upload 10MB image
2. Check upload time
3. Check if it displays correctly

**Expected:**
- ✅ Upload completes in < 10 seconds
- ✅ Image displays correctly
- ✅ Thumbnail loads fast

### Test Offline Mode

1. Send a message
2. Turn off internet
3. Try sending another message
4. Turn internet back on

**Expected:**
- ✅ Firebase queues messages offline
- ✅ Messages send when back online
- ✅ No data loss

## ✅ Success Criteria

Your Firebase chat is working if:

- [x] Messages appear instantly in both windows
- [x] No page refresh needed
- [x] Reactions update in real-time
- [x] Images upload and display correctly
- [x] Replies work properly
- [x] Message deletion works
- [x] Unread counts update automatically
- [x] Emoji picker works
- [x] Data appears in Firebase Console
- [x] No console errors

## 🎉 Congratulations!

If all tests pass, your Firebase real-time chat is working perfectly!

## 📱 Next: Test on Mobile

1. Open on your phone's browser
2. Test all features
3. Check touch interactions
4. Verify responsive design

## 🚀 Ready for Production

Your chat system is production-ready when:
- All tests pass
- Security rules are set
- Error handling works
- Performance is good
- Mobile works perfectly

## 📞 Need Help?

If something doesn't work:
1. Check `FIREBASE_QUICK_START.md` for setup
2. Check `FIREBASE_SECURITY_RULES.md` for rules
3. Check browser console for errors
4. Check Firebase Console for data
5. Verify `.env` file has correct values
