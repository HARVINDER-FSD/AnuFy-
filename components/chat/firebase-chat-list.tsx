"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Search, MessageCircle, Edit } from 'lucide-react'
import { subscribeToConversations, FirebaseConversation, getOrCreateConversation } from '@/lib/firebase-chat'
import { formatDistanceToNow } from 'date-fns'

interface FirebaseChatListProps {
  onSelectConversation: (conversationId: string, recipient: any) => void
}

export function FirebaseChatList({ onSelectConversation }: FirebaseChatListProps) {
  const [conversations, setConversations] = useState<FirebaseConversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [userDetails, setUserDetails] = useState<{ [key: string]: any }>({})
  const [searchUsers, setSearchUsers] = useState<any[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const { user } = useAuth()

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToConversations(user.id, (newConversations) => {
      console.log('📋 Conversations updated:', newConversations.length)
      setConversations(newConversations)
      setIsLoading(false)
      
      // Batch fetch user details for all participants
      const participantIds = new Set<string>()
      newConversations.forEach(conv => {
        conv.participants.forEach(participantId => {
          if (participantId !== user.id && !userDetails[participantId]) {
            participantIds.add(participantId)
          }
        })
      })
      
      if (participantIds.size > 0) {
        fetchBatchUserDetails(Array.from(participantIds))
      }
    })

    return () => unsubscribe()
  }, [user?.id])

  const fetchBatchUserDetails = async (userIds: string[]) => {
    try {
      // Use batch API for faster loading
      const response = await fetch('/api/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserDetails(prev => ({ ...prev, ...data.users }))
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const getRecipient = (conversation: FirebaseConversation) => {
    const recipientId = conversation.participants.find(p => p !== user?.id)
    return recipientId ? userDetails[recipientId] : null
  }

  // Search for new users from MongoDB when typing
  useEffect(() => {
    if (searchQuery.length > 0) {
      setSearchingUsers(true)
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/users/search?q=${searchQuery}`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            setSearchUsers(data.users || [])
          }
        } catch (error) {
          console.error('Error searching users:', error)
        } finally {
          setSearchingUsers(false)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchUsers([])
    }
  }, [searchQuery])

  const filteredConversations = conversations.filter(conv => {
    const recipient = getRecipient(conv)
    if (!recipient) return false
    
    const searchLower = searchQuery.toLowerCase()
    return (
      recipient.username?.toLowerCase().includes(searchLower) ||
      recipient.full_name?.toLowerCase().includes(searchLower)
    )
  })

  // Filter out users who already have conversations
  const newUsers = searchUsers.filter(searchUser => 
    !conversations.some(conv => conv.participants.includes(searchUser._id || searchUser.id))
  )

  // INSTANT LOADING: Show skeleton immediately, no spinner
  const showSkeleton = isLoading && conversations.length === 0

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
        {/* INSTANT LOADING: Show skeleton conversations */}
        {showSkeleton && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 animate-pulse">
                <div className="w-14 h-14 bg-muted rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </div>
                <div className="h-3 bg-muted rounded w-12"></div>
              </div>
            ))}
          </>
        )}
        
        {/* Loading skeleton for user search */}
        {searchingUsers && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-14 h-14 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* New Users from Search */}
        {!showSkeleton && searchQuery && newUsers.length > 0 && (
          <div className="border-b border-border">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">New Conversation</p>
            {newUsers.map(searchUser => (
              <div
                key={searchUser._id || searchUser.id}
                onClick={async () => {
                  try {
                    const conversationId = await getOrCreateConversation(user!.id, searchUser._id || searchUser.id)
                    onSelectConversation(conversationId, {
                      id: searchUser._id || searchUser.id,
                      username: searchUser.username,
                      full_name: searchUser.full_name,
                      avatar: searchUser.avatar || searchUser.avatar_url || '/default-avatar.png'
                    })
                  } catch (error) {
                    console.error('Error creating conversation:', error)
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
              >
                <img
                  src={searchUser.avatar || searchUser.avatar_url || '/default-avatar.png'}
                  alt=""
                  className="w-14 h-14 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{searchUser.full_name || searchUser.username}</p>
                  <p className="text-sm text-muted-foreground truncate">@{searchUser.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showSkeleton && filteredConversations.length === 0 && newUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No messages yet</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'No users found' : 'Search for someone to start chatting'}
            </p>
          </div>
        ) : !showSkeleton ? (
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
        ) : null}
      </div>
    </div>
  )
}
