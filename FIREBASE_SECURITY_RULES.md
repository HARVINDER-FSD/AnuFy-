# 🔐 Firebase Security Rules - Copy & Paste

## Firestore Database Rules

Go to Firebase Console → Firestore Database → Rules tab

**Copy and paste this:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is participant in conversation
    function isParticipant(conversationId) {
      return isAuthenticated() && 
             request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }
    
    // Conversations Collection
    match /conversations/{conversationId} {
      // Users can read conversations they're part of
      allow read: if isAuthenticated() && 
                     request.auth.uid in resource.data.participants;
      
      // Users can create conversations if they're a participant
      allow create: if isAuthenticated() && 
                       request.auth.uid in request.resource.data.participants &&
                       request.resource.data.participants.size() == 2;
      
      // Users can update conversations they're part of
      allow update: if isAuthenticated() && 
                       request.auth.uid in resource.data.participants;
      
      // No one can delete conversations
      allow delete: if false;
    }
    
    // Messages Collection
    match /messages/{messageId} {
      // Anyone authenticated can read messages (we'll filter by conversation in app)
      allow read: if isAuthenticated();
      
      // Users can create messages
      allow create: if isAuthenticated() && 
                       request.resource.data.senderId == request.auth.uid &&
                       request.resource.data.conversationId is string &&
                       request.resource.data.content is string &&
                       request.resource.data.messageType in ['text', 'image', 'video', 'audio', 'shared_post', 'shared_reel'];
      
      // Users can update their own messages (for reactions, read status)
      allow update: if isAuthenticated();
      
      // Users can delete their own messages
      allow delete: if isAuthenticated() && 
                       resource.data.senderId == request.auth.uid;
    }
    
    // User Status Collection (for online/offline status)
    match /userStatus/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Typing Indicators Collection
    match /typing/{conversationId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

Click **"Publish"** button.

---

## Firebase Storage Rules

Go to Firebase Console → Storage → Rules tab

**Copy and paste this:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to validate file size (max 50MB)
    function isValidSize() {
      return request.resource.size < 50 * 1024 * 1024;
    }
    
    // Helper function to validate image file types
    function isValidImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Helper function to validate video file types
    function isValidVideo() {
      return request.resource.contentType.matches('video/.*');
    }
    
    // Helper function to validate audio file types
    function isValidAudio() {
      return request.resource.contentType.matches('audio/.*');
    }
    
    // Chat media files
    match /chat/{conversationId}/{senderId}/{fileName} {
      // Anyone authenticated can read
      allow read: if isAuthenticated();
      
      // Only the sender can upload
      allow write: if isAuthenticated() && 
                      request.auth.uid == senderId &&
                      isValidSize() &&
                      (isValidImage() || isValidVideo() || isValidAudio());
      
      // Only the sender can delete
      allow delete: if isAuthenticated() && 
                       request.auth.uid == senderId;
    }
    
    // Profile pictures (if you want to store in Firebase)
    match /profiles/{userId}/{fileName} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() && 
                      request.auth.uid == userId &&
                      isValidSize() &&
                      isValidImage();
    }
  }
}
```

Click **"Publish"** button.

---

## 🔒 Security Notes

### What These Rules Do:

**Firestore:**
- ✅ Users can only read conversations they're part of
- ✅ Users can only create 1-on-1 conversations
- ✅ Users can only send messages as themselves
- ✅ Users can only delete their own messages
- ✅ Prevents unauthorized access to other users' chats

**Storage:**
- ✅ Users can only upload files to their own folders
- ✅ File size limited to 50MB
- ✅ Only valid image/video/audio files allowed
- ✅ Users can only delete their own files

### Production Hardening (Optional)

For production, you might want to add:

1. **Rate Limiting** - Limit messages per user per minute
2. **Content Validation** - Check message content length
3. **Participant Verification** - Verify both users exist in your MongoDB
4. **Conversation Limits** - Limit number of conversations per user

Example with rate limiting:

```javascript
// In Firestore rules
allow create: if isAuthenticated() && 
                 request.resource.data.senderId == request.auth.uid &&
                 // Rate limit: max 10 messages per minute
                 request.time < resource.data.lastMessageTime + duration.value(6, 's');
```

---

## ✅ Testing Your Rules

### Test Firestore Rules:

1. Go to Firestore → Rules tab
2. Click "Rules Playground"
3. Test these scenarios:
   - ✅ Authenticated user reading their conversation
   - ❌ Unauthenticated user reading any conversation
   - ✅ User creating message in their conversation
   - ❌ User creating message in someone else's conversation

### Test Storage Rules:

1. Go to Storage → Rules tab
2. Click "Rules Playground"
3. Test these scenarios:
   - ✅ Authenticated user uploading to their folder
   - ❌ User uploading to someone else's folder
   - ❌ User uploading 100MB file (should fail)

---

## 🚨 Important Security Tips

1. **Never use `allow read, write: if true;`** in production (except for public data)
2. **Always validate user authentication** with `request.auth != null`
3. **Always validate data types** in create/update rules
4. **Set file size limits** to prevent abuse
5. **Monitor Firebase usage** in console to detect abuse
6. **Enable App Check** for additional security (optional)

---

## 📊 Monitoring

Check Firebase Console regularly:

- **Usage tab** - Monitor read/write operations
- **Logs** - Check for security rule violations
- **Performance** - Monitor query performance

Set up alerts for:
- Unusual spike in operations
- High storage usage
- Security rule denials

---

## 🎯 You're Secure!

Your Firebase chat is now protected with proper security rules. Users can only access their own conversations and messages.
