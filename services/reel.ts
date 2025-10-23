import { query, cache, transaction } from "../lib/database"
import { StorageService } from "../lib/storage"
import type { Reel, CreateReelRequest, PaginatedResponse } from "../lib/types"
import { pagination, errors } from "../lib/utils"
import { config } from "../lib/config"

export class ReelService {
  // Create reel
  static async createReel(userId: string, reelData: CreateReelRequest): Promise<Reel> {
    const { video_url, thumbnail_url, title, description, duration } = reelData

    if (!video_url) {
      throw errors.badRequest("Video URL is required for reels")
    }

    if (title && title.length > 255) {
      throw errors.badRequest("Title too long (max 255 characters)")
    }

    if (description && description.length > 2200) {
      throw errors.badRequest("Description too long (max 2200 characters)")
    }

    // Generate thumbnail if not provided
    let finalThumbnailUrl = thumbnail_url
    if (!finalThumbnailUrl) {
      try {
        // Extract key from video URL to generate thumbnail
        const urlParts = video_url.split("/")
        const videoKey = urlParts.slice(-3).join("/")
        finalThumbnailUrl = await StorageService.generateVideoThumbnail(videoKey)
      } catch (error) {
        console.error("Failed to generate thumbnail:", error)
      }
    }

    const result = await query(
      `INSERT INTO reels (user_id, video_url, thumbnail_url, title, description, duration) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, user_id, video_url, thumbnail_url, title, description, duration, 
                 view_count, is_public, created_at, updated_at`,
      [userId, video_url, finalThumbnailUrl, title, description, duration],
    )

    const reel = result.rows[0]

    // Get user data
    const userResult = await query("SELECT id, username, full_name, avatar_url, is_verified FROM users WHERE id = $1", [
      userId,
    ])

    const reelWithUser: Reel = {
      ...reel,
      user: userResult.rows[0],
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
    }

    // Clear reels cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}reels:*`)

    return reelWithUser
  }

  // Get reel by ID
  static async getReelById(reelId: string, currentUserId?: string): Promise<Reel> {
    const result = await query(
      `SELECT r.id, r.user_id, r.video_url, r.thumbnail_url, r.title, r.description, 
              r.duration, r.view_count, r.is_public, r.created_at, r.updated_at,
              u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified,
              (SELECT COUNT(*) FROM likes WHERE post_id = r.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = r.id AND is_deleted = false) as comments_count
       FROM reels r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1 AND r.is_public = true AND u.is_active = true`,
      [reelId],
    )

    if (result.rows.length === 0) {
      throw errors.notFound("Reel not found")
    }

    const row = result.rows[0]
    const reel: Reel = {
      id: row.id,
      user_id: row.user_id,
      video_url: row.video_url,
      thumbnail_url: row.thumbnail_url,
      title: row.title,
      description: row.description,
      duration: row.duration,
      view_count: row.view_count,
      is_public: row.is_public,
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

    // Check if current user liked the reel
    if (currentUserId) {
      const likeResult = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [
        currentUserId,
        reelId,
      ])
      reel.is_liked = likeResult.rows.length > 0
    }

    // Increment view count
    await this.incrementViewCount(reelId)

    return reel
  }

