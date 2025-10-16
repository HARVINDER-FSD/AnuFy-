"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share, Bookmark, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

interface PostActionsProps {
  postId: string
  initialLikes: number
  initialComments: number
  initialLikedByUser: boolean
  initialSavedByUser: boolean
  onCommentClick: () => void
}

export function PostActions({
  postId,
  initialLikes,
  initialComments,
  initialLikedByUser = false,
  initialSavedByUser = false,
  onCommentClick
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [comments, setComments] = useState(initialComments)
  const [isLiked, setIsLiked] = useState(initialLikedByUser)
  const [isSaved, setIsSaved] = useState(initialSavedByUser)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleLike = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const token = Cookies.get('token')
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to like posts",
          variant: "destructive"
        })
        return
      }

      const newLikeStatus = !isLiked
      setIsLiked(newLikeStatus)
      setLikes(prev => newLikeStatus ? prev + 1 : prev - 1)
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ liked: newLikeStatus })
      })
      
      if (!response.ok) {
        // Revert optimistic update if request fails
        setIsLiked(!newLikeStatus)
        setLikes(prev => !newLikeStatus ? prev + 1 : prev - 1)
        throw new Error("Failed to update like status")
      }
    } catch (error) {
      console.error("Error updating like:", error)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const token = Cookies.get('token')
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to save posts",
          variant: "destructive"
        })
        return
      }

      const newSaveStatus = !isSaved
      setIsSaved(newSaveStatus)
      
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ saved: newSaveStatus })
      })
      
      if (!response.ok) {
        // Revert optimistic update if request fails
        setIsSaved(!newSaveStatus)
        throw new Error("Failed to update save status")
      }
    } catch (error) {
      console.error("Error updating save:", error)
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          text: 'I found this interesting post',
          url: `${window.location.origin}/posts/${postId}`,
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`)
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard"
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLike}
            className={isLiked ? "text-red-500" : ""}
          >
            <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCommentClick}>
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share className="h-6 w-6" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Bookmark className={`h-6 w-6 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>
      <div className="px-1">
        <p className="font-semibold">{likes} likes</p>
      </div>
    </div>
  )
}