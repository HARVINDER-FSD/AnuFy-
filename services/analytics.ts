import { pool, redis } from "../lib/database"
import { kafka } from "../lib/kafka"

export interface AnalyticsEvent {
  event_type: string
  user_id?: string
  target_id?: string
  target_type?: string
  metadata?: Record<string, any>
  timestamp: Date
  ip_address?: string
  user_agent?: string
}

export class AnalyticsService {
  private static instance: AnalyticsService

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Store in PostgreSQL for long-term analytics
      const client = await pool.connect()
      try {
        await client.query(
          `
          INSERT INTO analytics_events (
            event_type, user_id, target_id, target_type, 
            metadata, timestamp, ip_address, user_agent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [
            event.event_type,
            event.user_id,
            event.target_id,
            event.target_type,
            JSON.stringify(event.metadata || {}),
            event.timestamp,
            event.ip_address,
            event.user_agent,
          ],
        )
      } finally {
        client.release()
      }

      // Send to Kafka for real-time processing
      await kafka.send({
        topic: "analytics-events",
        messages: [
          {
            key: event.user_id || "anonymous",
            value: JSON.stringify(event),
          },
        ],
      })

      // Update real-time counters in Redis
      await this.updateRealTimeCounters(event)
    } catch (error) {
      console.error("Error tracking event:", error)
    }
  }

  private async updateRealTimeCounters(event: AnalyticsEvent): Promise<void> {
    const today = new Date().toISOString().split("T")[0]
    const hour = new Date().getHours()

    switch (event.event_type) {
      case "post_view":
        await redis.incr(`analytics:post_views:${event.target_id}:${today}`)
        await redis.incr(`analytics:post_views:${event.target_id}:${today}:${hour}`)
        break
      case "post_like":
        await redis.incr(`analytics:post_likes:${event.target_id}:${today}`)
        break
      case "user_follow":
        await redis.incr(`analytics:user_follows:${event.target_id}:${today}`)
        break
      case "story_view":
        await redis.incr(`analytics:story_views:${event.target_id}:${today}`)
        break
      case "reel_view":
        await redis.incr(`analytics:reel_views:${event.target_id}:${today}`)
        break
    }
  }

  async getUserAnalytics(userId: string, days = 30) {
    const cacheKey = `analytics:user:${userId}:${days}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const client = await pool.connect()
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

      const [postViews, postLikes, followers, storyViews, reelViews, engagement] = await Promise.all([
        client.query(
          `
          SELECT DATE(timestamp) as date, COUNT(*) as views
          FROM analytics_events 
          WHERE event_type = 'post_view' 
            AND target_id IN (SELECT id FROM posts WHERE user_id = $1)
            AND timestamp >= $2 AND timestamp <= $3
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,
          [userId, startDate, endDate],
        ),

        client.query(
          `
          SELECT DATE(timestamp) as date, COUNT(*) as likes
          FROM analytics_events 
          WHERE event_type = 'post_like' 
            AND target_id IN (SELECT id FROM posts WHERE user_id = $1)
            AND timestamp >= $2 AND timestamp <= $3
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,
          [userId, startDate, endDate],
        ),

        client.query(
          `
          SELECT DATE(timestamp) as date, COUNT(*) as new_followers
          FROM analytics_events 
          WHERE event_type = 'user_follow' 
            AND target_id = $1
            AND timestamp >= $2 AND timestamp <= $3
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,
          [userId, startDate, endDate],
        ),

        client.query(
          `
          SELECT DATE(timestamp) as date, COUNT(*) as views
          FROM analytics_events 
          WHERE event_type = 'story_view' 
            AND target_id IN (SELECT id FROM stories WHERE user_id = $1)
            AND timestamp >= $2 AND timestamp <= $3
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,
          [userId, startDate, endDate],
        ),

        client.query(
          `
          SELECT DATE(timestamp) as date, COUNT(*) as views
          FROM analytics_events 
          WHERE event_type = 'reel_view' 
            AND target_id IN (SELECT id FROM reels WHERE user_id = $1)
            AND timestamp >= $2 AND timestamp <= $3
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,
          [userId, startDate, endDate],
        ),

        client.query(
          `
          SELECT 
            COUNT(CASE WHEN event_type = 'post_like' THEN 1 END) as total_likes,
            COUNT(CASE WHEN event_type = 'post_comment' THEN 1 END) as total_comments,
            COUNT(CASE WHEN event_type = 'post_share' THEN 1 END) as total_shares,
            COUNT(CASE WHEN event_type = 'post_view' THEN 1 END) as total_views
          FROM analytics_events 
          WHERE target_id IN (SELECT id FROM posts WHERE user_id = $1)
            AND timestamp >= $2 AND timestamp <= $3
        `,
          [userId, startDate, endDate],
        ),
      ])

      const analytics = {
        post_views: postViews.rows,
        post_likes: postLikes.rows,
        new_followers: followers.rows,
        story_views: storyViews.rows,
        reel_views: reelViews.rows,
        engagement: engagement.rows[0],
        summary: {
          total_post_views: postViews.rows.reduce((sum: number, row: any) => sum + Number.parseInt(row.views), 0),
          total_post_likes: postLikes.rows.reduce((sum: number, row: any) => sum + Number.parseInt(row.likes), 0),
          total_new_followers: followers.rows.reduce(
            (sum: number, row: any) => sum + Number.parseInt(row.new_followers),
            0,
          ),
          total_story_views: storyViews.rows.reduce((sum: number, row: any) => sum + Number.parseInt(row.views), 0),
          total_reel_views: reelViews.rows.reduce((sum: number, row: any) => sum + Number.parseInt(row.views), 0),
        },
      }

      await redis.setex(cacheKey, 3600, JSON.stringify(analytics)) // Cache for 1 hour
      return analytics
    } finally {
      client.release()
    }
  }

  async getPostAnalytics(postId: string) {
    const cacheKey = `analytics:post:${postId}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const client = await pool.connect()
    try {
      const [views, engagement, demographics] = await Promise.all([
        client.query(
          `
          SELECT 
            DATE(timestamp) as date,
            EXTRACT(hour FROM timestamp) as hour,
            COUNT(*) as views
          FROM analytics_events 
          WHERE event_type = 'post_view' AND target_id = $1
          GROUP BY DATE(timestamp), EXTRACT(hour FROM timestamp)
          ORDER BY date, hour
        `,
          [postId],
        ),

        client.query(
          `
          SELECT 
            event_type,
            COUNT(*) as count
          FROM analytics_events 
          WHERE target_id = $1 
            AND event_type IN ('post_like', 'post_comment', 'post_share', 'post_save')
          GROUP BY event_type
        `,
          [postId],
        ),

        client.query(
          `
          SELECT 
            u.country,
            u.age_range,
            COUNT(*) as count
          FROM analytics_events ae
          JOIN users u ON ae.user_id = u.id
          WHERE ae.target_id = $1 AND ae.event_type = 'post_view'
          GROUP BY u.country, u.age_range
        `,
          [postId],
        ),
      ])

      const analytics = {
        views_by_time: views.rows,
        engagement: engagement.rows,
        demographics: demographics.rows,
        summary: {
          total_views: views.rows.reduce((sum: number, row: any) => sum + Number.parseInt(row.views), 0),
          total_engagement: engagement.rows.reduce((sum: number, row: any) => sum + Number.parseInt(row.count), 0),
        },
      }

      await redis.setex(cacheKey, 1800, JSON.stringify(analytics)) // Cache for 30 minutes
      return analytics
    } finally {
      client.release()
    }
  }

  async getGlobalAnalytics(days = 7) {
    const cacheKey = `analytics:global:${days}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const client = await pool.connect()
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

      const [dailyStats, topPosts, topUsers] = await Promise.all([
        client.query(
          `
          SELECT 
            DATE(timestamp) as date,
            COUNT(CASE WHEN event_type = 'post_view' THEN 1 END) as post_views,
            COUNT(CASE WHEN event_type = 'post_like' THEN 1 END) as post_likes,
            COUNT(CASE WHEN event_type = 'user_signup' THEN 1 END) as new_users,
            COUNT(CASE WHEN event_type = 'user_login' THEN 1 END) as logins
          FROM analytics_events 
          WHERE timestamp >= $1 AND timestamp <= $2
          GROUP BY DATE(timestamp)
          ORDER BY date
        `,
          [startDate, endDate],
        ),

        client.query(
          `
          SELECT 
            p.id,
            p.content,
            u.username,
            COUNT(*) as total_engagement
          FROM analytics_events ae
          JOIN posts p ON ae.target_id = p.id
          JOIN users u ON p.user_id = u.id
          WHERE ae.timestamp >= $1 AND ae.timestamp <= $2
            AND ae.event_type IN ('post_like', 'post_comment', 'post_share')
          GROUP BY p.id, p.content, u.username
          ORDER BY total_engagement DESC
          LIMIT 10
        `,
          [startDate, endDate],
        ),

        client.query(
          `
          SELECT 
            u.id,
            u.username,
            u.full_name,
            COUNT(*) as total_engagement
          FROM analytics_events ae
          JOIN posts p ON ae.target_id = p.id
          JOIN users u ON p.user_id = u.id
          WHERE ae.timestamp >= $1 AND ae.timestamp <= $2
            AND ae.event_type IN ('post_like', 'post_comment', 'post_share')
          GROUP BY u.id, u.username, u.full_name
          ORDER BY total_engagement DESC
          LIMIT 10
        `,
          [startDate, endDate],
        ),
      ])

      const analytics = {
        daily_stats: dailyStats.rows,
        top_posts: topPosts.rows,
        top_users: topUsers.rows,
      }

      await redis.setex(cacheKey, 7200, JSON.stringify(analytics)) // Cache for 2 hours
      return analytics
    } finally {
      client.release()
    }
  }
}

export const analyticsService = AnalyticsService.getInstance()
