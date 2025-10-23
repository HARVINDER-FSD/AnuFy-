import { query, cache, transaction } from "../lib/database"
import type { Post, CreatePostRequest, PaginatedResponse } from "../lib/types"
import { pagination, errors, cacheKeys } from "../lib/utils"
import { config } from "../lib/config"

export class PostService {
  // Create new post
  static async createPost(userId: string, postData: CreatePostRequest): Promise<Post> {
    const { content, media_urls, media_type, location } = postData

    // Validate post data
    if (!content && (!media_urls || media_urls.length === 0)) {
      throw errors.badRequest("Post must have content or media")
    }

    if (content && content.length > 2200) {
      throw errors.badRequest("Post content too long (max 2200 characters)")
    }

    if (media_urls && media_urls.length > 10) {
      throw errors.badRequest("Maximum 10 media files per post")
    }

    const result = await query(
      `INSERT INTO posts (user_id, content, media_urls, media_type, location) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, content, media_urls, media_type, location, is_archived, created_at, updated_at`,
      [userId, content, media_urls ? JSON.stringify(media_urls) : null, media_type, location],
    )

    const post = result.rows[0]

    // Get user data for the post
    const userResult = await query("SELECT id, username, full_name, avatar_url, is_verified FROM users WHERE id = $1", [
      userId,
    ])

    const postWithUser = {
      ...post,
      media_urls: post.media_urls ? JSON.parse(post.media_urls) : null,
      user: userResult.rows[0],
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
    }

    // Cache the post
    await cache.set(cacheKeys.post(post.id), postWithUser, config.redis.ttl.post)

    // Invalidate user's feed cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}feed:*`)

    return postWithUser
  }

  // Get post by ID
  static async getPostById(postId: string, currentUserId?: string): Promise<Post> {
    // Check cache first
    const cachedPost = await cache.get(cacheKeys.post(postId))
    if (cachedPost && !currentUserId) {
      return cachedPost
    }

    const result = await query(
      `SELECT p.id, p.user_id, p.content, p.media_urls, p.media_type, p.location, 
              p.is_archived, p.created_at, p.updated_at,
              u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = false) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.is_archived = false AND u.is_active = true`,
      [postId],
    )

    if (result.rows.length === 0) {
      throw errors.notFound("Post not found")
    }

    const row = result.rows[0]
    const post: Post = {
      id: row.id,
      user_id: row.user_id,
      content: row.content,
      media_urls: row.media_urls ? JSON.parse(row.media_urls) : null,
      media_type: row.media_type,
      location: row.location,
      is_archived: row.is_archived,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        username: row.username,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
        is_verified: row.is_verified,
      },
      likes_count: Number.parseInt(row.likes_count),
      comments_count: Number.parseInt(row.comments_count),
    }

