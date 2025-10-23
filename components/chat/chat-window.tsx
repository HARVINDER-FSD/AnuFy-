"use client"

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Phone, Video, Info, Smile, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth/auth-provider'
// MessageBubble component inlined to avoid import issues

interface ChatWindowProps {
  conversationId: string
  recipient: {
    id: string
    username: string
    full_name?: string
    avatar: string
  }
  onClose?: () => void
}

export function ChatWindow({ conversationId, recipient, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [storyStatus, setStoryStatus] = useState<{ hasStories: boolean; allViewed: boolean } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchMessages()
    fetchStoryStatus()
  }, [conversationId])

  const fetchStoryStatus = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]
      
      const response = await fetch(`/api/stories/user/${recipient.id}/status`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStoryStatus(data)
      }
    } catch (error) {
      console.error('Error fetching story status:', error)
    }
  }

  const handleAvatarClick = () => {
    if (storyStatus?.hasStories) {
      window.location.href = `/stories?userId=${recipient.id}`
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversation_id: conversationId,
          content: newMessage,
          message_type: 'text',
          reply_to: replyingTo?._id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/messages/conversations/${conversationId}/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji })
      })
      fetchMessages()
    } catch (error) {
      console.error('Error reacting:', error)
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      setMessages(prev => prev.filter(m => m._id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div 
              className="relative cursor-pointer"
              onClick={handleAvatarClick}
            >
              <div className={`rounded-full p-[2px] ${
                storyStatus?.hasStories 
                  ? storyStatus.allViewed 
                    ? 'bg-gradient-to-tr from-gray-400 to-gray-300' 
                    : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                  : ''
              }`}>
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={recipient.avatar} />
                  <AvatarFallback>{recipient.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm">{recipient.full_name || recipient.username}</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={recipient.avatar} />
              <AvatarFallback className="text-2xl">{recipient.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-lg mb-2">{recipient.full_name || recipient.username}</h3>
            <p className="text-sm text-muted-foreground mb-4">{recipient.username}</p>
            <Button onClick={() => inputRef.current?.focus()}>Send Message</Button>
          </div>
        ) : (
          <div className="px-4 py-4">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id
              const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id)
              return (
                <div
                  key={message._id}
                  className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                    <Avatar className={`h-6 w-6 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      <AvatarImage src={recipient.avatar} />
                      <AvatarFallback>{recipient.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-2 rounded-3xl ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t">
        {replyingTo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
            <div className="flex-1">
              <p className="text-xs font-semibold">Replying to {replyingTo.sender_id === user?.id ? 'yourself' : recipient.username}</p>
              <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
          </div>
        )}
        <div className="px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            className="flex-1"
          />
          {newMessage.trim() && (
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
