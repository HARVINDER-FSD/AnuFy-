// Capacitor Push Notifications & Local Notifications
import { Capacitor } from '@capacitor/core'

// Simple notification service for web and mobile
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

class NotificationService {
  private badgeCount = 0
  
  // Initialize notification service
  initialize() {
    // Request permission for web notifications
    if (typeof window !== 'undefined' && !this.isNative()) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }
  }
  
  // Check if running on native device
  isNative() {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform()
  }
  
  // Show notification
  async showNotification(payload: NotificationPayload) {
    try {
      if (this.isNative()) {
        // For native platforms, we would use Capacitor plugins
        console.log('Native notification:', payload)
      } else {
        // Web notification
        if (Notification.permission === 'granted') {
          new Notification(payload.title, {
            body: payload.body,
            icon: '/anufy-icon.svg',
            badge: '/anufy-icon.svg',
            data: payload.data
          })
        }
      }
      
      // Trigger custom event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-received', {
          detail: payload
        }))
      }
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }
  
  // Get badge count
  getBadgeCount() {
    return this.badgeCount
  }
  
  // Set badge count
  setBadgeCount(count: number) {
    this.badgeCount = count
    
    // Update UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('badge-count-changed', {
        detail: { count }
      }))
    }
  }
  
  // Increment badge count
  incrementBadge() {
    this.setBadgeCount(this.badgeCount + 1)
  }
  
  // Clear badge count
  clearBadge() {
    this.setBadgeCount(0)
  }
}

// Export singleton instance
export const notificationService = new NotificationService()