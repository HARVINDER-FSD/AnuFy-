/**
 * Post Resource
 * API methods for posts
 */

import type { Post, PaginatedResponse } from '@/core/types'
import { apiClient } from '../ApiClient'

export class PostResource {
  async getFeed(page = 1): Promise<PaginatedResponse<Post>> {
    return apiClient.get(`/api/posts?page=${page}`, {
      useCache: true,
      revalidate: 30,
    })
  }

  async getPost(id: string): Promise<Post> {
    return apiClient.get(`/api/posts/${id}`, {
      useCache: true,
      revalidate: 60,
    })
  }

  async create(data: Partial<Post>): Promise<Post> {
    return apiClient.post('/api/posts', data)
  }

  async update(id: string, data: Partial<Post>): Promise<Post> {
    return apiClient.put(`/api/posts/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/posts/${id}`)
  }

  async like(id: string): Promise<void> {
    return apiClient.post(`/api/posts/${id}/like`)
  }

  async unlike(id: string): Promise<void> {
    return apiClient.post(`/api/posts/${id}/unlike`)
  }

  async save(id: string): Promise<void> {
    return apiClient.post(`/api/posts/${id}/save`)
  }

  async unsave(id: string): Promise<void> {
    return apiClient.post(`/api/posts/${id}/unsave`)
  }
}

export const postResource = new PostResource()
