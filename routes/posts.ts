import express from "express"
import { PostService } from "../services/post"
import { CommentService } from "../services/comment"
import { authenticateToken, optionalAuth } from "../middleware/auth"
import postController from "../controllers/postController"
import { postUpload } from "../middleware/upload"

const router = express.Router()

// Instagram-style post endpoints
router.post("/instagram", authenticateToken, postUpload, postController.createPost)
router.get("/instagram/feed", authenticateToken, postController.getFeedPosts)
router.get("/instagram/user/:userId", postController.getUserPosts)
router.get("/instagram/:postId", postController.getPostById)
router.post("/instagram/:postId/like", authenticateToken, postController.likePost)
router.post("/instagram/:postId/unlike", authenticateToken, postController.unlikePost)

// Create post
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { content, media_urls, media_type, location } = req.body

    const post = await PostService.createPost(req.user!.userId, {
      content,
      media_urls,
      media_type,
      location,
    })

    res.status(201).json({
      success: true,
      data: { post },
      message: "Post created successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get post by ID
router.get("/:postId", optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params
    const post = await PostService.getPostById(postId, req.user?.userId)

    res.json({
      success: true,
      data: { post },
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Update post
router.put("/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params
    const updates = req.body

    const post = await PostService.updatePost(postId, req.user!.userId, updates)

    res.json({
      success: true,
      data: { post },
      message: "Post updated successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Delete post
router.delete("/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params
    await PostService.deletePost(postId, req.user!.userId)

    res.json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Like post
router.post("/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params
    await PostService.likePost(req.user!.userId, postId)

    res.json({
      success: true,
      message: "Post liked successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Unlike post
router.delete("/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params
    await PostService.unlikePost(req.user!.userId, postId)

    res.json({
      success: true,
      message: "Post unliked successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get post likes
router.get("/:postId/likes", optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params
    const { page, limit } = req.query

    const result = await PostService.getPostLikes(
      postId,
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

// Save post
router.post("/:postId/save", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params
    // TODO: Implement save functionality in PostService
    res.json({
      success: true,
      message: "Post saved successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Unsave post
router.delete("/:postId/save", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params
    // TODO: Implement unsave functionality in PostService
    res.json({
      success: true,
      message: "Post unsaved successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get post comments
router.get("/:postId/comments", optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params
    const { page, limit, sort } = req.query

    const result = await CommentService.getPostComments(
      postId,
      Number.parseInt(page as string) || 1,
      Number.parseInt(limit as string) || 20,
      (sort as "newest" | "oldest") || "newest",
    )

    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Create comment
router.post("/:postId/comments", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params
    const { content, parent_comment_id } = req.body

    const comment = await CommentService.createComment(req.user!.userId, postId, {
      content,
      parent_comment_id,
    })

    res.status(201).json({
      success: true,
      data: { comment },
      message: "Comment created successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Update comment
router.put("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params
    const { content } = req.body

    const comment = await CommentService.updateComment(commentId, req.user!.userId, content)

    res.json({
      success: true,
      data: { comment },
      message: "Comment updated successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Delete comment
router.delete("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params
    await CommentService.deleteComment(commentId, req.user!.userId)

    res.json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get comment replies
router.get("/comments/:commentId/replies", optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params
    const { page, limit } = req.query

    const result = await CommentService.getCommentReplies(
      commentId,
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

// Get user feed
router.get("/feed", authenticateToken, async (req, res) => {
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

export default router
