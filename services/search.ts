import { elasticsearch } from "../lib/elasticsearch"
import { redis } from "../lib/database"
import { pool } from "../lib/database"

export class SearchService {
  private static instance: SearchService

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService()
    }
    return SearchService.instance
  }

  async initializeIndices(): Promise<void> {
    // Create user index
    await elasticsearch.createIndex("users", {
      id: { type: "keyword" },
      type: { type: "keyword" },
      content: { type: "text", analyzer: "standard" },
      "metadata.username": { type: "text", analyzer: "keyword" },
      "metadata.full_name": { type: "text", analyzer: "standard" },
      "metadata.bio": { type: "text", analyzer: "standard" },
      "metadata.verified": { type: "boolean" },
      "metadata.followers_count": { type: "integer" },
      created_at: { type: "date" },
      updated_at: { type: "date" },
    })

    // Create posts index
    await elasticsearch.createIndex("posts", {
      id: { type: "keyword" },
      type: { type: "keyword" },
      content: { type: "text", analyzer: "standard" },
      "metadata.user_id": { type: "keyword" },
      "metadata.username": { type: "keyword" },
      "metadata.hashtags": { type: "keyword" },
      "metadata.mentions": { type: "keyword" },
      "metadata.likes_count": { type: "integer" },
      "metadata.comments_count": { type: "integer" },
      "metadata.media_type": { type: "keyword" },
      created_at: { type: "date" },
      updated_at: { type: "date" },
    })

    // Create hashtags index
    await elasticsearch.createIndex("hashtags", {
      id: { type: "keyword" },
      type: { type: "keyword" },
      content: { type: "text", analyzer: "keyword" },
      "metadata.usage_count": { type: "integer" },
      "metadata.trending_score": { type: "float" },
      created_at: { type: "date" },
      updated_at: { type: "date" },
    })
  }

  async indexUser(userId: string): Promise<void> {
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT * FROM users WHERE id = $1", [userId])

      if (result.rows.length === 0) return

      const user = result.rows[0]
      await elasticsearch.indexDocument("users", {
        id: user.id,
        type: "user",
        content: `${user.username} ${user.full_name} ${user.bio || ""}`,
        metadata: {
          username: user.username,
          full_name: user.full_name,
          bio: user.bio,
          verified: user.verified,
          followers_count: user.followers_count,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      })
    } finally {
      client.release()
    }
  }

  async indexPost(postId: string): Promise<void> {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        SELECT p.*, u.username, 
               COALESCE(l.likes_count, 0) as likes_count,
               COALESCE(c.comments_count, 0) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as likes_count 
          FROM likes 
          WHERE post_id = $1 
          GROUP BY post_id
        ) l ON p.id = l.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comments_count 
          FROM comments 
          WHERE post_id = $1 
          GROUP BY post_id
        ) c ON p.id = c.post_id
        WHERE p.id = $1
      `,
        [postId],
      )

      if (result.rows.length === 0) return

      const post = result.rows[0]
      const hashtags = this.extractHashtags(post.content)
      const mentions = this.extractMentions(post.content)

      await elasticsearch.indexDocument("posts", {
        id: post.id,
        type: "post",
        content: post.content,
        metadata: {
          user_id: post.user_id,
          username: post.username,
          hashtags,
          mentions,
          likes_count: Number.parseInt(post.likes_count),
          comments_count: Number.parseInt(post.comments_count),
          media_type: post.media_type,
        },
        created_at: post.created_at,
        updated_at: post.updated_at,
      })

      // Index hashtags
      for (const hashtag of hashtags) {
        await this.indexHashtag(hashtag)
      }
    } finally {
      client.release()
    }
  }

  async indexHashtag(hashtag: string): Promise<void> {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        SELECT COUNT(*) as usage_count
        FROM posts 
        WHERE content ILIKE $1
      `,
        [`%#${hashtag}%`],
      )

      const usageCount = Number.parseInt(result.rows[0].usage_count)
      const trendingScore = this.calculateTrendingScore(usageCount)

      await elasticsearch.indexDocument("hashtags", {
        id: hashtag,
        type: "hashtag",
        content: hashtag,
        metadata: {
          usage_count: usageCount,
          trending_score: trendingScore,
        },
        created_at: new Date(),
        updated_at: new Date(),
      })
    } finally {
      client.release()
    }
  }

  async searchUsers(query: string, limit = 20, offset = 0) {
    const cacheKey = `search:users:${query}:${limit}:${offset}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const results = await elasticsearch.search("users", query, {}, limit, offset)
    await redis.setex(cacheKey, 300, JSON.stringify(results)) // Cache for 5 minutes

    return results
  }

  async searchPosts(query: string, filters?: Record<string, any>, limit = 20, offset = 0) {
    const cacheKey = `search:posts:${query}:${JSON.stringify(filters)}:${limit}:${offset}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const results = await elasticsearch.search("posts", query, filters, limit, offset)
    await redis.setex(cacheKey, 300, JSON.stringify(results))

    return results
  }

  async searchHashtags(query: string, limit = 20, offset = 0) {
    const cacheKey = `search:hashtags:${query}:${limit}:${offset}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const results = await elasticsearch.search("hashtags", query, {}, limit, offset)
    await redis.setex(cacheKey, 600, JSON.stringify(results)) // Cache for 10 minutes

    return results
  }

  async getTrendingHashtags(limit = 10) {
    const cacheKey = `trending:hashtags:${limit}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const results = await elasticsearch.search("hashtags", "*", {}, limit, 0)
    results.hits.sort((a: any, b: any) => b.metadata.trending_score - a.metadata.trending_score)

    await redis.setex(cacheKey, 1800, JSON.stringify(results)) // Cache for 30 minutes
    return results
  }

  private extractHashtags(content: string): string[] {
    const hashtags = content.match(/#\w+/g) || []
    return hashtags.map((tag) => tag.substring(1).toLowerCase())
  }

  private extractMentions(content: string): string[] {
    const mentions = content.match(/@\w+/g) || []
    return mentions.map((mention) => mention.substring(1).toLowerCase())
  }

  private calculateTrendingScore(usageCount: number): number {
    const now = Date.now()
    const hoursSinceEpoch = now / (1000 * 60 * 60)
    return usageCount / Math.pow(hoursSinceEpoch, 1.5)
  }
}

export const searchService = SearchService.getInstance()
