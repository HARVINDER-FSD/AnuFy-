"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Edit, ArrowLeft, Camera, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ChatUser {
  id: string
  username: string
  avatar?: string
  isOnline: boolean
  isVerified?: boolean
  hasStory?: boolean
}

interface ChatListItem {
  id: string
  user: ChatUser
  lastMessage: {
    text: string
    timestamp: string
    isRead: boolean
  }
  unreadCount: number
  activityStatus: "active_now" | "active_today" | "active_hours" | "seen" | "sent"
  activityTime?: string
}

interface ChatListProps {
  conversations: ChatListItem[]
  requests?: ChatListItem[]
  currentUsername?: string
  loading?: boolean
  onNewChat?: () => void
}

export function ChatList({ 
  conversations = [], 
  requests = [], 
  currentUsername = "username",
  loading = false,
  onNewChat 
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"messages" | "requests">("messages")

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRequests = requests.filter((req) =>
    req.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const displayList = activeTab === "messages" ? filteredConversations : filteredRequests

  const getActivityText = (item: ChatListItem) => {
    switch (item.activityStatus) {
      case "active_now":
        return "Active now"
      case "active_today":
        return "Active today"
      case "active_hours":
        return `Active ${item.activityTime || "1h ago"}`
      case "seen":
        return item.activityTime ? `Seen ${item.activityTime}` : "Seen"
      case "sent":
        return "Sent"
      default:
        return ""
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (hours < 1) return "now"
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/feed">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{currentUsername}</h1>
              <svg 
                className="h-3 w-3" 
                viewBox="0 0 12 12" 
                fill="none"
              >
                <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={onNewChat}
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "messages" | "requests")} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-12 bg-transparent p-0 border-b-0">
              <TabsTrigger 
                value="messages" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none bg-transparent font-semibold"
              >
                Messages
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent font-semibold text-primary"
              >
                Requests
                {requests.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0 rounded-lg"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Loading skeleton
          <div className="space-y-1">
            {Array(8).fill(0).map((_, index) => (
              <div key={index} className="px-4 py-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-muted"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded mb-2"></div>
                    <div className="h-3 w-24 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayList.length > 0 ? (
          <div className="space-y-0">
            {displayList.map((item) => (
              <Link key={item.id} href={`/messages/${item.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Story Ring */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          "rounded-full p-[2px]",
                          item.user.hasStory
                            ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                            : ""
                        )}
                      >
                        <Avatar className="h-14 w-14 border-2 border-background">
                          <AvatarImage 
                            src={item.user.avatar || "/placeholder-user.jpg"} 
                            alt={item.user.username} 
                          />
                          <AvatarFallback>
                            {item.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {item.user.isOnline && (
                        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>

                    {/* Message Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className={cn(
                          "font-normal text-sm truncate",
                          !item.lastMessage.isRead && "font-semibold"
                        )}>
                          {item.user.username}
                        </p>
                        {item.user.isVerified && (
                          <CheckCircle className="h-3.5 w-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !item.lastMessage.isRead 
                            ? "text-foreground font-medium" 
                            : "text-muted-foreground"
                        )}>
                          {item.lastMessage.text}
                        </p>
                        <span className="text-muted-foreground">·</span>
                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                          {getActivityText(item)}
                        </p>
                      </div>
                    </div>

                    {/* Camera Icon */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault()
                        // Handle camera action
                      }}
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No conversations found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery 
                ? "Try searching for a different username" 
                : activeTab === "messages"
                  ? "Start a new conversation to get started"
                  : "You don't have any message requests"
              }
            </p>
            {activeTab === "messages" && (
              <Button onClick={onNewChat} className="gap-2">
                <Edit className="h-4 w-4" />
                New Message
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
