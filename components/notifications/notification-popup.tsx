"use client"

import { useState, useEffect } from 'react'
import { X, MessageCircle, Heart, MessageSquare, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationPopupProps {
  notification: {
    title: string
    body: string
    data?: {
      type: 'message' | 'like' | 'comment' | 'follow'
      conversationId?: string
      postId?: string
      userId?: string
      avatar?: string
      username?: string
    }
  }
  onClose: () => void
  onClick?: () => void
}

export function NotificationPopup({ notification, onClose, onClick }: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Default navigation
      const { data } = notification
      if (data?.type === 'message' && data?.conversationId) {
        window.location.href = `/messages?conversation=${data.conversationId}`
      } else if (data?.type === 'like' && data?.postId) {
        window.location.href = `/posts/${data.postId}`
      } else if (data?.type === 'comment' && data?.postId) {
        window.location.href = `/posts/${data.postId}`
      } else if (data?.type === 'follow' && data?.userId) {
        window.location.href = `/profile/${data.userId}`
      }
    }
    handleClose()
  }

  const getIcon = () => {
    switch (notification.data?.type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-primary" />
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />
      default:
        return <MessageCircle className="w-5 h-5 text-primary" />
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 right-4 z-[9999] max-w-sm w-full"
        >
          <div
            onClick={handleClick}
            className="bg-background border border-border rounded-lg shadow-2xl p-4 cursor-pointer hover:shadow-3xl transition-shadow"
          >
            <div className="flex items-start gap-3">
              {/* Avatar or Icon */}
              <div className="flex-shrink-0">
                {notification.data?.avatar ? (
                  <img
                    src={notification.data.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getIcon()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {notification.body}
                </p>
                {notification.data?.username && (
                  <p className="text-xs text-muted-foreground mt-1">
                    @{notification.data.username}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-1 bg-primary rounded-full mt-3"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
