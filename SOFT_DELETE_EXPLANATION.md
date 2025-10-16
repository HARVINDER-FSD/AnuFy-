# Soft Delete: How It Works 🔄

## Problem Solved ✅

### **Old Behavior (Hard Delete):**
```
You: Delete conversation → All messages deleted from database
You: Search user → Create NEW conversation
Other user: Still has OLD conversation
Result: ❌ Two different conversations! Messages don't sync!
```

### **New Behavior (Soft Delete):**
```
You: Delete conversation → Conversation HIDDEN for you only
You: Search user → RESTORE same conversation
Other user: Still has SAME conversation
Result: ✅ One conversation! All messages sync perfectly!
```

---

## How Soft Delete Works

### **When You Delete:**

**Before:**
```javascript
// ❌ Hard delete - removes from database
db.conversations.deleteOne({ _id: conversationId })
db.messages.deleteMany({ conversation_id: conversationId })
```

**After:**
```javascript
// ✅ Soft delete - just hides for you
db.conversations.updateOne(
  { _id: conversationId },
  { $addToSet: { deleted_for: [your_user_id] } }
)
db.messages.updateMany(
  { conversation_id: conversationId },
  { $addToSet: { deleted_for: [your_user_id] } }
)
```

### **Database Structure:**

**Conversation:**
```javascript
{
  _id: ObjectId("..."),
  participants: [user1_id, user2_id],
  deleted_for: [user1_id],  // ← User1 deleted it, User2 still sees it
  created_at: Date,
  updated_at: Date
}
```

**Messages:**
```javascript
{
  _id: ObjectId("..."),
  conversation_id: ObjectId("..."),
  sender_id: user1_id,
  content: "Hello",
  deleted_for: [user1_id],  // ← User1 deleted it, User2 still sees it
  created_at: Date
}
```

---

## User Scenarios

### **Scenario 1: You Delete, Then Chat Again**

1. **You delete conversation**
   - Conversation hidden from your list
   - Messages hidden from you
   - Other user still sees everything

2. **You search and click user**
   - System finds existing conversation
   - Removes you from `deleted_for` array
   - Restores all old messages for you
   - ✅ You see conversation history again!

3. **You send new message**
   - Message added to SAME conversation
   - Other user sees it in their existing chat
   - ✅ Everything syncs perfectly!

### **Scenario 2: Both Users Delete**

1. **You delete conversation**
   - `deleted_for: [your_id]`
   - You don't see it

2. **Other user deletes too**
   - `deleted_for: [your_id, their_id]`
   - Neither sees it

3. **You search and chat**
   - `deleted_for: [their_id]` (you removed)
   - You see conversation
   - They still don't see it

4. **They search and chat**
   - `deleted_for: []` (both removed)
   - Both see conversation
   - ✅ Fresh start together!

### **Scenario 3: You Delete, Other User Sends Message**

1. **You delete conversation**
   - Hidden from your list
   - `deleted_for: [your_id]`

2. **Other user sends message**
   - Message added to conversation
   - `deleted_for: []` on new message
   - Conversation `updated_at` changes

3. **You check messages**
   - Conversation still hidden (you deleted it)
   - You won't see the new message

4. **You search and restore**
   - Conversation restored
   - ✅ You see all messages including the new one!

---

## API Changes

### **1. Delete Conversation API**

**Endpoint:** `DELETE /api/messages/conversations/[conversationId]/delete`

**Old:**
```typescript
// Hard delete
await db.collection('messages').deleteMany({ conversation_id })
await db.collection('conversations').deleteOne({ _id: conversationId })
```

**New:**
```typescript
// Soft delete - hide for user
await db.collection('conversations').updateOne(
  { _id: conversationId },
  { $addToSet: { deleted_for: userId } }
)
await db.collection('messages').updateMany(
  { conversation_id: conversationId },
  { $addToSet: { deleted_for: userId } }
)
```

### **2. Get Conversations API**

**Endpoint:** `GET /api/messages/conversations`

