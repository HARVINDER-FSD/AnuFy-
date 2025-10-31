/**
 * User Resource
 * API methods for users
 */

import type { User, PaginatedResponse } from '@/core/types'
import { apiClient } from '../ApiClient'

export class UserResource {
  async getProfile(username: string): Promise<User> {
    return apiClient.get(`/api/users/${username}`, {
      useCache: true,
      revalidate: 60,
    })
  }

  async getMe(): Promise<User> {
    return apiClient.get('/api/users/me', {
      useCache: true,
      revalidate: 300,
    })
  }

  async update(data: Partial<User>): Promise<User> {
    return apiClient.put('/api/users/profile', data)
  }

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData()
    formData.append('avatar', file)

    return fetch('/api/users/profile/avatar', {
      method: 'POST',
      body: formData,
    }).then(res => res.json())
  }

  async follow(userId: string): Promise<void> {
    return apiClient.post(`/api/users/${userId}/follow`)
  }

  async unfollow(userId: string): Promise<void> {
    return apiClient.post(`/api/users/${userId}/unfollow`)
  }

  async getFollowers(userId: string, page = 1): Promise<PaginatedResponse<User>> {
    return apiClient.get(`/api/users/${userId}/followers?page=${page}`)
  }

  async getFollowing(userId: string, page = 1): Promise<PaginatedResponse<User>> {
    return apiClient.get(`/api/users/${userId}/following?page=${page}`)
  }

  async search(query: string): Promise<User[]> {
    return apiClient.get(`/api/search?q=${encodeURIComponent(query)}&type=users`, {
      useCache: true,
      revalidate: 60,
    })
  }
}

export const userResource = new UserResource()
