/**
 * useNotifications Hook
 * React hook for notifications
 */

import { useState, useEffect } from 'react'
import { notificationService } from '@/services'
import type { Notification } from '@/core/types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(state => {
      setNotifications(state.notifications)
      setUnreadCount(state.unreadCount)
    })

    notificationService.getAll()

    return unsubscribe
  }, [])

  return {
    notifications,
    unreadCount,
    markRead: notificationService.markRead.bind(notificationService),
    markAllRead: notificationService.markAllRead.bind(notificationService),
    clearAll: notificationService.clearAll.bind(notificationService),
    refresh: notificationService.refresh.bind(notificationService),
  }
}
