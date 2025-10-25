// Helper function to start a chat with any user
import { getOrCreateConversation } from './firebase-chat'

export async function startChatWithUser(currentUserId: string, recipientId: string) {
  try {
    // Create or get existing conversation
    const conversationId = await getOrCreateConversation(currentUserId, recipientId)
    
    // Navigate to messages page with this conversation
    window.location.href = `/messages?conversation=${conversationId}&recipient=${recipientId}`
    
    return conversationId
  } catch (error) {
    console.error('Error starting chat:', error)
    throw error
  }
}
