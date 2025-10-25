"use client"

import { useState } from 'react'
import { FirebaseChatList } from '@/components/chat/firebase-chat-list'
import { FirebaseChat } from '@/components/chat/firebase-chat'

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string
    recipient: any
  } | null>(null)

  return (
    <div className="h-screen overflow-hidden">
      {selectedConversation ? (
        <FirebaseChat
          conversationId={selectedConversation.id}
          recipient={selectedConversation.recipient}
          onClose={() => setSelectedConversation(null)}
        />
      ) : (
        <FirebaseChatList
          onSelectConversation={(id, recipient) => 
            setSelectedConversation({ id, recipient })
          }
        />
      )}
    </div>
  )
}
