"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Search, MessageCircle, Edit } from 'lucide-react'
import { subscribeToConversations, FirebaseConversation } from '@/lib/firebase-chat'
import { formatDistanceToNow } from 'date-fns'

interface FirebaseChatListProps {
  onSelectConversation: (conversationId: string, recipient: any) => void
}

export function FirebaseChatList({ onSelectConversation }: FirebaseChatListProps) {
  const [conversations, setConversations] = useState<FirebaseConversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [userDetails, setUserDetails] = useState<{ [key: string]: any }>({})
  const { user } = useAuth()

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToConversations(user.id, (newConversations) => {
      console.log('📋 Conversations updated:', newConversations.length)
      setConversations(newConversations)
      setIsLoading(false)
      
      // Fetch user details for all participants
      newConversations.forEach(conv => {
        conv.participants.forEach(participantId => {
          if (participantId !== user.id && !userDetails[participantId]) {
            fetchUserDetails(participantId)
          }
        })
      })
    })

    return () => unsubscribe()
  }, [user?.id])

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUserDetails(prev => ({
          ...prev,
          [userId]: data.user
        }))
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const getRecipient = (conversation: FirebaseConversation) => {
    const recipientId = conversation.participants.find(p => p !== user?.id)
    return recipientId ? userDetails[recipientId] : null
  }

  const filteredConversations = conversations.filter(conv => {
    const recipient = getRecipient(conv)
    if (!recipient) return false
    
    const searchLower = searchQuery.toLowerCase()
    return (
      recipient.username?.toLowerCase().includes(searchLower) ||
      recipient.full_name?.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Edit className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-full outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No messages yet</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'No conversations match your search' : 'Start a conversation to see it here'}
            </p>
          </div>
        ) : (
          filteredConversations.map(conversation => {
            const recipient = getRecipient(conversation)
            if (!recipient) return null

            const unreadCount = conversation.unreadCount?.[user?.id || ''] || 0
            const lastMessage = conversation.lastMessage

            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id!, recipient)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border/50"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={recipient.avatar || '/default-avatar.png'}
                    alt=""
                    className="w-14 h-14 rounded-full"
                  />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-semibold truncate ${unreadCount > 0 ? 'text-foreground' : 'text-foreground'}`}>
                      {recipient.full_name || recipient.username}
                    </p>
                    {lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatDistanceToNow(lastMessage.timestamp?.toDate?.() || new Date(), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {lastMessage && (
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {lastMessage.senderId === user?.id ? 'You: ' : ''}
                      {lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
