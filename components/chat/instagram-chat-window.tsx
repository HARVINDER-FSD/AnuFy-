"use client"

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Phone, Video, Info, Send, Smile, Image as ImageIcon, Mic, Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthToken } from '@/lib/auth-utils'
import { useAuth } from '@/components/auth/auth-provider'

interface Message {
  _id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'video'
  media_url?: string
  created_at: string
  is_read: boolean
}

interface Recipient {
  id: string
  username: string
  full_name?: string
  avatar: string
  followers_count?: number
  posts_count?: number
  bio?: string
}

interface InstagramChatWindowProps {
  conversationId: string
  recipient: Recipient
  onClose?: () => void
}

export function InstagramChatWindow({ conversationId, recipient, onClose }: InstagramChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (conversationId) {
      loadMessages()
    }
  }, [conversationId])

  const loadMessages = async () => {
    try {
      console.log('[InstagramChat] Loading messages for:', conversationId)
      
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(c => c.trim().startsWith('client-token=')) || 
                         cookies.find(c => c.trim().startsWith('token='))
      const token = tokenCookie?.split('=')[1]

      if (!token) {
        console.error('[InstagramChat] No auth token found')
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/messages/conversations/${conversationId}/messages?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[InstagramChat] Messages loaded:', data.messages?.length || 0)
        setMessages(data.messages || [])
      } else {
        console.error('[InstagramChat] Failed to load messages:', response.status)
      }
    } catch (error) {
      console.error('[InstagramChat] Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(c => c.trim().startsWith('client-token=')) || 
                         cookies.find(c => c.trim().startsWith('token='))
      const token = tokenCookie?.split('=')[1]

      if (!token) return

      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          message_type: 'text'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data])
        setNewMessage('')
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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
          <div className="flex items-center gap-3">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipient.avatar} alt={recipient.username} />
              <AvatarFallback>{recipient.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{recipient.full_name || recipient.username}</p>
              <p className="text-xs text-muted-foreground">{recipient.username}</p>
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty State - Instagram Style Profile */
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src={recipient.avatar} alt={recipient.username} />
              <AvatarFallback className="text-4xl">{recipient.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-semibold mb-1">{recipient.full_name || recipient.username}</h2>
            <p className="text-sm text-muted-foreground mb-4">{recipient.username}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span>{recipient.followers_count || 0} followers</span>
              <span>·</span>
              <span>{recipient.posts_count || 0} posts</span>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mb-2">
              You follow each other on Instagram
            </p>
            
            {recipient.bio && (
              <p className="text-center text-sm text-muted-foreground mb-4">
                {recipient.bio}
              </p>
            )}
            
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = `/profile/${recipient.username}`}
            >
              View Profile
            </Button>
          </div>
        ) : (
          /* Messages List */
          <div className="px-4 py-4 space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id
              const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id)
              
              return (
                <div
                  key={message._id}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                    <Avatar className={`h-6 w-6 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      <AvatarImage src={recipient.avatar} alt={recipient.username} />
                      <AvatarFallback>{recipient.username[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-4 py-2 rounded-3xl ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 px-2">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Instagram Style */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="bg-primary rounded-full p-2">
              <ImageIcon className="h-5 w-5 text-primary-foreground" />
            </div>
          </Button>
          
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2">
            <Input
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Mic className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
          
          {newMessage.trim() ? (
            <Button 
              onClick={handleSendMessage}
              size="sm"
              className="rounded-full font-semibold"
            >
              Send
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
