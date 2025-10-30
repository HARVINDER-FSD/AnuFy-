import { Router, Request, Response } from "express"
import { connectToDatabase } from "../lib/database"
import Story from "../models/story"
import { authenticateToken, optionalAuth } from "../middleware/auth"
import mongoose from "mongoose"

const router = Router()

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    userId: string
  }
}

// Get stories feed - optional auth
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await connectToDatabase()
    
    // Get active stories (not expired)
    const stories = await Story.find({
      expires_at: { $gt: new Date() },
      is_deleted: false
    })
    .populate('user_id', 'username full_name avatar_url is_verified')
    .sort({ created_at: -1 })
    .limit(50)
    .lean()

    // Format stories for frontend
    const formattedStories = stories.map((story: any) => ({
      id: story._id.toString(),
      user_id: story.user_id._id.toString(),
      username: story.user_id.username,
      full_name: story.user_id.full_name,
      avatar_url: story.user_id.avatar_url,
      is_verified: story.user_id.is_verified,
      media_url: story.media_url,
      media_type: story.media_type,
      caption: story.caption,
      created_at: story.created_at,
      expires_at: story.expires_at
    }))

    res.json({
      success: true,
      data: formattedStories
    })
  } catch (error: any) {
    console.error('Error fetching stories:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stories'
    })
  }
})

// Create story
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectToDatabase()
    
    const { media_url, media_type, caption } = req.body
    const userId = req.user!.userId

    if (!media_url || !media_type) {
      return res.status(400).json({
        success: false,
        error: 'Media URL and type are required'
      })
    }

    const story = await Story.create({
      user_id: new mongoose.Types.ObjectId(userId),
      media_url,
      media_type,
      caption: caption || null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    })

    const populatedStory = await Story.findById(story._id)
      .populate('user_id', 'username full_name avatar_url is_verified')
      .lean()

    res.status(201).json({
      success: true,
      data: { story: populatedStory },
      message: "Story created successfully"
    })
  } catch (error: any) {
    console.error('Error creating story:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create story'
    })
  }
})

// Get user stories
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    await connectToDatabase()
    
    const { userId } = req.params

    const stories = await Story.find({
      user_id: new mongoose.Types.ObjectId(userId),
      expires_at: { $gt: new Date() },
      is_deleted: false
    })
    .populate('user_id', 'username full_name avatar_url is_verified')
    .sort({ created_at: -1 })
    .lean()

    res.json({
      success: true,
      data: { stories }
    })
  } catch (error: any) {
    console.error('Error fetching user stories:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user stories'
    })
  }
})

// Delete story
router.delete("/:storyId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectToDatabase()
    
    const { storyId } = req.params
    const userId = req.user!.userId

    const story = await Story.findById(storyId)

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      })
    }

    if (story.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own stories'
      })
    }

    await Story.findByIdAndUpdate(storyId, { is_deleted: true })

    res.json({
      success: true,
      message: "Story deleted successfully"
    })
  } catch (error: any) {
    console.error('Error deleting story:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete story'
    })
  }
})

// View story
router.post("/:storyId/view", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectToDatabase()
    
    const { storyId } = req.params
    const userId = req.user!.userId

    const story = await Story.findById(storyId)

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      })
    }

    // Increment view count
    await Story.findByIdAndUpdate(storyId, {
      $inc: { views_count: 1 }
    })

    res.json({
      success: true,
      message: "Story viewed"
    })
  } catch (error: any) {
    console.error('Error viewing story:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to view story'
    })
  }
})

// Get story views
router.get("/:storyId/views", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await connectToDatabase()
    
    const { storyId } = req.params
    const userId = req.user!.userId

    const story = await Story.findById(storyId)

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      })
    }

    if (story.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own story views'
      })
    }

    res.json({
      success: true,
      data: { 
        views: story.views_count || 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching story views:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch story views'
    })
  }
})

export default router
