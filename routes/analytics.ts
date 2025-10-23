import { Router } from "express"
import { analyticsService } from "../services/analytics"
import { authenticateToken } from "../middleware/auth"
import { rateLimit } from "express-rate-limit"
import { pool } from "../db" // Declare the pool variable

const router = Router()

const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: "Too many analytics requests, please try again later",
})

router.use(analyticsRateLimit)
router.use(authenticateToken)

// Track event
router.post("/track", async (req, res) => {
  try {
    const { event_type, target_id, target_type, metadata } = req.body

    if (!event_type) {
      return res.status(400).json({ error: "Event type is required" })
    }

    await analyticsService.trackEvent({
      event_type,
      user_id: req.user?.id,
      target_id,
      target_type,
      metadata,
      timestamp: new Date(),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    })

    res.json({ success: true })
  } catch (error) {
    console.error("Error tracking event:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get user analytics
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const { days = 30 } = req.query

    // Check if user can access these analytics
    if (req.user?.id !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied" })
    }

    const analytics = await analyticsService.getUserAnalytics(userId, Number.parseInt(days as string))

    res.json(analytics)
  } catch (error) {
    console.error("Error getting user analytics:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get post analytics
router.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params

    // Check if user owns the post or is admin
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT user_id FROM posts WHERE id = $1", [postId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Post not found" })
      }

      if (req.user?.id !== result.rows[0].user_id && req.user?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" })
      }
    } finally {
      client.release()
    }

    const analytics = await analyticsService.getPostAnalytics(postId)
    res.json(analytics)
  } catch (error) {
    console.error("Error getting post analytics:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get global analytics (admin only)
router.get("/global", async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" })
    }

    const { days = 7 } = req.query
    const analytics = await analyticsService.getGlobalAnalytics(Number.parseInt(days as string))

    res.json(analytics)
  } catch (error) {
    console.error("Error getting global analytics:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
