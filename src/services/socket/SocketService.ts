/**
 * Socket Service
 * WebSocket connection management
 */

import { io, Socket } from 'socket.io-client'
import { env } from '@/core/config'
import { logger } from '@/core/utils/logger'

export class SocketService {
  private socket: Socket | null = null
  private listeners = new Map<string, Set<Function>>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(userId?: string): Socket {
    if (this.socket?.connected) return this.socket

    this.socket = io(env.socketUrl, {
      auth: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.socket.on('connect', () => {
      logger.info('Socket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', () => {
      logger.warn('Socket disconnected')
    })

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++
      logger.info(`Socket reconnect attempt ${this.reconnectAttempts}`)
    })

    this.socket.on('reconnect_failed', () => {
      logger.error('Socket reconnection failed')
    })

    // Re-attach listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback as any)
      })
    })

    return this.socket
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
    logger.info('Socket disconnected manually')
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    this.socket?.on(event, callback as any)
    logger.debug(`Socket listener added: ${event}`)
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
    this.socket?.off(event, callback as any)
    logger.debug(`Socket listener removed: ${event}`)
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data)
    logger.debug(`Socket event emitted: ${event}`)
  }

  joinRoom(room: string): void {
    this.socket?.emit('join_room', room)
    logger.debug(`Joined room: ${room}`)
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave_room', room)
    logger.debug(`Left room: ${room}`)
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()
