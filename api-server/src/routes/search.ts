import { Router } from "express"
import { connectToDatabase } from "../lib/database"
import User from "../models/user"
import Post from "../models/post"

const router = Router()

// Global search (root endpoint)
router.get("/", async (req, res) => {
  try {
    const { q, limit = 20 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ 
        success: false,
        error: "Query parameter is required" 
      })
    }

    console.log('[Search] Query:', q)
    
    await connectToDatabase()

    // First, check total users in database
    const totalUsers = await User.countDocuments()
    console.log('[Search] Total users in database:', totalUsers)

    // Search users with simpler query
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { full_name: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username full_name avatar_url is_verified followers_count is_active')
    .limit(Number(limit))
    .lean()

    console.log('[Search] Found users:', users.length)
    if (users.length > 0) {
      console.log('[Search] First user:', users[0])
    }

    // Search posts
    const posts = await Post.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('user_id', 'username full_name avatar_url is_verified')
    .limit(Number(limit))
    .lean()

    // Extract hashtags from query
    const hashtags = q.startsWith('#') ? [{ tag: q, posts: 0 }] : []

    const formattedUsers = users.map((u: any) => ({
      id: u._id.toString(),
      username: u.username,
      name: u.full_name,
      avatar: u.avatar_url,
      verified: u.is_verified,
      followers: u.followers_count || 0,
      bio: u.bio || ''
    }))

    const formattedPosts = posts.map((p: any) => ({
      id: p._id.toString(),
      user: {
        id: p.user_id._id.toString(),
        username: p.user_id.username,
        avatar: p.user_id.avatar_url,
        verified: p.user_id.is_verified
      },
      content: p.caption || p.description || '',
      image: p.media_urls?.[0],
      likes: p.likes_count || 0,
      comments: p.comments_count || 0,
      shares: p.shares_count || 0,
      timestamp: p.created_at,
      liked: false,
      bookmarked: false
    }))

    console.log('[Search] Returning:', {
      users: formattedUsers.length,
      posts: formattedPosts.length,
      hashtags: hashtags.length
    })

    res.json({
      success: true,
      users: formattedUsers,
      posts: formattedPosts,
      hashtags
    })
  } catch (error) {
    console.error("Error performing search:", error)
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    })
  }
})

// Search users
router.get("/users", async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ 
        success: false,
        error: "Query parameter is required" 
      })
    }

    // Placeholder response - implement with actual search service
    res.json({
      success: true,
      data: {
        users: [],
        total: 0
      }
    })
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    })
  }
})

// Search posts
router.get("/posts", async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ 
        success: false,
        error: "Query parameter is required" 
      })
    }

    res.json({
      success: true,
      data: {
        posts: [],
        total: 0
      }
    })
  } catch (error) {
    console.error("Error searching posts:", error)
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    })
  }
})

// Search hashtags
router.get("/hashtags", async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ 
        success: false,
        error: "Query parameter is required" 
      })
    }

    res.json({
      success: true,
      data: {
        hashtags: [],
        total: 0
      }
    })
  } catch (error) {
    console.error("Error searching hashtags:", error)
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    })
  }
})

// Get trending hashtags
router.get("/trending", async (req, res) => {
  try {
    const { limit = 10 } = req.query

    res.json({
      success: true,
      data: {
        hashtags: [],
        total: 0
      }
    })
  } catch (error) {
    console.error("Error getting trending hashtags:", error)
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    })
  }
})

// Global search
router.get("/global", async (req, res) => {
  try {
    const { q, limit = 20 } = req.query

    if (!q || typeof q !== "string") {
      return res.status(400).json({ 
        success: false,
        error: "Query parameter is required" 
      })
    }

    res.json({
      success: true,
      data: {
        users: [],
        posts: [],
        hashtags: [],
        total: 0
      }
    })
  } catch (error) {
    console.error("Error performing global search:", error)
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    })
  }
})

export default router
