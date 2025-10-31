/**
 * Notification Service
 * Manages notifications with real-time updates
 */

import type { Notification } from '@/core/types'
import { logger } from '@/core/utils/logger'
import { notificationResource } from '../api'
import { socketService } from '../socket/SocketService'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
}

export class NotificationService {
  private state: NotificationState = {
    notifications: [],
    unreadCount: 0,
  }
  private listeners = new Set<(state: NotificationState) => void>()
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    // Fetch initial notifications
    await this.refresh()

    // Listen for real-time updates
    socketService.on('notification', (notification: Notification) => {
      this.add(notification)
    })

    this.initialized = true
    logger.info('Notification service initialized')
  }

  async getAll(): Promise<Notification[]> {
    if (this.state.notifications.length > 0) {
      return this.state.notifications
    }

    await this.refresh()
    return this.state.notifications
  }

  getUnreadCount(): number {
    return this.state.unreadCount
  }

  async markRead(id: string): Promise<void> {
    await notificationResource.markRead(id)

    const notification = this.state.notifications.find(n => n.id === id)
    if (notification && !notification.is_read) {
      notification.is_read = true
      this.state.unreadCount = Math.max(0, this.state.unreadCount - 1)
      this.notifyListeners()
    }
  }

  async markAllRead(): Promise<void> {
    await notificationResource.markAllRead()

    this.state.notifications.forEach(n => (n.is_read = true))
    this.state.unreadCount = 0
    this.notifyListeners()
  }

  async clearAll(): Promise<void> {
    await notificationResource.clearAll()

    this.state.notifications = []
    this.state.unreadCount = 0
    this.notifyListeners()
  }

  add(notification: Notification): void {
    this.state.notifications.unshift(notification)
    if (!notification.is_read) {
      this.state.unreadCount++
    }
    this.notifyListeners()
    logger.debug('Notification added', { id: notification.id })
  }

  async refresh(): Promise<void> {
    const data = await notificationResource.getAll()
    this.state.notifications = data.notifications
    this.state.unreadCount = data.unreadCount
    this.notifyListeners()
    logger.debug('Notifications refreshed')
  }

  subscribe(callback: (state: NotificationState) => void): () => void {
    this.listeners.add(callback)
    callback(this.state) // Immediate callback with current state
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.state))
  }
}

export const notificationService = new NotificationService()
