/**
 * Reel Resource
 * API methods for reels
 */

import type { Reel, PaginatedResponse } from '@/core/types'
import { apiClient } from '../ApiClient'

export class ReelResource {
  async getFeed(page = 1): Promise<PaginatedResponse<Reel>> {
    return apiClient.get(`/api/reels?page=${page}`, {
      useCache: true,
      revalidate: 30,
    })
  }

  async getReel(id: string): Promise<Reel> {
    return apiClient.get(`/api/reels/${id}`, {
      useCache: true,
      revalidate: 60,
    })
  }

  async create(data: Partial<Reel>): Promise<Reel> {
    return apiClient.post('/api/reels', data)
  }

  async like(id: string): Promise<void> {
    return apiClient.post(`/api/reels/${id}/like`)
  }

  async unlike(id: string): Promise<void> {
    return apiClient.post(`/api/reels/${id}/unlike`)
  }

  async view(id: string): Promise<void> {
    return apiClient.post(`/api/reels/${id}/view`)
  }
}

export const reelResource = new ReelResource()
