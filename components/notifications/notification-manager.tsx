"use client"

import { useState, useEffect } from 'react'
import { NotificationPopup } from './notification-popup'
import { notificationService } from '@/lib/capacitor-notifications'

interface Notification {
  id: string
  title: string
  body: string
  data?: any
}

export function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize()

    // Listen for notifications
    const handleNotification = (event: CustomEvent) => {
      const { title, body, data } = event.detail
      
      const notification: Notification = {
        id: Date.now().toString(),
        title,
        body,
        data
      }

      setNotifications(prev => [...prev, notification])
    }

    window.addEventListener('notification-received' as any, handleNotification)

    return () => {
      window.removeEventListener('notification-received' as any, handleNotification)
    }
  }, [])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ top: `${4 + index * 100}px` }}
          className="fixed right-4 z-[9999]"
        >
          <NotificationPopup
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </>
  )
}
