"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, MessageSquarePlus, Trash2, Check, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken } from "@/lib/auth-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar: string;
    verified: boolean;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

interface SearchUser {
  id: string;
  username: string;
  full_name: string;
  avatar: string;
  is_verified: boolean;
}

export default function MessagesPageEnhanced() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [longPressedConv, setLongPressedConv] = useState<string | null>(null)
  const [deleteConfirmConv, setDeleteConfirmConv] = useState<string | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  // Search users when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadConversations = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    setIsSearching(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const startConversation = async (username: string) => {
    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      console.log('Starting conversation with:', username)

      const response = await fetch('/api/messages/conversations/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Conversation created:', data.conversationId)
        
        // Clear search and navigate
        setSearchQuery('')
        setSearchResults([])
        
        // Navigate to conversation
        router.push(`/messages/${data.conversationId}`)
      } else {
        const error = await response.json()
        console.error('Failed to create conversation:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to start conversation",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      })
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`/api/messages/conversations/${conversationId}/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        toast({
          title: "Success",
          description: "Conversation deleted successfully"
        })
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      })
    } finally {
      setDeleteConfirmConv(null)
      setLongPressedConv(null)
    }
  }

  // Long press handlers for mobile
  const handleTouchStart = (convId: string) => {
    const timer = setTimeout(() => {
      setLongPressedConv(convId)
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms long press
    setLongPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return "now"
    if (hours < 24) return `${hours}h`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/feed')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Messages</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery(searchQuery ? "" : " ")}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users to chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Results */}
        {searchQuery.trim().length >= 2 && (
          <div className="border-b">
            <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
              Search Results
            </div>
            {isSearching ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => startConversation(user.username)}
                    className="flex items-center gap-3 p-4 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold truncate">{user.username}</p>
                        {user.is_verified && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.full_name}</p>
                    </div>
                    <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        <div>
          {conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Search for users above to start a conversation
              </p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className="relative group"
                onTouchStart={() => handleTouchStart(conv.id)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                <div
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className={`flex items-center gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
                    longPressedConv === conv.id ? 'bg-accent' : ''
                  }`}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={conv.user.avatar} alt={conv.user.username} />
                    <AvatarFallback>{conv.user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold truncate">{conv.user.username}</p>
                        {conv.user.verified && (
                          <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        conv.lastMessage && !conv.lastMessage.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}>
                        {conv.lastMessage ? conv.lastMessage.text : 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button (desktop: hover, mobile: long press) */}
                {(longPressedConv === conv.id || window.innerWidth > 768) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-destructive hover:text-destructive hover:bg-destructive/10 ${
                      longPressedConv === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmConv(conv.id)
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmConv} onOpenChange={(open) => !open && setDeleteConfirmConv(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmConv && deleteConversation(deleteConfirmConv)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
