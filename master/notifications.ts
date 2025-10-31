/**
 * MASTER NOTIFICATIONS - Ultra-Fast Notification System
 * Real-time notifications with caching
 */

class NotificationManager {
  private cache: any[] = []
  private unreadCount = 0
  private listeners = new Set<Function>()
  
  // Get all notifications
  async getAll() {
    if (this.cache.length > 0) return this.cache
    
    const response = await fetch('/api/notifications')
    if (!response.ok) throw new Error('Failed to fetch notifications')
    
    const data = await response.json()
    this.cache = data.notifications || []
    this.unreadCount = data.unreadCount || 0
    this.notifyListeners()
    return this.cache
  }
  
  // Get unread count
  getUnreadCount(): number {
    return this.unreadCount
  }
  
  // Mark as read
  async markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    
    const notification = this.cache.find(n => n.id === id)
    if (notification && !notification.is_read) {
      notification.is_read = true
      this.unreadCount = Math.max(0, this.unreadCount - 1)
      this.notifyListeners()
    }
  }
  
  // Mark all as read
  async markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    
    this.cache.forEach(n => n.is_read = true)
    this.unreadCount = 0
    this.notifyListeners()
  }
  
  // Clear all
  async clearAll() {
    await fetch('/api/notifications/clear', { method: 'POST' })
    
    this.cache = []
    this.unreadCount = 0
    this.notifyListeners()
  }
  
  // Add notification (from socket)
  add(notification: any) {
    this.cache.unshift(notification)
    if (!notification.is_read) {
      this.unreadCount++
    }
    this.notifyListeners()
  }
  
  // Subscribe to changes
  subscribe(callback: Function) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
  
  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(callback => {
      callback({
        notifications: this.cache,
        unreadCount: this.unreadCount,
      })
    })
  }
  
  // Refresh
  async refresh() {
    this.cache = []
    return this.getAll()
  }
}

export const MasterNotifications = new NotificationManager()