  // Get user's reels
  static async getUserReels(
    userId: string,
    currentUserId?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Reel>> {
    const { page: validPage, limit: validLimit } = pagination.validateParams(page.toString(), limit.toString())
    const offset = pagination.getOffset(validPage, validLimit)

    const result = await query(
      `SELECT r.id, r.user_id, r.video_url, r.thumbnail_url, r.title, r.description, 
              r.duration, r.view_count, r.is_public, r.created_at, r.updated_at,
              u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified,
              (SELECT COUNT(*) FROM likes WHERE post_id = r.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = r.id AND is_deleted = false) as comments_count,
              COUNT(*) OVER() as total_count
       FROM reels r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1 AND r.is_public = true AND u.is_active = true
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, validLimit, offset],
    )

    const reels = await Promise.all(
      result.rows.map(async (row) => {
        const reel: Reel = {
          id: row.id,
          user_id: row.user_id,
          video_url: row.video_url,
          thumbnail_url: row.thumbnail_url,
          title: row.title,
          description: row.description,
          duration: row.duration,
          view_count: row.view_count,
          is_public: row.is_public,
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

        // Check if current user liked the reel
        if (currentUserId) {
          const likeResult = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [
            currentUserId,
            row.id,
          ])
          reel.is_liked = likeResult.rows.length > 0
        }

        return reel
      }),
    )

    const total = result.rows.length > 0 ? Number.parseInt(result.rows[0].total_count) : 0
    const paginationMeta = pagination.getMetadata(validPage, validLimit, total)

    return {
      success: true,
      data: reels,
      pagination: paginationMeta,
    }
  }

  // Get reels feed (discover/explore)
  static async getReelsFeed(currentUserId?: string, page = 1, limit = 20): Promise<PaginatedResponse<Reel>> {
    const { page: validPage, limit: validLimit } = pagination.validateParams(page.toString(), limit.toString())
    const offset = pagination.getOffset(validPage, validLimit)

    // Algorithm: Mix of recent, popular, and personalized content
    const result = await query(
      `SELECT r.id, r.user_id, r.video_url, r.thumbnail_url, r.title, r.description, 
              r.duration, r.view_count, r.is_public, r.created_at, r.updated_at,
              u.id as user_id, u.username, u.full_name, u.avatar_url, u.is_verified,
              (SELECT COUNT(*) FROM likes WHERE post_id = r.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = r.id AND is_deleted = false) as comments_count,
              COUNT(*) OVER() as total_count,
              -- Scoring algorithm for feed ranking
              (
                (EXTRACT(EPOCH FROM NOW() - r.created_at) / 3600)::float * -0.1 + -- Recency factor
                (r.view_count::float / 1000) * 0.3 + -- View count factor
                (SELECT COUNT(*) FROM likes WHERE post_id = r.id)::float * 0.5 + -- Likes factor
                (SELECT COUNT(*) FROM comments WHERE post_id = r.id)::float * 0.3 -- Comments factor
              ) as score
       FROM reels r
       JOIN users u ON r.user_id = u.id
       WHERE r.is_public = true AND u.is_active = true
         AND ($1::uuid IS NULL OR r.user_id != $1) -- Exclude own reels
       ORDER BY score DESC, r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [currentUserId, validLimit, offset],
    )

    const reels = await Promise.all(
      result.rows.map(async (row) => {
        const reel: Reel = {
          id: row.id,
          user_id: row.user_id,
          video_url: row.video_url,
          thumbnail_url: row.thumbnail_url,
          title: row.title,
          description: row.description,
          duration: row.duration,
          view_count: row.view_count,
          is_public: row.is_public,
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

        // Check if current user liked the reel
        if (currentUserId) {
          const likeResult = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [
            currentUserId,
            row.id,
          ])
          reel.is_liked = likeResult.rows.length > 0
        }

        return reel
      }),
    )

    const total = result.rows.length > 0 ? Number.parseInt(result.rows[0].total_count) : 0
    const paginationMeta = pagination.getMetadata(validPage, validLimit, total)

    return {
      success: true,
      data: reels,
      pagination: paginationMeta,
    }
  }

  // Update reel
  static async updateReel(reelId: string, userId: string, updates: Partial<CreateReelRequest>): Promise<Reel> {
    const allowedFields = ["title", "description", "is_public"]
    const updateFields = Object.keys(updates).filter((key) => allowedFields.includes(key))

    if (updateFields.length === 0) {
      throw errors.badRequest("No valid fields to update")
    }

    if (updates.title && updates.title.length > 255) {
      throw errors.badRequest("Title too long (max 255 characters)")
    }

    if (updates.description && updates.description.length > 2200) {
      throw errors.badRequest("Description too long (max 2200 characters)")
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(", ")
    const values = [reelId, userId, ...updateFields.map((field) => updates[field as keyof CreateReelRequest])]

    const result = await query(
      `UPDATE reels SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, video_url, thumbnail_url, title, description, duration, 
                 view_count, is_public, created_at, updated_at`,
      values,
    )

    if (result.rows.length === 0) {
      throw errors.notFound("Reel not found or you don't have permission to update it")
    }

    const reel = result.rows[0]

    // Get user data
    const userResult = await query("SELECT id, username, full_name, avatar_url, is_verified FROM users WHERE id = $1", [
      userId,
    ])

    const updatedReel = {
      ...reel,
      user: userResult.rows[0],
    }

    // Clear cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}reels:*`)

    return updatedReel
  }

  // Delete reel
  static async deleteReel(reelId: string, userId: string): Promise<void> {
    // First, check if reel exists
    const reelCheck = await query("SELECT id, user_id, video_url, thumbnail_url FROM reels WHERE id = $1", [reelId])

    if (reelCheck.rows.length === 0) {
      throw errors.notFound("Reel not found")
    }

    const reel = reelCheck.rows[0]

    // Verify ownership - only the reel owner can delete it
    if (reel.user_id !== userId) {
      throw errors.forbidden("You don't have permission to delete this reel. Only the reel owner can delete it.")
    }

    await transaction(async (client) => {
      // Delete the reel (permanent delete)
      await client.query("DELETE FROM reels WHERE id = $1 AND user_id = $2", [reelId, userId])

      // Delete associated likes and comments
      await client.query("DELETE FROM likes WHERE post_id = $1", [reelId])
      await client.query("DELETE FROM comments WHERE post_id = $1", [reelId])
    })

    // Delete media files from S3
    try {
      const filesToDelete = []

      if (reel.video_url) {
        const videoUrlParts = reel.video_url.split("/")
        const videoKey = videoUrlParts.slice(-3).join("/")
        filesToDelete.push(videoKey)
      }

      if (reel.thumbnail_url) {
        const thumbnailUrlParts = reel.thumbnail_url.split("/")
        const thumbnailKey = thumbnailUrlParts.slice(-3).join("/")
        filesToDelete.push(thumbnailKey)
      }

      if (filesToDelete.length > 0) {
        await StorageService.deleteMultipleFiles(filesToDelete)
      }
    } catch (error) {
      console.error("Failed to delete reel media:", error)
    }

    // Clear cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}reels:*`)
  }

  // Increment view count
  private static async incrementViewCount(reelId: string): Promise<void> {
    // Use Redis for view counting to avoid database load
    const viewKey = `${config.redis.keyPrefix}reel:${reelId}:views`
    const currentViews = await cache.redis.incr(viewKey)

    // Update database every 10 views to reduce write load
    if (currentViews % 10 === 0) {
      await query("UPDATE reels SET view_count = view_count + 10 WHERE id = $1", [reelId])
    }

    // Set expiry for the Redis key (24 hours)
    await cache.redis.expire(viewKey, 86400)
  }

  // Like reel
  static async likeReel(userId: string, reelId: string): Promise<void> {
    // Check if reel exists
    const reelExists = await query("SELECT id FROM reels WHERE id = $1 AND is_public = true", [reelId])
    if (reelExists.rows.length === 0) {
      throw errors.notFound("Reel not found")
    }

    // Check if already liked
    const existingLike = await query("SELECT id FROM likes WHERE user_id = $1 AND post_id = $2", [userId, reelId])
    if (existingLike.rows.length > 0) {
      throw errors.conflict("Reel already liked")
    }

    await query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [userId, reelId])

    // Clear cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}reels:*`)
  }

  // Unlike reel
  static async unlikeReel(userId: string, reelId: string): Promise<void> {
    const result = await query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [userId, reelId])

    if (result.rowCount === 0) {
      throw errors.notFound("Like not found")
    }

    // Clear cache
    await cache.invalidatePattern(`${config.redis.keyPrefix}reels:*`)
  }

  // Get reel likes
  static async getReelLikes(reelId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
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
      [reelId, validLimit, offset],
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
