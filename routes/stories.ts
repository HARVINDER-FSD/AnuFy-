import express from "express"
import { StoryService } from "../services/story"
import { authenticateToken } from "../middleware/auth"
import storyController from "../controllers/storyController"
import { storyUpload } from "../middleware/upload"

const router = express.Router()

// Instagram-style story endpoints
router.post("/instagram", authenticateToken, storyUpload, storyController.createStory)
router.get("/instagram/following", authenticateToken, storyController.getFollowingStories)
router.get("/instagram/user/:userId", storyController.getUserStories)
router.post("/instagram/:storyId/view", authenticateToken, storyController.viewStory)

// Create story
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { media_url, media_type, content } = req.body

    const story = await StoryService.createStory(req.user!.userId, {
      media_url,
      media_type,
      content,
    })

    res.status(201).json({
      success: true,
      data: { story },
      message: "Story created successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get stories feed
router.get("/feed", authenticateToken, async (req, res) => {
  try {
    const stories = await StoryService.getStoriesFeed(req.user!.userId)

    res.json({
      success: true,
      data: { stories },
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get user stories
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const stories = await StoryService.getUserStories(userId, req.user?.userId)

    res.json({
      success: true,
      data: { stories },
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// View story
router.post("/:storyId/view", authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params
    await StoryService.viewStory(storyId, req.user!.userId)

    res.json({
      success: true,
      message: "Story viewed",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get story views
router.get("/:storyId/views", authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params
    const views = await StoryService.getStoryViews(storyId, req.user!.userId)

    res.json({
      success: true,
      data: { views },
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Delete story
router.delete("/:storyId", authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params
    await StoryService.deleteStory(storyId, req.user!.userId)

    res.json({
      success: true,
      message: "Story deleted successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