**Old:**
```typescript
// Get all conversations
db.conversations.find({ participants: userId })
```

**New:**
```typescript
// Exclude deleted ones
db.conversations.find({
  participants: userId,
  deleted_for: { $ne: userId }  // ← Don't show if user deleted it
})
```

### **3. Get Messages API**

**Endpoint:** `GET /api/messages/conversations/[conversationId]/messages`

**Old:**
```typescript
// Get all messages
db.messages.find({ conversation_id: conversationId })
```

**New:**
```typescript
// Exclude deleted ones
db.messages.find({
  conversation_id: conversationId,
  deleted_for: { $ne: userId }  // ← Don't show if user deleted it
})
```

### **4. New Conversation API**

**Endpoint:** `POST /api/messages/conversations/new`

**Old:**
```typescript
// Check if exists
const existing = await db.conversations.findOne({ participants: [...] })
if (existing) return existing

// Create new
await db.conversations.insertOne({ participants: [...] })
```

**New:**
```typescript
// Check if exists (including deleted)
const existing = await db.conversations.findOne({ participants: [...] })

if (existing) {
  // If user deleted it, restore it
  if (existing.deleted_for.includes(userId)) {
    await db.conversations.updateOne(
      { _id: existing._id },
      { $pull: { deleted_for: userId } }  // ← Remove from deleted list
    )
    await db.messages.updateMany(
      { conversation_id: existing._id },
      { $pull: { deleted_for: userId } }  // ← Restore messages
    )
  }
  return existing  // ← Same conversation!
}

// Create new only if doesn't exist
await db.conversations.insertOne({ participants: [...] })
```

---

## Benefits

### **For Users:**
✅ **Delete = Hide** - Conversation hidden from your view  
✅ **Chat again = Restore** - All history comes back  
✅ **Privacy** - Other user can't see you deleted it  
✅ **No duplicates** - Always same conversation  
✅ **Message sync** - All messages in one place  

### **For Database:**
✅ **No data loss** - Messages preserved  
✅ **No orphaned data** - Everything stays connected  
✅ **Easy restore** - Just remove from array  
✅ **Audit trail** - Can see who deleted what  

---

## Testing

### **Test 1: Delete and Restore**
1. Open conversation with User A
2. Delete conversation
3. Conversation disappears from list ✅
4. Search for User A
5. Click to start chat
6. ✅ See all old messages!

### **Test 2: Both Users Delete**
1. You delete conversation with User B
2. User B deletes conversation with you
3. Both don't see conversation ✅
4. You search and chat User B
5. You see conversation, they don't ✅
6. They search and chat you
7. Both see conversation ✅

### **Test 3: Delete, Other Sends Message**
1. Delete conversation with User C
2. User C sends you a message
3. You don't see it (conversation hidden) ✅
4. Search for User C
5. Click to chat
6. ✅ See all messages including new one!

---

## Database Queries

### **Check Deleted Conversations:**
```javascript
// In MongoDB shell
db.conversations.find({ 
  deleted_for: { $exists: true, $ne: [] } 
}).pretty()
```

### **Check Who Deleted:**
```javascript
db.conversations.findOne({ _id: ObjectId("...") }).deleted_for
// Returns: [ObjectId("user1"), ObjectId("user2")]
```

### **Restore for User:**
```javascript
db.conversations.updateOne(
  { _id: ObjectId("...") },
  { $pull: { deleted_for: ObjectId("user_id") } }
)
```

---

## Summary

### **What Changed:**
- ❌ No more hard delete
- ✅ Soft delete (hide only)
- ✅ Automatic restore when chatting again
- ✅ Messages always sync
- ✅ No duplicate conversations

### **How It Works:**
1. Delete → Add user to `deleted_for` array
2. List conversations → Exclude if user in `deleted_for`
3. Start chat → Remove user from `deleted_for`
4. ✅ Same conversation, always!

---

**Your chat system now works perfectly with soft delete!** 🎉

No more duplicate conversations or sync issues!
