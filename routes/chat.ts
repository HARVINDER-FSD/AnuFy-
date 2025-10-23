import express from "express"
import { ChatService } from "../services/chat"
import { authenticateToken } from "../middleware/auth"

const router = express.Router()

// Get user conversations
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const { page, limit } = req.query

    const result = await ChatService.getUserConversations(
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

// Get or create direct conversation
router.post("/conversations/direct", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      })
    }

    const conversation = await ChatService.getOrCreateDirectConversation(req.user!.userId, userId)

    res.json({
      success: true,
      data: { conversation },
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Create group conversation
router.post("/conversations/group", authenticateToken, async (req, res) => {
  try {
    const { name, participantIds } = req.body

    if (!name || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({
        success: false,
        error: "Group name and participant IDs are required",
      })
    }

    const conversation = await ChatService.createGroupConversation(req.user!.userId, name, participantIds)

    res.status(201).json({
      success: true,
      data: { conversation },
      message: "Group conversation created successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get conversation messages
router.get("/conversations/:conversationId/messages", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page, limit } = req.query

    const result = await ChatService.getConversationMessages(
      conversationId,
      req.user!.userId,
      Number.parseInt(page as string) || 1,
      Number.parseInt(limit as string) || 50,
    )

    res.json(result)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Send message
router.post("/conversations/:conversationId/messages", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { content, media_url, media_type, message_type, reply_to_id, shared_content } = req.body

    const message = await ChatService.sendMessage(req.user!.userId, conversationId, {
      content,
      media_url,
      media_type,
      message_type: message_type || "text",
      reply_to_id,
      shared_content,
    })

    res.status(201).json({
      success: true,
      data: { message },
      message: "Message sent successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Mark messages as read
router.post("/messages/read", authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        error: "Message IDs array is required",
      })
    }

    await ChatService.markMessagesAsRead(req.user!.userId, messageIds)

    res.json({
      success: true,
      message: "Messages marked as read",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Delete message
router.delete("/messages/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params
    await ChatService.deleteMessage(messageId, req.user!.userId)

    res.json({
      success: true,
      message: "Message deleted successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Add participant to group
router.post("/conversations/:conversationId/participants", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      })
    }

    await ChatService.addParticipant(conversationId, req.user!.userId, userId)

    res.json({
      success: true,
      message: "Participant added successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Remove participant from group
router.delete("/conversations/:conversationId/participants/:userId", authenticateToken, async (req, res) => {
  try {
    const { conversationId, userId } = req.params
    await ChatService.removeParticipant(conversationId, req.user!.userId, userId)

    res.json({
      success: true,
      message: "Participant removed successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

// Leave conversation
router.post("/conversations/:conversationId/leave", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    await ChatService.leaveConversation(conversationId, req.user!.userId)

    res.json({
      success: true,
      message: "Left conversation successfully",
    })
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
