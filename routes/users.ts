import express from "express"
import { UserService } from "../services/user"
import { authenticateToken } from "../middleware/auth"
import * as userController from "../controllers/userController"
import { profileUpload } from "../middleware/upload"

const router = express.Router()

// Instagram-style profile endpoints
// Temporarily commented out to debug
// router.get("/instagram/profile", authenticateToken, userController.getUserProfile)
// router.get("/instagram/profile/:username", userController.getUserByUsername)
// router.put("/instagram/profile", authenticateToken, userController.updateProfile)
// router.post("/instagram/profile/picture", authenticateToken, profileUpload, userController.updateProfilePicture)
// router.get("/instagram/profile/:userId/followers", authenticateToken, userController.getFollowers)
// router.get("/instagram/profile/:userId/following", authenticateToken, userController.getFollowing)
// router.post("/instagram/profile/:userId/follow", authenticateToken, userController.followUser)
// router.post("/instagram/profile/:userId/unfollow", authenticateToken, userController.unfollowUser)

// Search users
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { q: searchTerm, page, limit } = req.query

    if (!searchTerm || typeof searchTerm !== "string") {
      return res.status(400).json({
        success: false,
        error: "Search term is required",
      })
    }

    const result = await UserService.searchUsers(
      searchTerm,
      req.user?.userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20,
    )

    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get user profile
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const profile = await UserService.getUserProfile(userId, req.user?.userId)

    res.json({
      success: true,
      data: { user: profile },
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Follow user
router.post("/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    await UserService.followUser(req.user!.userId, userId)

    res.json({
      success: true,
      message: "User followed successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Unfollow user
router.delete("/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    await UserService.unfollowUser(req.user!.userId, userId)

    res.json({
      success: true,
      message: "User unfollowed successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get followers
router.get("/:userId/followers", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { page, limit } = req.query

    const result = await UserService.getFollowers(
      userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20,
    )

    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get following
router.get("/:userId/following", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { page, limit } = req.query

    const result = await UserService.getFollowing(
      userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20,
    )

    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get pending follow requests
router.get("/me/follow-requests", authenticateToken, async (req, res) => {
  try {
    const { page, limit } = req.query

    const result = await UserService.getPendingFollowRequests(
      req.user!.userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20,
    )

    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Accept follow request
router.post("/me/follow-requests/:followerId/accept", authenticateToken, async (req, res) => {
  try {
    const { followerId } = req.params
    await UserService.acceptFollowRequest(req.user!.userId, followerId)

    res.json({
      success: true,
      message: "Follow request accepted",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Reject follow request
router.post("/me/follow-requests/:followerId/reject", authenticateToken, async (req, res) => {
  try {
    const { followerId } = req.params
    await UserService.rejectFollowRequest(req.user!.userId, followerId)

    res.json({
      success: true,
      message: "Follow request rejected",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
