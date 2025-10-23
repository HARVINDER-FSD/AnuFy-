import { pool, redis } from "../lib/database"
import { moderationQueue } from "../lib/queue"
import axios from "axios"

export interface ModerationResult {
  content_id: string
  content_type: "post" | "comment" | "story" | "reel" | "message"
  status: "approved" | "rejected" | "pending" | "flagged"
  confidence: number
  reasons: string[]
  automated: boolean
  reviewed_by?: string
  reviewed_at?: Date
}

export class ModerationService {
  private static instance: ModerationService

  static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService()
    }
    return ModerationService.instance
  }

  async moderateContent(
    contentId: string,
    contentType: "post" | "comment" | "story" | "reel" | "message",
    content: string,
    mediaUrls?: string[],
  ): Promise<ModerationResult> {
    try {
      // Check cache first
      const cacheKey = `moderation:${contentType}:${contentId}`
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Perform text moderation
      const textResult = await this.moderateText(content)

      // Perform image moderation if media is present
      let mediaResult = { safe: true, confidence: 1.0, reasons: [] }
      if (mediaUrls && mediaUrls.length > 0) {
        mediaResult = await this.moderateMedia(mediaUrls)
      }

      // Combine results
      const overallSafe = textResult.safe && mediaResult.safe
      const confidence = Math.min(textResult.confidence, mediaResult.confidence)
      const reasons = [...textResult.reasons, ...mediaResult.reasons]

      const result: ModerationResult = {
        content_id: contentId,
        content_type: contentType,
        status: overallSafe ? "approved" : confidence > 0.8 ? "rejected" : "flagged",
        confidence,
        reasons,
        automated: true,
      }

      // Store result in database
      await this.storeModerationResult(result)

      // Cache result
      await redis.setex(cacheKey, 3600, JSON.stringify(result))

      // If flagged, queue for human review
      if (result.status === "flagged") {
        await moderationQueue.add(
          "human-review",
          {
            contentId,
            contentType,
            content,
            mediaUrls,
            moderationResult: result,
          },
          {
            priority: confidence < 0.5 ? 1 : 5, // Higher priority for lower confidence
            delay: 0,
          },
        )
      }

      return result
    } catch (error) {
      console.error("Error moderating content:", error)

      // Default to flagged for manual review on error
      const result: ModerationResult = {
        content_id: contentId,
        content_type: contentType,
        status: "flagged",
        confidence: 0,
        reasons: ["moderation_error"],
        automated: true,
      }

      await this.storeModerationResult(result)
      return result
    }
  }

  private async moderateText(content: string): Promise<{
    safe: boolean
    confidence: number
    reasons: string[]
  }> {
    try {
      // Use external ML API for text moderation
      const response = await axios.post(
        `${process.env.MODERATION_API_URL}/text`,
        { text: content },
        {
          headers: {
            Authorization: `Bearer ${process.env.ML_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      )

      const { safe, confidence, categories } = response.data

      return {
        safe,
        confidence,
        reasons: categories || [],
      }
    } catch (error) {
      console.error("Error in text moderation:", error)

      // Fallback to basic keyword filtering
      return this.basicTextModeration(content)
    }
  }

  private async moderateMedia(mediaUrls: string[]): Promise<{
    safe: boolean
    confidence: number
    reasons: string[]
  }> {
    try {
      const results = await Promise.all(
        mediaUrls.map(async (url) => {
          const response = await axios.post(
            `${process.env.MODERATION_API_URL}/image`,
            { image_url: url },
            {
              headers: {
                Authorization: `Bearer ${process.env.ML_API_KEY}`,
                "Content-Type": "application/json",
              },
              timeout: 15000,
            },
          )

          return response.data
        }),
      )

      const overallSafe = results.every((result) => result.safe)
      const minConfidence = Math.min(...results.map((r) => r.confidence))
      const allReasons = results.flatMap((r) => r.categories || [])

      return {
        safe: overallSafe,
        confidence: minConfidence,
        reasons: [...new Set(allReasons)],
      }
    } catch (error) {
      console.error("Error in media moderation:", error)

      // Default to flagged for manual review
      return {
        safe: false,
        confidence: 0.5,
        reasons: ["media_review_required"],
      }
    }
  }

  private basicTextModeration(content: string): {
    safe: boolean
    confidence: number
    reasons: string[]
  } {
    const bannedWords = [
      "spam",
      "scam",
      "hate",
      "violence",
      "harassment",
      // Add more banned words as needed
    ]

    const lowerContent = content.toLowerCase()
    const foundWords = bannedWords.filter((word) => lowerContent.includes(word))

    return {
      safe: foundWords.length === 0,
      confidence: foundWords.length === 0 ? 0.8 : 0.3,
      reasons: foundWords.length > 0 ? ["inappropriate_content"] : [],
    }
  }

  private async storeModerationResult(result: ModerationResult): Promise<void> {
    const client = await pool.connect()
    try {
      await client.query(
        `
        INSERT INTO moderation_results (
          content_id, content_type, status, confidence, 
          reasons, automated, reviewed_by, reviewed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (content_id, content_type) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          confidence = EXCLUDED.confidence,
          reasons = EXCLUDED.reasons,
          reviewed_by = EXCLUDED.reviewed_by,
          reviewed_at = EXCLUDED.reviewed_at,
          updated_at = NOW()
      `,
        [
          result.content_id,
          result.content_type,
          result.status,
          result.confidence,
          JSON.stringify(result.reasons),
          result.automated,
          result.reviewed_by,
          result.reviewed_at,
        ],
      )
    } finally {
      client.release()
    }
  }

  async getModerationHistory(contentId: string, contentType: string) {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        SELECT * FROM moderation_results 
        WHERE content_id = $1 AND content_type = $2
        ORDER BY created_at DESC
      `,
        [contentId, contentType],
      )

      return result.rows.map((row) => ({
        ...row,
        reasons: JSON.parse(row.reasons),
      }))
    } finally {
      client.release()
    }
  }

  async getPendingReviews(limit = 50, offset = 0) {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        SELECT mr.*, 
               CASE 
                 WHEN mr.content_type = 'post' THEN p.content
                 WHEN mr.content_type = 'comment' THEN c.content
                 WHEN mr.content_type = 'message' THEN m.content
               END as content_text,
               u.username as author_username
        FROM moderation_results mr
        LEFT JOIN posts p ON mr.content_id = p.id AND mr.content_type = 'post'
        LEFT JOIN comments c ON mr.content_id = c.id AND mr.content_type = 'comment'
        LEFT JOIN messages m ON mr.content_id = m.id AND mr.content_type = 'message'
        LEFT JOIN users u ON (
          (mr.content_type = 'post' AND p.user_id = u.id) OR
          (mr.content_type = 'comment' AND c.user_id = u.id) OR
          (mr.content_type = 'message' AND m.sender_id = u.id)
        )
        WHERE mr.status IN ('pending', 'flagged')
        ORDER BY mr.created_at ASC
        LIMIT $1 OFFSET $2
      `,
        [limit, offset],
      )

      return result.rows.map((row) => ({
        ...row,
        reasons: JSON.parse(row.reasons),
      }))
    } finally {
      client.release()
    }
  }

  async reviewContent(
    contentId: string,
    contentType: string,
    reviewerId: string,
    decision: "approved" | "rejected",
    notes?: string,
  ): Promise<void> {
    const client = await pool.connect()
    try {
      await client.query(
        `
        UPDATE moderation_results 
        SET status = $1, reviewed_by = $2, reviewed_at = NOW(), 
            notes = $3, updated_at = NOW()
        WHERE content_id = $4 AND content_type = $5
      `,
        [decision, reviewerId, notes, contentId, contentType],
      )

      // If rejected, take action on the content
      if (decision === "rejected") {
        await this.takeActionOnRejectedContent(contentId, contentType)
      }

      // Clear cache
      const cacheKey = `moderation:${contentType}:${contentId}`
      await redis.del(cacheKey)
    } finally {
      client.release()
    }
  }

  private async takeActionOnRejectedContent(contentId: string, contentType: string): Promise<void> {
    const client = await pool.connect()
    try {
      switch (contentType) {
        case "post":
          await client.query("UPDATE posts SET status = $1 WHERE id = $2", ["hidden", contentId])
          break
        case "comment":
          await client.query("UPDATE comments SET status = $1 WHERE id = $2", ["hidden", contentId])
          break
        case "story":
          await client.query("UPDATE stories SET status = $1 WHERE id = $2", ["hidden", contentId])
          break
        case "reel":
          await client.query("UPDATE reels SET status = $1 WHERE id = $2", ["hidden", contentId])
          break
        case "message":
          await client.query("UPDATE messages SET status = $1 WHERE id = $2", ["hidden", contentId])
          break
      }
    } finally {
      client.release()
    }
  }

  async getModerationStats(days = 30) {
    const client = await pool.connect()
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

      const result = await client.query(
        `
        SELECT 
          content_type,
          status,
          automated,
          COUNT(*) as count,
          AVG(confidence) as avg_confidence
        FROM moderation_results 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY content_type, status, automated
        ORDER BY content_type, status
      `,
        [startDate, endDate],
      )

      return result.rows
    } finally {
      client.release()
    }
  }
}

export const moderationService = ModerationService.getInstance()
