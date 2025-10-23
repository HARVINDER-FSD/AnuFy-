"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { InstagramStyleChat } from "@/components/chat/instagram-style-chat"
import { getAuthToken } from "@/lib/auth-utils"

interface Message {
  _id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: string
  created_at: string
  is_read: boolean
}

interface Conversation {
  _id: string
  participants: string[]
  otherUser?: {
    _id: string
    username: string
    full_name: string
    avatar: string
  }
}

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params?.conversationId as string
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  // Cache conversation data
  const conversationCache = useMemo(() => new Map(), []);

  // Fetch conversation details (optimized with caching)
  const fetchConversation = async () => {
    try {
      // Check cache first
      if (conversationCache.has(conversationId)) {
        setConversation(conversationCache.get(conversationId));
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch specific conversation instead of all conversations
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation data received:', data);
        
        const conv = {
          _id: data._id || conversationId,
          participants: data.participants || [],
          otherUser: data.otherUser
        };
        
        // Cache the conversation
        conversationCache.set(conversationId, conv);
        setConversation(conv);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch conversation:', response.status, errorData);
        toast({
          title: "Error",
          description: errorData.message || "Failed to load conversation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!conversation?.otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-lg font-semibold">Conversation not found</p>
        <p className="text-sm text-muted-foreground">The user may have been deleted or the conversation is invalid.</p>
        <button 
          onClick={() => router.push('/messages')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <InstagramStyleChat
      conversationId={conversationId}
      recipient={{
        id: conversation.otherUser._id,
        username: conversation.otherUser.username,
        full_name: conversation.otherUser.full_name,
        avatar: conversation.otherUser.avatar,
        followers_count: 0, // TODO: Get from user data
        posts_count: 0, // TODO: Get from user data
        bio: '' // TODO: Get from user data
      }}
      onClose={() => router.push('/messages')}
    />
  )
}