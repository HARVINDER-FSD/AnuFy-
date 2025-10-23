import express from "express"
import { StorageService, uploadSingle, uploadMultiple, uploadAvatar, uploadStory, uploadReel } from "../lib/storage"
import { authenticateToken } from "../middleware/auth"

const router = express.Router()

// Upload single file
router.post("/single", authenticateToken, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      })
    }

    const { folder = "posts" } = req.body

    const result = await StorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user!.userId,
      folder,
    )

    res.json({
      success: true,
      data: result,
      message: "File uploaded successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Upload multiple files
router.post("/multiple", authenticateToken, uploadMultiple, async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded",
      })
    }

    const { folder = "posts" } = req.body

    const results = await StorageService.uploadMultipleFiles(req.files, req.user!.userId, folder)

    res.json({
      success: true,
      data: { files: results },
      message: "Files uploaded successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Upload avatar
router.post("/avatar", authenticateToken, uploadAvatar, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No avatar file uploaded",
      })
    }

    const result = await StorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user!.userId,
      "avatars",
    )

    res.json({
      success: true,
      data: result,
      message: "Avatar uploaded successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Upload story
router.post("/story", authenticateToken, uploadStory, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No story file uploaded",
      })
    }

    const result = await StorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user!.userId,
      "stories",
    )

    res.json({
      success: true,
      data: result,
      message: "Story media uploaded successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Upload reel
router.post("/reel", authenticateToken, uploadReel, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No reel file uploaded",
      })
    }

    const result = await StorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user!.userId,
      "reels",
    )

    res.json({
      success: true,
      data: result,
      message: "Reel uploaded successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Generate presigned URL for direct upload
router.post("/presigned-url", authenticateToken, async (req, res) => {
  try {
    const { fileName, contentType, folder = "posts" } = req.body

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        error: "fileName and contentType are required",
      })
    }

    const key = `${folder}/${req.user!.userId}/${Date.now()}_${fileName}`
    const presignedUrl = StorageService.generatePresignedUrl(key, contentType)

    res.json({
      success: true,
      data: {
        presignedUrl,
        key,
        uploadUrl: presignedUrl,
      },
      message: "Presigned URL generated successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Delete file
router.delete("/:key(*)", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params

    // Verify the file belongs to the user
    if (!key.includes(req.user!.userId)) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own files",
      })
    }

    await StorageService.deleteFile(key)

    res.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
