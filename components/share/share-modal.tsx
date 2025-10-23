"use client"

import { useState, useEffect } from 'react'
import { X, Search, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: 'post' | 'story'
  contentId: string
  previewData?: {
    media_url?: string
    media_type?: string
    caption?: string
    username?: string
    avatar?: string
  }
}

interface Conversation {
  id: string
  user: {
    id: string
    username: string
    full_name?: string
    avatar?: string
    verified?: boolean
  }
  lastMessage?: {
    text: string
    timestamp: string
    isRead: boolean
  }
  unreadCount?: number
}

export function ShareModal({ isOpen, onClose, contentType, contentId, previewData }: ShareModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(c => c.trim().startsWith('client-token=')) || 
                         cookies.find(c => c.trim().startsWith('token='))
      const token = tokenCookie?.split('=')[1]

      console.log('[ShareModal] Token found:', !!token)

      if (!token) {
        console.error('[ShareModal] No auth token found')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/messages/conversations?limit=50', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      console.log('[ShareModal] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[ShareModal] Conversations loaded:', data.conversations?.length || 0)
        setConversations(data.conversations || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[ShareModal] Failed to load conversations:', response.status, errorData)
      }
    } catch (error) {
      console.error('[ShareModal] Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleConversation = (conversationId: string) => {
    const newSelected = new Set(selectedConversations)
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId)
    } else {
      newSelected.add(conversationId)
    }
    setSelectedConversations(newSelected)
  }

  const handleShare = async () => {
    if (selectedConversations.size === 0) return

    setIsSending(true)
    try {
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(c => c.trim().startsWith('client-token=')) || 
                         cookies.find(c => c.trim().startsWith('token='))
      const token = tokenCookie?.split('=')[1]

      if (!token) return

      const messageData = {
        content: message || `Shared a ${contentType}`,
        message_type: contentType === 'post' ? 'shared_post' : 'shared_story',
        shared_content: {
          content_type: contentType,
          content_id: contentId,
          preview_data: previewData
        }
      }

      console.log('[ShareModal] Sharing with data:', messageData)

      const sharePromises = Array.from(selectedConversations).map(conversationId =>
        fetch(`/api/messages/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageData)
        })
      )

      await Promise.all(sharePromises)
      
      // Success - close modal
      onClose()
      setSelectedConversations(new Set())
      setMessage('')
    } catch (error) {
      console.error('Error sharing:', error)
    } finally {
      setIsSending(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase()
    return (
      conv.user?.username?.toLowerCase().includes(searchLower) ||
      conv.user?.full_name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[300px] -mx-6 px-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No conversations found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => {
                const isSelected = selectedConversations.has(conv.id)

                return (
                  <button
                    key={conv.id}
                    onClick={() => toggleConversation(conv.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={conv.user?.avatar} 
                          alt={conv.user?.username} 
                        />
                        <AvatarFallback>
                          {conv.user?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                          <svg className="h-3 w-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">
                        {conv.user?.full_name || conv.user?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.user?.username}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="space-y-3">
          <Input
            placeholder="Write a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Send Button */}
          <Button
            onClick={handleShare}
            disabled={selectedConversations.size === 0 || isSending}
            className="w-full"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {selectedConversations.size} {selectedConversations.size === 1 ? 'person' : 'people'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
