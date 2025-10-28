"use client"

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  message: string
  content_id: string | null
  content_type: string | null
  is_read: boolean
  created_at: string
  sender: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    is_verified: boolean
  }
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchNotifications = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      // Add cache-busting parameter to prevent stale data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/notifications?limit=15&_t=${timestamp}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notificationId?: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ notificationId })
      })

      // Update local state
      if (notificationId) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    // Close dropdown
    setIsOpen(false)
    
    // Add small delay before navigation to ensure state updates
    setTimeout(() => {
      // Navigate based on notification type
      if (notification.type === 'follow') {
        router.push(`/profile/${notification.sender.username}`)
      } else if (notification.content_type === 'post' && notification.content_id) {
        router.push(`/feed?post=${notification.content_id}`) // Navigate to specific post
      } else if (notification.content_type === 'reel' && notification.content_id) {
        router.push(`/reels?id=${notification.content_id}`)
      } else if (notification.content_type === 'story' && notification.content_id) {
        router.push(`/stories?id=${notification.content_id}`)
      } else {
        router.push(`/notifications`) // Fallback to notifications page
      }
    }, 100)
  }

  const getNotificationText = (notification: Notification) => {
    const username = notification.sender.username

    switch (notification.type) {
      case 'like':
        return `${username} liked your post`
      case 'comment':
        return `${username} commented: ${notification.message}`
      case 'follow':
        return `${username} started following you`
      case 'mention':
        return `${username} mentioned you`
      case 'reply':
        return `${username} replied to your comment`
      case 'story_like':
        return `${username} liked your story`
      case 'story_reply':
        return `${username} replied to your story: ${notification.message}`
      case 'reel_like':
        return `${username} liked your reel`
      case 'reel_comment':
        return `${username} commented on your reel: ${notification.message}`
      default:
        return `${username} interacted with your content`
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => markAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-4 flex gap-3 hover:bg-accent transition-colors text-left",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={notification.sender.avatar_url || "/placeholder.svg"}
                      alt={notification.sender.username}
                    />
                    <AvatarFallback>
                      {notification.sender.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={(e) => {
                e.preventDefault()
                router.push('/notifications')
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
