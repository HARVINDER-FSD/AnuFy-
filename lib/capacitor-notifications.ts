// Stub for capacitor notifications - used for type compatibility
// The actual implementation is in api-server/src/lib/capacitor-notifications.ts

export interface NotificationPayload {
  title: string
  body: string
  data?: {
    type: 'message' | 'like' | 'comment' | 'follow'
    conversationId?: string
    postId?: string
    userId?: string
    [key: string]: any
  }
}

class CapacitorNotificationService {
  private isInitialized = false

  isNative(): boolean {
    return false
  }

  async initialize() {
    if (this.isInitialized) return
    console.log('Notification service stub initialized')
    this.isInitialized = true
  }

  async showLocalNotification(payload: NotificationPayload) {
    console.log('Show notification:', payload)
  }

  async setBadge(count: number) {
    console.log('Set badge:', count)
  }

  async incrementBadge() {
    console.log('Increment badge')
  }

  async clearBadge() {
    console.log('Clear badge')
  }

  getBadgeCount(): number {
    return 0
  }

  getToken(): string | null {
    return null
  }

  async cleanup() {
    this.isInitialized = false
  }
}

export const notificationService = new CapacitorNotificationService()
