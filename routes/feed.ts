import express from "express"
import { PostService } from "../services/post"
import { authenticateToken } from "../middleware/auth"

const router = express.Router()

// Get user's personalized feed
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page, limit } = req.query

    const result = await PostService.getFeedPosts(
      req.user!.userId,
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

// Get user's posts
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { page, limit } = req.query

    const result = await PostService.getUserPosts(
      userId,
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
