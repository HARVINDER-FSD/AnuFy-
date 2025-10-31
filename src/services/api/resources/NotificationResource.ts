/**
 * Notification Resource
 * API methods for notifications
 */

import type { Notification } from '@/core/types'
import { apiClient } from '../ApiClient'

export class NotificationResource {
  async getAll(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return apiClient.get('/api/notifications', {
      useCache: true,
      revalidate: 10,
    })
  }

  async markRead(id: string): Promise<void> {
    return apiClient.post(`/api/notifications/${id}/read`)
  }

  async markAllRead(): Promise<void> {
    return apiClient.post('/api/notifications/read-all')
  }

  async clearAll(): Promise<void> {
    return apiClient.post('/api/notifications/clear')
  }
}

export const notificationResource = new NotificationResource()
