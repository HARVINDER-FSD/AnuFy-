"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/components/ui/use-toast"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    avatarUrl?: string
  }
}

export function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      } else {
        throw new Error("Failed to fetch comments")
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to comment",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data, ...prev])
        setNewComment("")
      } else {
        throw new Error("Failed to post comment")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-2 border-t pt-3">
      <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={!newComment.trim() || isSubmitting}
          size="sm"
        >
          Post
        </Button>
      </form>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.user.avatarUrl || "/placeholder-user.jpg"} alt={comment.user.username} />
                <AvatarFallback>{comment.user.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{comment.user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-2">No comments yet. Be the first to comment!</p>
      )}
    </div>
  )
}