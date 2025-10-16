import { moderationQueue } from "../lib/queue"
import { moderationService } from "../services/moderation"
import { notificationService } from "../services/notification"

// Process moderation jobs
moderationQueue.process("content-moderation", 10, async (job) => {
  const { contentId, contentType, content, mediaUrls } = job.data

  try {
    const result = await moderationService.moderateContent(contentId, contentType, content, mediaUrls)

    // Update job progress
    job.progress(100)

    return result
  } catch (error) {
    console.error("Error processing moderation job:", error)
    throw error
  }
})

// Process human review jobs
moderationQueue.process("human-review", 5, async (job) => {
  const { contentId, contentType, moderationResult } = job.data

  try {
    // Notify moderators about content requiring review
    await notificationService.notifyModerators({
      type: "content_review_required",
      content_id: contentId,
      content_type: contentType,
      confidence: moderationResult.confidence,
      reasons: moderationResult.reasons,
    })

    job.progress(100)
    return { notified: true }
  } catch (error) {
    console.error("Error processing human review job:", error)
    throw error
  }
})

// Process batch moderation jobs
moderationQueue.process("batch-moderation", 2, async (job) => {
  const { contentItems } = job.data
  const results = []

  try {
    for (let i = 0; i < contentItems.length; i++) {
      const item = contentItems[i]
      const result = await moderationService.moderateContent(
        item.contentId,
        item.contentType,
        item.content,
        item.mediaUrls,
      )

      results.push(result)

      // Update progress
      job.progress(Math.round(((i + 1) / contentItems.length) * 100))
    }

    return { processed: results.length, results }
  } catch (error) {
    console.error("Error processing batch moderation job:", error)
    throw error
  }
})

console.log("Moderation worker started")
