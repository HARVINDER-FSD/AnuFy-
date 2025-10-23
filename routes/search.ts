import { Router } from "express"
import { searchService } from "../services/search"
import { analyticsService } from "../services/analytics"
import { rateLimit } from "express-rate-limit"
import searchController from "../controllers/searchController"
import authenticateToken from "../middleware/auth"

const router = Router()

const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many search requests, please try again later",
})

router.use(searchRateLimit)

// Instagram-style search endpoints
router.get("/instagram/users", searchController.searchUsers)
router.get("/instagram/posts", searchController.searchPosts)
router.get("/instagram/explore", authenticateToken, searchController.getExplorePosts)

// Search users
router.get("/users", async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter is required" })
    }

    const results = await searchService.searchUsers(
      q,
      Number.parseInt(limit as string),
      Number.parseInt(offset as string),
    )

    // Track search event
    if (req.user) {
      await analyticsService.trackEvent({
        event_type: "search_users",
        user_id: req.user.id,
        metadata: { query: q },
        timestamp: new Date(),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      })
    }

    res.json(results)
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Search posts
router.get("/posts", async (req, res) => {
  try {
    const { q, user_id, hashtag, limit = 20, offset = 0 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter is required" })
    }

    const filters: Record<string, any> = {}
    if (user_id) filters.user_id = user_id
    if (hashtag) filters.hashtags = hashtag

    const results = await searchService.searchPosts(
      q,
      filters,
      Number.parseInt(limit as string),
      Number.parseInt(offset as string),
    )

    // Track search event
    if (req.user) {
      await analyticsService.trackEvent({
        event_type: "search_posts",
        user_id: req.user.id,
        metadata: { query: q, filters },
        timestamp: new Date(),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      })
    }

    res.json(results)
  } catch (error) {
    console.error("Error searching posts:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Search hashtags
router.get("/hashtags", async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter is required" })
    }

    const results = await searchService.searchHashtags(
      q,
      Number.parseInt(limit as string),
      Number.parseInt(offset as string),
    )

    res.json(results)
  } catch (error) {
    console.error("Error searching hashtags:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get trending hashtags
router.get("/trending", async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const results = await searchService.getTrendingHashtags(Number.parseInt(limit as string))

    res.json(results)
  } catch (error) {
    console.error("Error getting trending hashtags:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Global search (all types)
router.get("/global", async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter is required" })
    }

    const [users, posts, hashtags] = await Promise.all([
      searchService.searchUsers(q, Math.ceil(Number.parseInt(limit as string) / 3), 0),
      searchService.searchPosts(q, {}, Math.ceil(Number.parseInt(limit as string) / 3), 0),
      searchService.searchHashtags(q, Math.ceil(Number.parseInt(limit as string) / 3), 0),
    ])

    const results = {
      users: users.hits,
      posts: posts.hits,
      hashtags: hashtags.hits,
      total: users.total + posts.total + hashtags.total,
    }

    // Track search event
    if (req.user) {
      await analyticsService.trackEvent({
        event_type: "search_global",
        user_id: req.user.id,
        metadata: { query: q },
        timestamp: new Date(),
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      })
    }

    res.json(results)
  } catch (error) {
    console.error("Error performing global search:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
