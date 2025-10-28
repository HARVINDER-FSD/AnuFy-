import { Router } from "express"
import { PostService } from "../services/post"
import { ReelService } from "../services/reel"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Get trending posts
router.get("/trending", async (req, res) => {
  try {
    const { page, limit } = req.query

    res.json({
      success: true,
      data: {
        posts: [],
        pagination: {
          page: Number.parseInt(page as string) || 1,
          limit: Number.parseInt(limit as string) || 20,
          total: 0,
          totalPages: 0
        }
      }
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get suggested users
router.get("/suggested-users", authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query

    res.json({
      success: true,
      data: {
        users: []
      }
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get explore feed
router.get("/feed", authenticateToken, async (req, res) => {
  try {
    const { page, limit } = req.query

    const result = await ReelService.getReelsFeed(
      req.user?.userId,
      Number.parseInt(page as string) || 1,
      Number.parseInt(limit as string) || 20,
    )

    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
