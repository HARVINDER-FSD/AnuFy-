/**
 * MASTER SOCKET - Ultra-Fast WebSocket Manager
 * Real-time updates for messages, notifications, etc.
 */

import { io, Socket } from 'socket.io-client'

class SocketManager {
  private socket: Socket | null = null
  private listeners = new Map<string, Set<Function>>()
  
  // Connect to socket
  connect(userId?: string) {
    if (this.socket?.connected) return this.socket
    
    this.socket = io('http://localhost:3001', {
      auth: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })
    
    this.socket.on('connect', () => {
      console.log('Socket connected')
    })
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })
    
    // Re-attach listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback as any)
      })
    })
    
    return this.socket
  }
  
  // Disconnect
  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }
  
  // Listen to event
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    this.socket?.on(event, callback as any)
  }
  
  // Remove listener
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
    this.socket?.off(event, callback as any)
  }
  
  // Emit event
  emit(event: string, data: any) {
    this.socket?.emit(event, data)
  }
  
  // Join room
  joinRoom(room: string) {
    this.socket?.emit('join_room', room)
  }
  
  // Leave room
  leaveRoom(room: string) {
    this.socket?.emit('leave_room', room)
  }
  
  // Check connection
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const MasterSocket = new SocketManager()
