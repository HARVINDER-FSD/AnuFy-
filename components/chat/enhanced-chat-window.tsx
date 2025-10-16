"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Smile, Image as ImageIcon, Paperclip, Mic, Video, Phone, 
  EllipsisVertical, ArrowLeft, Search, Info, X, Reply, Copy, Forward, 
  Pin, Trash2, Edit2, Check, CheckCheck, Volume2, Pause, Play,
  Download, Eye, EyeOff, Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSocket } from '@/hooks/use-socket'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  _id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'video' | 'voice' | 'gif' | 'sticker' | 'shared_post' | 'shared_profile'
  media_url?: string
  media_type?: string
  reply_to?: {
    _id: string
    content: string
    sender_username: string
  }
  created_at: string
  updated_at?: string
  is_edited: boolean
  is_deleted: boolean
  status: {
    sent: boolean
    delivered: boolean
    seen: boolean
  }
  reactions: Array<{
    user_id: string
    emoji: string
    created_at: string
  }>
}

interface Participant {
  id: string
  username: string
  avatar?: string
  isOnline: boolean
  isVerified?: boolean
}

interface EnhancedChatWindowProps {
  conversationId: string
  recipient: Participant
  isVanishMode?: boolean
  onClose?: () => void
}

export function EnhancedChatWindow({ 
  conversationId, 
  recipient, 
  isVanishMode = false,
  onClose 
}: EnhancedChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [vanishMode, setVanishMode] = useState(isVanishMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  
  const { socket, isConnected, sendMessage, joinConversation, leaveConversation, startTyping, stopTyping, markMessagesAsRead } = useSocket()
  const { user } = useAuth()

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Join conversation
  useEffect(() => {
    console.log('[EnhancedChatWindow] useEffect triggered - isConnected:', isConnected, 'conversationId:', conversationId);
    
    if (conversationId) {
      console.log('[EnhancedChatWindow] Loading messages (socket not required)');
      loadMessages();
      
      if (isConnected) {
        console.log('[EnhancedChatWindow] Joining conversation via socket');
        joinConversation(conversationId);
      }
    }

    return () => {
      if (conversationId && isConnected) {
        leaveConversation(conversationId)
      }
    }
  }, [conversationId])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message])
      if (message.conversation_id === conversationId) {
        markMessagesAsRead(conversationId, [message._id])
      }
    }

    const handleMessageUpdated = (message: Message) => {
      setMessages(prev => prev.map(msg => msg._id === message._id ? message : msg))
    }

    const handleMessageDeleted = (messageId: string) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, is_deleted: true, content: 'This message was deleted' } : msg
      ))
    }

    const handleMessageReaction = (data: { messageId: string; reaction: any }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === data.messageId) {
          const existingReaction = msg.reactions.find(r => r.user_id === data.reaction.user_id)
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map(r => 
                r.user_id === data.reaction.user_id ? data.reaction : r
              )
            }
          }
          return { ...msg, reactions: [...msg.reactions, data.reaction] }
        }
        return msg
      }))
    }

    const handleUserTyping = (data: { userId: string; username: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId])
        setIsTyping(true)
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId))
        }, 3000)
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('message_updated', handleMessageUpdated)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('message_reaction', handleMessageReaction)
    socket.on('user_typing', handleUserTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('message_updated', handleMessageUpdated)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('message_reaction', handleMessageReaction)
      socket.off('user_typing', handleUserTyping)
    }
  }, [socket, conversationId, user?.id])

  const loadMessages = async () => {
    try {
      console.log('[EnhancedChatWindow] Starting to load messages for:', conversationId);
      
      // Get token from cookies (try both client-token and token)
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('client-token=')) || 
                         cookies.find(c => c.trim().startsWith('token='));
      const token = tokenCookie?.split('=')[1];

      if (!token) {
        console.error('[EnhancedChatWindow] No auth token found');
        setIsLoading(false);
        return;
      }

      console.log('[EnhancedChatWindow] Token found, fetching messages...');
      
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      console.log('[EnhancedChatWindow] Response status:', response.status);

      if (response.ok) {
        const data = await response.json()
        console.log('[EnhancedChatWindow] Messages loaded:', data.messages?.length || 0, 'messages');
        
        // Transform messages to match expected format
        const transformedMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          status: {
            sent: true,
            delivered: true,
            seen: msg.is_read || false
          },
          is_edited: false,
          is_deleted: msg.is_deleted || false,
          reactions: msg.reactions || []
        }));
        
        console.log('[EnhancedChatWindow] Transformed messages:', transformedMessages.length);
        setMessages(transformedMessages);
        
        // Mark unread messages as read
        const unreadMessageIds = transformedMessages
          .filter((msg: Message) => !msg.status.seen && msg.sender_id !== user?.id)
          .map((msg: Message) => msg._id);
        
        if (unreadMessageIds.length > 0 && markMessagesAsRead) {
          markMessagesAsRead(conversationId, unreadMessageIds);
        }
      } else {
        const errorText = await response.text();
        console.error('[EnhancedChatWindow] Failed to load messages:', response.status, errorText);
      }
    } catch (error) {
      console.error('[EnhancedChatWindow] Error loading messages:', error)
    } finally {
      console.log('[EnhancedChatWindow] Setting isLoading to false');
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !isConnected) return

    if (editingMessage) {
      // Edit existing message
      await handleEditMessage(editingMessage._id, newMessage)
      setEditingMessage(null)
    } else {
      // Send new message
      sendMessage({
        conversationId,
        content: newMessage.trim(),
        messageType: 'text',
        replyTo: replyingTo?._id
      })
      setReplyingTo(null)
    }
    
    setNewMessage('')
    stopTyping(conversationId)
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1]

      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newContent })
      })
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string, deleteFor: 'me' | 'everyone') => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1]

      await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ delete_for: deleteFor })
      })
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1]

      await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      })
    } catch (error) {
      console.error('Error reacting to message:', error)
    }
  }

  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'voice') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1]

      const response = await fetch(`/api/messages/conversations/${conversationId}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        sendMessage({
          conversationId,
          content: '',
          messageType: type,
          mediaUrl: data.url
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' })
        await handleFileUpload(file, 'voice')
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      setTimeout(() => {
        clearInterval(interval)
      }, 60000) // Max 60 seconds
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingTime(0)
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    if (e.target.value.trim() && !typingTimeoutRef.current) {
      startTyping(conversationId)
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId)
      typingTimeoutRef.current = null
    }, 1000)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageStatusIcon = (message: Message) => {
    if (message.sender_id !== user?.id) return null
    
    if (message.status.seen) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    } else if (message.status.delivered) {
      return <CheckCheck className="h-3 w-3" />
    } else if (message.status.sent) {
      return <Check className="h-3 w-3" />
    }
    return null
  }

  const renderMessageContent = (message: Message) => {
    if (message.is_deleted) {
      return (
        <p className="text-sm italic text-muted-foreground">
          <EyeOff className="h-3 w-3 inline mr-1" />
          This message was deleted
        </p>
      )
    }

    switch (message.message_type) {
      case 'image':
        return (
          <div className="relative group">
            <img 
              src={message.media_url} 
              alt="Shared image" 
              className="max-w-xs rounded-lg cursor-pointer"
              onClick={() => window.open(message.media_url, '_blank')}
            />
            {message.content && <p className="text-sm mt-2">{message.content}</p>}
          </div>
        )
      
      case 'video':
        return (
          <div className="relative">
            <video 
              src={message.media_url} 
              controls 
              className="max-w-xs rounded-lg"
            />
            {message.content && <p className="text-sm mt-2">{message.content}</p>}
          </div>
        )
      
      case 'voice':
        return (
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1 h-8 bg-primary/20 rounded-full" />
            <span className="text-xs">0:00</span>
          </div>
        )
      
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipient.avatar || "/placeholder-user.jpg"} alt={recipient.username} />
              <AvatarFallback>{recipient.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold flex items-center gap-1">
                {recipient.username}
                {recipient.isVerified && (
                  <Check className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isTyping ? 'typing...' : recipient.isOnline ? 'Active now' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setVanishMode(!vanishMode)}>
                  <Flame className="h-4 w-4 mr-2" />
                  {vanishMode ? 'Turn off' : 'Turn on'} Vanish Mode
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-3">
            <Input
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted"
            />
          </div>
        )}

        {/* Vanish Mode Banner */}
        {vanishMode && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 text-sm text-center">
            <Flame className="h-4 w-4 inline mr-2" />
            Vanish mode is on. Messages will disappear when you leave the chat.
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id
            
            return (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[70%] group", isOwnMessage ? "order-2" : "order-1")}>
                  {/* Reply Preview */}
                  {message.reply_to && (
                    <div className="mb-1 px-3 py-1 bg-muted/50 rounded-t-lg border-l-2 border-primary">
                      <p className="text-xs font-medium">{message.reply_to.sender_username}</p>
                      <p className="text-xs text-muted-foreground truncate">{message.reply_to.content}</p>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 relative",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}
                  >
                    {renderMessageContent(message)}
                    
                    <div className="flex items-center gap-1 mt-1">
                      <p className={cn(
                        "text-xs",
                        isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {formatTime(message.created_at)}
                        {message.is_edited && " (edited)"}
                      </p>
                      {getMessageStatusIcon(message)}
                    </div>

                    {/* Message Actions (on hover) */}
                    <div className={cn(
                      "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                      isOwnMessage ? "right-full mr-2" : "left-full ml-2"
                    )}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 bg-background shadow-md"
                        onClick={() => handleReactToMessage(message._id, '❤️')}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 bg-background shadow-md"
                        onClick={() => setReplyingTo(message)}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 bg-background shadow-md"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleCopyMessage(message.content)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Forward className="h-4 w-4 mr-2" />
                            Forward
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin
                          </DropdownMenuItem>
                          {isOwnMessage && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setEditingMessage(message)
                                setNewMessage(message.content)
                              }}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteMessage(message._id, 'everyone')}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Unsend
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Reactions */}
                  {message.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {message.reactions.map((reaction, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-xs px-2 py-0.5"
                        >
                          {reaction.emoji}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {/* Typing indicator */}
        {isTyping && typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium">Replying to {replyingTo.sender_id === user?.id ? 'yourself' : recipient.username}</p>
            <p className="text-sm text-muted-foreground truncate">{replyingTo.content}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setReplyingTo(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Preview */}
      {editingMessage && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium">Editing message</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditingMessage(null)
              setNewMessage('')
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Voice Recording */}
      {isRecording && (
        <div className="px-4 py-3 bg-destructive/10 border-t flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording... {recordingTime}s</span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={stopVoiceRecording}
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const type = file.type.startsWith('image/') ? 'image' : 'video'
                handleFileUpload(file, type)
              }
            }}
          />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={isRecording ? "text-destructive" : ""}
          >
            <Mic className="h-5 w-5" />
          </Button>
          
          <Textarea
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Message..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            disabled={!isConnected || isRecording}
          />
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || !isConnected}
            size="icon"
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
