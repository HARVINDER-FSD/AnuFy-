import { Router } from "express"
import { moderationService } from "../services/moderation"
import { authenticateToken, requireRole } from "../middleware/auth"
import { moderationQueue } from "../lib/queue"
import { rateLimit } from "express-rate-limit"

const router = Router()

const moderationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many moderation requests",
})

router.use(moderationRateLimit)
router.use(authenticateToken)

// Submit content for moderation
router.post("/moderate", async (req, res) => {
  try {
    const { contentId, contentType, content, mediaUrls } = req.body

    if (!contentId || !contentType || !content) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Add to moderation queue for async processing
    const job = await moderationQueue.add(
      "content-moderation",
      {
        contentId,
        contentType,
        content,
        mediaUrls,
      },
      {
        priority: 5,
        delay: 0,
      },
    )

    res.json({
      success: true,
      jobId: job.id,
      message: "Content submitted for moderation",
    })
  } catch (error) {
    console.error("Error submitting content for moderation:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get moderation result
router.get("/result/:contentId/:contentType", async (req, res) => {
  try {
    const { contentId, contentType } = req.params

    const history = await moderationService.getModerationHistory(contentId, contentType)

    if (history.length === 0) {
      return res.status(404).json({ error: "No moderation results found" })
    }

    res.json({ result: history[0], history })
  } catch (error) {
    console.error("Error getting moderation result:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get pending reviews (moderators only)
router.get("/pending", requireRole("moderator"), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const pendingReviews = await moderationService.getPendingReviews(
      Number.parseInt(limit as string),
      Number.parseInt(offset as string),
    )

    res.json({ reviews: pendingReviews })
  } catch (error) {
    console.error("Error getting pending reviews:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Review content (moderators only)
router.post("/review", requireRole("moderator"), async (req, res) => {
  try {
    const { contentId, contentType, decision, notes } = req.body

    if (!contentId || !contentType || !decision) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ error: "Invalid decision" })
    }

    await moderationService.reviewContent(contentId, contentType, req.user!.id, decision, notes)

    res.json({ success: true, message: "Content reviewed successfully" })
  } catch (error) {
    console.error("Error reviewing content:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get moderation stats (admin only)
router.get("/stats", requireRole("admin"), async (req, res) => {
  try {
    const { days = 30 } = req.query

    const stats = await moderationService.getModerationStats(Number.parseInt(days as string))

    res.json({ stats })
  } catch (error) {
    console.error("Error getting moderation stats:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Batch moderate content (admin only)
router.post("/batch", requireRole("admin"), async (req, res) => {
  try {
    const { contentItems } = req.body

    if (!Array.isArray(contentItems) || contentItems.length === 0) {
      return res.status(400).json({ error: "Invalid content items" })
    }

    const job = await moderationQueue.add(
      "batch-moderation",
      {
        contentItems,
      },
      {
        priority: 3,
        delay: 0,
      },
    )

    res.json({
      success: true,
      jobId: job.id,
      message: `Batch moderation started for ${contentItems.length} items`,
    })
  } catch (error) {
    console.error("Error starting batch moderation:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
