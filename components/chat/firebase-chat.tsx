"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ArrowLeft, Phone, Video, Info, Mic, Image as ImageIcon, Smile, X, Reply, Copy, Trash2, Heart, MoreVertical, Send } from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { useTheme } from 'next-themes'
import {
  subscribeToMessages,
  sendMessage,
  addReaction,
  deleteMessage,
  markMessagesAsRead,
  uploadChatMedia,
  FirebaseMessage
} from '@/lib/firebase-chat'

interface FirebaseChatProps {
  conversationId: string
  recipient: {
    id: string
    username: string
    full_name?: string
    avatar: string
  }
  onClose?: () => void
}

export function FirebaseChat({ conversationId, recipient, onClose }: FirebaseChatProps) {
  const [messages, setMessages] = useState<FirebaseMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<FirebaseMessage | null>(null)
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<FirebaseMessage | null>(null)
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { theme, systemTheme } = useTheme()

  const quickReactions = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥']
  const currentTheme = theme === 'system' ? systemTheme : theme
  const emojiTheme = currentTheme === 'dark' ? Theme.DARK : Theme.LIGHT

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return

    setIsLoading(true)
    
    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      console.log('📨 Real-time messages received:', newMessages.length)
      setMessages(newMessages)
      setIsLoading(false)
    })

    // Mark messages as read
    if (user?.id) {
      markMessagesAsRead(conversationId, user.id)
    }

    return () => unsubscribe()
  }, [conversationId, user?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return
    if (!user?.id) return

    const messageContent = newMessage
    const replyToData = replyingTo

    // Clear input immediately
    setNewMessage('')
    setReplyingTo(null)
    setIsSending(true)

    try {
      await sendMessage(
        conversationId,
        user.id,
        messageContent,
        'text',
        {
          replyTo: replyToData ? {
            id: replyToData.id!,
            content: replyToData.content,
            senderId: replyToData.senderId
          } : undefined
        }
      )
      console.log('✅ Message sent successfully')
    } catch (error) {
      console.error('❌ Error sending message:', error)
      // Restore message on error
      setNewMessage(messageContent)
      setReplyingTo(replyToData)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user?.id) return

    try {
      await addReaction(messageId, user.id, emoji)
      console.log('❤️ Reaction updated')
    } catch (error) {
      console.error('❌ Error updating reaction:', error)
    }
    
    setShowReactionPicker(null)
  }

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      console.log('🗑️ Message deleted')
    } catch (error) {
      console.error('❌ Error deleting message:', error)
      alert('Failed to delete message')
    }
    
    setShowMessageMenu(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image or video file')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSendMedia = async () => {
    if (!selectedFile || !user?.id) return

    setIsUploading(true)
    try {
      // Upload to Firebase Storage
      const mediaUrl = await uploadChatMedia(selectedFile, conversationId, user.id)
      
      // Send message with media
      const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'video'
      await sendMessage(
        conversationId,
        user.id,
        newMessage.trim() || `Sent ${messageType}`,
        messageType,
        { mediaUrl }
      )

      setNewMessage('')
      setSelectedFile(null)
      setFilePreview(null)
      console.log('✅ Media sent successfully')
    } catch (error) {
      console.error('❌ Error sending media:', error)
      alert('Failed to send media')
    } finally {
      setIsUploading(false)
    }
  }

  const cancelMediaUpload = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEmojiSelect = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <img src={recipient.avatar} alt="" className="w-9 h-9 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{recipient.full_name || recipient.username}</p>
            <p className="text-xs text-muted-foreground truncate">@{recipient.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-1 hover:bg-muted rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-muted rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-muted rounded-full transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img src={recipient.avatar} alt="" className="w-24 h-24 rounded-full mb-4" />
            <p className="font-semibold text-lg">{recipient.full_name || recipient.username}</p>
            <p className="text-muted-foreground text-sm">@{recipient.username}</p>
            <p className="text-muted-foreground text-sm mt-2">Send a message to start chatting</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === user?.id
            const showTimestamp = index === 0 || 
              (messages[index - 1] && 
               new Date(message.createdAt?.toDate?.() || message.createdAt).getTime() - 
               new Date(messages[index - 1].createdAt?.toDate?.() || messages[index - 1].createdAt).getTime() > 3600000)

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded-full">
                      {new Date(message.createdAt?.toDate?.() || message.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                <div
                  className={`flex gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  onMouseEnter={() => setHoveredMessage(message.id!)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  {!isOwn && (
                    <img src={recipient.avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                  )}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="text-xs text-muted-foreground mb-1 px-3 py-1 bg-muted/50 rounded">
                        Replying to: {message.replyTo.content.substring(0, 50)}...
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`relative px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      } ${message.isDeleted ? 'italic opacity-60' : ''}`}
                    >
                      {message.messageType === 'image' && message.mediaUrl && (
                        <img
                          src={message.mediaUrl}
                          alt="Shared image"
                          className="rounded-lg max-w-full mb-2 cursor-pointer"
                          onClick={() => window.open(message.mediaUrl, '_blank')}
                        />
                      )}
                      
                      {message.messageType === 'video' && message.mediaUrl && (
                        <video
                          src={message.mediaUrl}
                          controls
                          className="rounded-lg max-w-full mb-2"
                        />
                      )}

                      <p className="text-sm break-words">{message.content}</p>

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {Object.entries(
                            message.reactions.reduce((acc: any, r: any) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1
                              return acc
                            }, {})
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="text-xs px-1.5 py-0.5 bg-background/50 rounded-full cursor-pointer hover:bg-background"
                              onClick={() => handleReaction(message.id!, emoji)}
                            >
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick reactions on hover */}
                    {hoveredMessage === message.id && !message.isDeleted && (
                      <div className="flex gap-1 mt-1 bg-background border border-border rounded-full px-2 py-1 shadow-lg">
                        {quickReactions.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id!, emoji)}
                            className="hover:scale-125 transition-transform text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="hover:bg-muted rounded-full p-1"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(message.id!)}
                            className="hover:bg-muted rounded-full p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {filePreview && (
        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <div className="relative inline-block">
            {selectedFile?.type.startsWith('image/') ? (
              <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg" />
            ) : (
              <video src={filePreview} className="max-h-32 rounded-lg" />
            )}
            <button
              onClick={cancelMediaUpload}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 border-t border-border bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4" />
            <span className="text-sm">Replying to: {replyingTo.content.substring(0, 50)}...</span>
          </div>
          <button onClick={() => setReplyingTo(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*,video/*"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            disabled={isUploading}
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (selectedFile) {
                  handleSendMedia()
                } else {
                  handleSend()
                }
              }
            }}
            placeholder="Message..."
            className="flex-1 px-4 py-2 bg-muted rounded-full outline-none"
            disabled={isSending || isUploading}
          />

          <button
            onClick={selectedFile ? handleSendMedia : handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
            className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
          >
            {isSending || isUploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-primary" />
            )}
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4 z-50">
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              theme={emojiTheme}
              width={300}
              height={400}
            />
          </div>
        )}
      </div>
    </div>
  )
}