    // Check if current user liked the post
    if (currentUserId) {
      const likeResult = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [
        currentUserId,
        postId,
      ])
      post.is_liked = likeResult.rows.length > 0
    }

    // Cache the post (without user-specific data)
    if (!currentUserId) {
      await cache.set(cacheKeys.post(postId), post, config.redis.ttl.post)
    }

    return post
  }

  // Get user's posts
  static async getUserPosts(
    userId: string,
    currentUserId?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Post>> {
    const { page: validPage, limit: validLimit } = pagination.validateParams(page.toString(), limit.toString())
    const offset = pagination.getOffset(validPage, validLimit)

    const result = await query(
      `SELECT p.id, p.user_id, p.content, p.media_urls, p.media_type, p.location, 
              p.is_archived, p.created_at, p.updated_at,
              u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = false) as comments_count,
              COUNT(*) OVER() as total_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1 AND p.is_archived = false AND u.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, validLimit, offset],
    )

    const posts = await Promise.all(
      result.rows.map(async (row) => {
        const post: Post = {
          id: row.id,
          user_id: row.user_id,
          content: row.content,
          media_urls: row.media_urls ? JSON.parse(row.media_urls) : null,
          media_type: row.media_type,
          location: row.location,
          is_archived: row.is_archived,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user: {
            id: row.user_id,
            username: row.username,
            full_name: row.full_name,
            avatar_url: row.avatar_url,
            is_verified: row.is_verified,
          },
          likes_count: Number.parseInt(row.likes_count),
          comments_count: Number.parseInt(row.comments_count),
        }

        // Check if current user liked the post
        if (currentUserId) {
          const likeResult = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [
            currentUserId,
            row.id,
          ])
          post.is_liked = likeResult.rows.length > 0
        }

        return post
      }),
    )

    const total = result.rows.length > 0 ? Number.parseInt(result.rows[0].total_count) : 0
    const paginationMeta = pagination.getMetadata(validPage, validLimit, total)

    return {
      success: true,
      data: posts,
      pagination: paginationMeta,
    }
  }

  // Get feed posts
  static async getFeedPosts(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const { page: validPage, limit: validLimit } = pagination.validateParams(page.toString(), limit.toString())
    const offset = pagination.getOffset(validPage, validLimit)

    // Check cache first
    const cacheKey = `${cacheKeys.userFeed(userId)}:${validPage}:${validLimit}`
    const cachedFeed = await cache.get(cacheKey)
    if (cachedFeed) {
      return cachedFeed
    }

    const result = await query(
      `SELECT p.id, p.user_id, p.content, p.media_urls, p.media_type, p.location, 
              p.is_archived, p.created_at, p.updated_at,
              u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = false) as comments_count,
              COUNT(*) OVER() as total_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE (p.user_id = $1 OR p.user_id IN (
         SELECT following_id FROM follows 
         WHERE follower_id = $1 AND status = 'active'
       ))
       AND p.is_archived = false AND u.is_active = true
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, validLimit, offset],
    )

    const posts = await Promise.all(
      result.rows.map(async (row) => {
        const post: Post = {
          id: row.id,
          user_id: row.user_id,
          content: row.content,
          media_urls: row.media_urls ? JSON.parse(row.media_urls) : null,
          media_type: row.media_type,
          location: row.location,
          is_archived: row.is_archived,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user: {
            id: row.user_id,
            username: row.username,
            full_name: row.full_name,
            avatar_url: row.avatar_url,
            is_verified: row.is_verified,
          },
          likes_count: Number.parseInt(row.likes_count),
          comments_count: Number.parseInt(row.comments_count),
        }

        // Check if current user liked the post
        const likeResult = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [userId, row.id])
        post.is_liked = likeResult.rows.length > 0

        return post
      }),
    )

    const total = result.rows.length > 0 ? Number.parseInt(result.rows[0].total_count) : 0
    const paginationMeta = pagination.getMetadata(validPage, validLimit, total)

    const feedResponse = {
      success: true,
      data: posts,
      pagination: paginationMeta,
    }

    // Cache the feed
    await cache.set(cacheKey, feedResponse, config.redis.ttl.feed)

    return feedResponse
  }

  // Update post
  static async updatePost(postId: string, userId: string, updates: Partial<CreatePostRequest>): Promise<Post> {
    const allowedFields = ["content", "location"]
    const updateFields = Object.keys(updates).filter((key) => allowedFields.includes(key))

    if (updateFields.length === 0) {
      throw errors.badRequest("No valid fields to update")
    }

    if (updates.content && updates.content.length > 2200) {
      throw errors.badRequest("Post content too long (max 2200 characters)")
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(", ")
    const values = [postId, userId, ...updateFields.map((field) => updates[field as keyof CreatePostRequest])]

    const result = await query(
      `UPDATE posts SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND is_archived = false
       RETURNING id, user_id, content, media_urls, media_type, location, is_archived, created_at, updated_at`,
      values,
    )

    if (result.rows.length === 0) {
      throw errors.notFound("Post not found or you don't have permission to update it")
    }

    const post = result.rows[0]

    // Get user data
    const userResult = await query("SELECT id, username, full_name, avatar_url, is_verified FROM users WHERE id = $1", [
      userId,
    ])

    const updatedPost = {
      ...post,
      media_urls: post.media_urls ? JSON.parse(post.media_urls) : null,
      user: userResult.rows[0],
    }

    // Update cache
    await cache.set(cacheKeys.post(postId), updatedPost, config.redis.ttl.post)
    await cache.invalidatePattern(`${config.redis.keyPrefix}feed:*`)

    return updatedPost
  }

  // Delete post
  static async deletePost(postId: string, userId: string): Promise<void> {
    // First, verify the post exists and check ownership
    const postCheck = await query("SELECT id, user_id FROM posts WHERE id = $1 AND is_archived = false", [postId])

    if (postCheck.rows.length === 0) {
      throw errors.notFound("Post not found")
    }

    // Verify ownership - only the post owner can delete it
    if (postCheck.rows[0].user_id !== userId) {
      throw errors.forbidden("You don't have permission to delete this post. Only the post owner can delete it.")
    }

    // Perform soft delete
    const result = await query("UPDATE posts SET is_archived = true WHERE id = $1 AND user_id = $2", [postId, userId])

    if (result.rowCount === 0) {
      throw errors.notFound("Failed to delete post")
    }

    // Clear cache
    await cache.del(cacheKeys.post(postId))
    await cache.invalidatePattern(`${config.redis.keyPrefix}feed:*`)
  }

  // Like post
  static async likePost(userId: string, postId: string): Promise<void> {
    // Check if post exists
    const postExists = await query("SELECT id FROM posts WHERE id = $1 AND is_archived = false", [postId])
    if (postExists.rows.length === 0) {
      throw errors.notFound("Post not found")
    }

    // Check if already liked
    const existingLike = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [userId, postId])
    if (existingLike.rows.length > 0) {
      throw errors.conflict("Post already liked")
    }

    await transaction(async (client) => {
      // Insert like
      await client.query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [userId, postId])

      // Update cached like count
      const cachedPost = await cache.get(cacheKeys.post(postId))
      if (cachedPost) {
        cachedPost.likes_count = (cachedPost.likes_count || 0) + 1
        await cache.set(cacheKeys.post(postId), cachedPost, config.redis.ttl.post)
      }
    })

    // Clear feed cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}feed:*`)

    // TODO: Send notification to post owner
  }

  // Unlike post
  static async unlikePost(userId: string, postId: string): Promise<void> {
    const result = await query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [userId, postId])

    if (result.rowCount === 0) {
      throw errors.notFound("Like not found")
    }

    // Update cached like count
    const cachedPost = await cache.get(cacheKeys.post(postId))
    if (cachedPost) {
      cachedPost.likes_count = Math.max(0, (cachedPost.likes_count || 0) - 1)
      await cache.set(cacheKeys.post(postId), cachedPost, config.redis.ttl.post)
    }

    // Clear feed cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}feed:*`)
  }

  // Get post likes
  static async getPostLikes(postId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const { page: validPage, limit: validLimit } = pagination.validateParams(page.toString(), limit.toString())
    const offset = pagination.getOffset(validPage, validLimit)

    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.is_verified,
              l.created_at as liked_at,
              COUNT(*) OVER() as total_count
       FROM likes l
       JOIN users u ON l.user_id = u.id
       WHERE l.post_id = $1 AND u.is_active = true
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, validLimit, offset],
    )

    const likes = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      is_verified: row.is_verified,
      liked_at: row.liked_at,
    }))

    const total = result.rows.length > 0 ? Number.parseInt(result.rows[0].total_count) : 0
    const paginationMeta = pagination.getMetadata(validPage, validLimit, total)

    return {
      success: true,
      data: likes,
      pagination: paginationMeta,
    }
  }
}
