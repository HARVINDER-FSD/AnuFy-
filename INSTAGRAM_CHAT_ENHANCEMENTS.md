# Instagram Chat Room - Advanced Features Implementation Plan

## Features to Implement

### 1. ✅ Message Reactions
- Double-tap to heart
- Long-press to show reaction picker
- Display reactions below messages
- Multiple reactions per message

### 2. ✅ Reply to Messages
- Click reply button on message
- Show replied message preview
- Link to original message

### 3. ✅ Message Actions Menu
- Long press / right-click menu
- Copy text
- Delete message
- Reply to message
- React to message

### 4. ✅ Typing Indicator
- Show "typing..." when other user is typing
- Real-time updates

### 5. ✅ Read Receipts
- Show "Seen" status
- Show timestamp when seen

### 6. ✅ Voice Messages
- Record voice message
- Play voice messages
- Waveform visualization

### 7. ✅ Media Upload
- Image upload with preview
- Video upload
- Multiple images

### 8. ✅ Emoji Picker
- Full emoji selector
- Recent emojis
- Search emojis

### 9. ✅ Message Deletion
- Delete for me
- Delete for everyone (if sender)
- Undo delete

### 10. ✅ Advanced UI
- Smooth animations
- Swipe to reply (mobile)
- Message grouping by time
- Date separators

## Implementation Steps

Due to the complexity, I'll provide the key enhancements you need to add to your existing `instagram-chat-window.tsx`:

### Step 1: Add Required State Variables
```typescript
const [isTyping, setIsTyping] = useState(false)
const [replyingTo, setReplyingTo] = useState<Message | null>(null)
const [showEmojiPicker, setShowEmojiPicker] = useState(false)
const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
```

### Step 2: Add Message Reaction Function
```typescript
const handleReaction = async (messageId: string, emoji: string) => {
  try {
    const token = getToken()
    await fetch(`/api/messages/${messageId}/react`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emoji })
    })
    // Update local state
    setMessages(prev => prev.map(msg => 
      msg._id === messageId 
        ? { ...msg, reactions: [...(msg.reactions || []), { user_id: user.id, emoji }] }
        : msg
    ))
  } catch (error) {
    console.error('Error adding reaction:', error)
  }
}
```

### Step 3: Add Reply Functionality
```typescript
const handleReply = (message: Message) => {
  setReplyingTo(message)
  inputRef.current?.focus()
}

const handleSendWithReply = async () => {
  const messageData = {
    content: newMessage.trim(),
    message_type: 'text',
    reply_to: replyingTo?._id
  }
  // Send message...
  setReplyingTo(null)
}
```

### Step 4: Add Long Press Handler
```typescript
const handleLongPress = (messageId: string) => {
  setSelectedMessage(messageId)
  // Show action menu
}

const handleTouchStart = (messageId: string) => {
  longPressTimer.current = setTimeout(() => {
    handleLongPress(messageId)
  }, 500)
}

const handleTouchEnd = () => {
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current)
  }
}
```

### Step 5: Add Double-Tap to React
```typescript
const handleDoubleTap = (messageId: string) => {
  handleReaction(messageId, '❤️')
}

let lastTap = 0
const handleMessageTap = (messageId: string) => {
  const now = Date.now()
  if (now - lastTap < 300) {
    handleDoubleTap(messageId)
  }
  lastTap = now
}
```

## Required API Endpoints

### 1. Add Reaction
```
POST /api/messages/:messageId/react
Body: { emoji: string }
```

### 2. Delete Message
```
DELETE /api/messages/:messageId
Query: ?deleteForEveryone=true
```

### 3. Mark as Read
```
POST /api/messages/:messageId/read
```

### 4. Typing Indicator
```
POST /api/conversations/:conversationId/typing
Body: { isTyping: boolean }
```

## UI Components Needed

### 1. Reaction Picker
```tsx
<div className="flex gap-2 p-2 bg-background rounded-full shadow-lg">
  {['❤️', '😂', '😮', '😢', '🙏', '👍'].map(emoji => (
    <button onClick={() => handleReaction(messageId, emoji)}>
      {emoji}
    </button>
  ))}
</div>
```

### 2. Reply Preview
```tsx
{replyingTo && (
  <div className="flex items-center gap-2 px-4 py-2 bg-muted">
    <Reply className="h-4 w-4" />
    <div className="flex-1">
      <p className="text-xs font-semibold">{replyingTo.sender_id === user.id ? 'You' : recipient.username}</p>
      <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
    </div>
    <button onClick={() => setReplyingTo(null)}>×</button>
  </div>
)}
```

### 3. Message Actions Menu
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical className="h-4 w-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleReply(message)}>
      <Reply className="h-4 w-4 mr-2" /> Reply
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleCopy(message.content)}>
      <Copy className="h-4 w-4 mr-2" /> Copy
    </DropdownMenuItem>
    {message.sender_id === user.id && (
      <DropdownMenuItem onClick={() => handleDelete(message._id)}>
        <Trash2 className="h-4 w-4 mr-2" /> Delete
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

## Next Steps

1. Install required packages:
```bash
npm install emoji-picker-react
npm install react-h5-audio-player
```

2. Update message model to support reactions and replies

3. Create API endpoints for reactions, typing, etc.

4. Add real-time updates with WebSockets or polling

5. Test all features thoroughly

Would you like me to implement any specific feature first?
