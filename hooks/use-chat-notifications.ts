// Hook for real-time chat notifications with badge count
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase-config'
import { notificationService } from '@/lib/capacitor-notifications'

export function useChatNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestMessage, setLatestMessage] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return

    // Subscribe to conversations for unread count
    const conversationsRef = collection(db, 'conversations')
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnread = 0
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        const userUnread = data.unreadCount?.[user.id] || 0
        totalUnread += userUnread
      })

      setUnreadCount(totalUnread)
      
      // Update app badge
      notificationService.setBadge(totalUnread)
    })

    return () => unsubscribe()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    // Subscribe to new messages
    const messagesRef = collection(db, 'messages')
    const q = query(
      messagesRef,
      where('senderId', '!=', user.id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const message = change.doc.data()
          
          // Check if message is for current user
          if (message.conversationId) {
            checkIfMessageForUser(message.conversationId, message)
          }
        }
      })
    })

    return () => unsubscribe()
  }, [user?.id])

  const checkIfMessageForUser = async (conversationId: string, message: any) => {
    try {
      const response = await fetch(`/api/users/${message.senderId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const { user: sender } = await response.json()
        
        setLatestMessage({
          ...message,
          sender
        })

        // Show notification popup
        window.dispatchEvent(new CustomEvent('notification-received', {
          detail: {
            title: `${sender.full_name || sender.username}`,
            body: message.content,
            data: {
              type: 'message',
              conversationId: conversationId,
              avatar: sender.avatar,
              username: sender.username
            }
          }
        }))

        // Play notification sound
        playNotificationSound()
      }
    } catch (error) {
      console.error('Error fetching sender details:', error)
    }
  }

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.5
      audio.play().catch(e => console.log('Could not play sound:', e))
    } catch (error) {
      console.log('Notification sound not available')
    }
  }

  const clearUnreadCount = () => {
    setUnreadCount(0)
    notificationService.clearBadge()
  }

  return {
    unreadCount,
    latestMessage,
    clearUnreadCount
  }
}
