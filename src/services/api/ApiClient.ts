/**
 * API Client
 * HTTP client with retry logic, caching, and error handling
 */

import { config } from '@/core/config'
import { handleError, NetworkError } from '@/core/utils/errors'
import { logger } from '@/core/utils/logger'
import { cacheService } from '../cache/CacheService'

interface RequestOptions {
  method?: string
  headers?: HeadersInit
  body?: BodyInit | null
  useCache?: boolean
  revalidate?: number
  retry?: boolean
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.api.baseUrl
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = config.api.retries
  ): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), config.api.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      return response
    } catch (error) {
      if (retries > 0) {
        logger.warn(`Retrying request: ${url} (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return this.fetchWithRetry(url, options, retries - 1)
      }
      throw new NetworkError(`Request failed: ${url}`)
    }
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { useCache, revalidate = 60, retry = true, ...fetchOptions } = options
    const url = `${this.baseUrl}${endpoint}`
    const cacheKey = `api:${endpoint}:${JSON.stringify(fetchOptions)}`

    // Check cache
    if (useCache) {
      const cached = cacheService.get<T>(cacheKey)
      if (cached !== null) return cached
    }

    try {
      // Make request
      const response = await this.fetchWithRetry(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      } as RequestInit)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Cache response
      if (useCache) {
        cacheService.set(cacheKey, data, revalidate * 1000)
      }

      return data
    } catch (error) {
      logger.error(`API request failed: ${endpoint}`, error)
      throw handleError(error)
    }
  }

  get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
