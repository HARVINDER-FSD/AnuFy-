"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, UserPlus, Share, Settings, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  type: "like" | "comment" | "follow" | "follow_request" | "follow_accept" | "mention" | "share"
  user: {
    id: string
    username: string
    avatar?: string
    verified: boolean
  }
  content?: string
  post?: {
    id: string
    image?: string
  }
  timestamp: string
  isRead: boolean
}

// Function to fetch notifications
const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    // Get token from cookies
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token=') || row.startsWith('client-token='))
      ?.split('=')[1];
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch('/api/notifications', { headers });
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Please log in to view notifications');
      }
      throw new Error('Failed to fetch notifications');
    }
    
    const data = await response.json();
    return data.notifications.map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      user: {
        id: notification.user.id,
        username: notification.user.username,
        avatar: notification.user.avatar_url || "/placeholder-user.jpg",
        verified: notification.user.is_verified || false,
      },
      content: notification.content,
      post: notification.post_id ? {
        id: notification.post_id,
        image: notification.post_image || "/placeholder.jpg",
      } : undefined,
      timestamp: notification.created_at,
      isRead: notification.is_read,
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="h-4 w-4 text-red-500" />
    case "comment":
      return <MessageCircle className="h-4 w-4 text-blue-500" />
    case "follow":
    case "follow_request":
    case "follow_accept":
      return <UserPlus className="h-4 w-4 text-green-500" />
    case "share":
      return <Share className="h-4 w-4 text-purple-500" />
    default:
      return <Heart className="h-4 w-4 text-muted-foreground" />
  }
}

const getNotificationText = (notification: Notification) => {
  switch (notification.type) {
    case "like":
      return "liked your post"
    case "comment":
      return "commented on your post"
    case "follow":
      return "started following you"
    case "follow_request":
      return "requested to follow you"
    case "follow_accept":
      return "accepted your follow request"
    case "mention":
      return "mentioned you"
    case "share":
      return "shared your post"
    default:
      return "interacted with your content"
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true)
      const data = await fetchNotifications()
      setNotifications(data)
      setLoading(false)
    }
    
    loadNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id)
    
    // Navigate based on notification type
    if (notification.type === 'follow' || notification.type === 'follow_request' || notification.type === 'follow_accept') {
      // Go to the user's profile
      router.push(`/profile/${notification.user.username}`)
    } else if (notification.post?.id) {
      // Go to the post (for likes, comments)
      router.push(`/post/${notification.post.id}`)
    } else {
      // Default: go to user's profile
      router.push(`/profile/${notification.user.username}`)
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread") return !notification.isRead
    if (activeTab === "mentions") return notification.type === "mention"
    return true
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-6 px-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
          <Link href="/settings/notifications">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-2">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5 border-primary/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.user.avatar || "/placeholder.svg"}
                            alt={notification.user.username}
                          />
                          <AvatarFallback>{notification.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-semibold">{notification.user.username}</span>
                              {notification.user.verified && (
                                <span className="inline-block w-4 h-4 bg-primary rounded-full text-primary-foreground text-xs ml-1 text-center leading-4">
                                  ✓
                                </span>
                              )}
                              <span className="text-muted-foreground ml-1">{getNotificationText(notification)}</span>
                            </p>
                            {notification.content && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.content}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                          </div>

                          {notification.post?.image && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                              <img
                                src={notification.post.image || "/placeholder.svg"}
                                alt="Post"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {activeTab === "unread"
                  ? "You're all caught up!"
                  : activeTab === "mentions"
                    ? "No mentions yet"
                    : "When people interact with your content, you'll see it here"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
