"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    profilePicture?: string
  }
}

interface PostCommentsProps {
  postId: string
}

export function PostComments({ postId }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      
      const data = await response.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: "Failed to load comments",
        description: "Please try refreshing the page",
        variant: "destructive",
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
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to post comment')
      }
      
      const data = await response.json()
      
      // Add the new comment to the list
      setComments(prev => [data.comment, ...prev])
      setNewComment("")
      
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: "Failed to post comment",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Comments</h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="flex gap-2">
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
      
      {/* Comments list */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading comments...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.profilePicture} alt={comment.user.username} />
                <AvatarFallback>{comment.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">No comments yet. Be the first to comment!</div>
        )}
      </div>
    </div>
  )
}