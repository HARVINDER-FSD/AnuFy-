/**
 * Cache Service
 * Advanced caching with TTL, patterns, and prefetching
 */

import type { CacheEntry } from '@/core/types'
import { logger } from '@/core/utils/logger'

export class CacheService {
  private store = new Map<string, CacheEntry>()
  private prefetchQueue = new Set<string>()

  get<T = any>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      logger.debug(`Cache expired: ${key}`)
      return null
    }

    logger.debug(`Cache hit: ${key}`)
    return entry.data as T
  }

  set<T = any>(key: string, data: T, ttl = 60000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
    logger.debug(`Cache set: ${key} (TTL: ${ttl}ms)`)
  }

  async getOrFetch<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 60000
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    logger.debug(`Cache miss, fetching: ${key}`)
    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  delete(key: string): void {
    this.store.delete(key)
    logger.debug(`Cache deleted: ${key}`)
  }

  clear(): void {
    this.store.clear()
    logger.info('Cache cleared')
  }

  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    let count = 0

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
        count++
      }
    }

    logger.info(`Cache pattern cleared: ${pattern} (${count} entries)`)
  }

  async prefetch<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 60000
  ): Promise<void> {
    if (this.prefetchQueue.has(key)) return

    this.prefetchQueue.add(key)
    try {
      const data = await fetcher()
      this.set(key, data, ttl)
      logger.debug(`Prefetched: ${key}`)
    } catch (error) {
      logger.error(`Prefetch failed: ${key}`, error)
    } finally {
      this.prefetchQueue.delete(key)
    }
  }

  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
      prefetching: Array.from(this.prefetchQueue),
    }
  }
}

export const cacheService = new CacheService()
