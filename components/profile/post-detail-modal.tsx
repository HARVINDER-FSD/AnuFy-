"use client"

import { useState, useEffect } from "react"
import { X, Heart, MessageCircle, Trash2, Send, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface PostDetailModalProps {
  item: any
  type: "posts" | "reels"
  currentUserId?: string
  isOpen: boolean
  onClose: () => void
  onDelete?: (itemId: string) => void
}

interface Comment {
  id: string
  content: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  created_at: string
  likes_count?: number
}

interface Like {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
    full_name?: string
  }
}

export function PostDetailModal({
  item,
  type,
  currentUserId,
  isOpen,
  onClose,
  onDelete,
}: PostDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [likes, setLikes] = useState<Like[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showLikes, setShowLikes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const isOwner = currentUserId === item?.user?.id || item?.isOwner

  useEffect(() => {
    if (isOpen && item) {
      fetchComments()
      fetchLikes()
      setIsLiked(item.liked || false)
      setLikesCount(item.likes || item.likes_count || 0)
    }
  }, [isOpen, item])

  const fetchComments = async () => {
    try {
      const endpoint = type === "reels" 
        ? `/api/reels/${item.id}/comments`
        : `/api/posts/${item.id}/comments`
      
      const response = await fetch(endpoint, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setComments(data.data?.comments || data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const fetchLikes = async () => {
    try {
      const endpoint = type === "reels"
        ? `/api/reels/${item.id}/likes`
        : `/api/posts/${item.id}/likes`
      
      const response = await fetch(endpoint, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.data?.likes || data.likes || [])
      }
    } catch (error) {
      console.error("Error fetching likes:", error)
    }
  }

  const handleLike = async () => {
    try {
      const endpoint = type === "reels"
        ? `/api/reels/${item.id}/like`
        : `/api/posts/${item.id}/like`
      
      const method = isLiked ? "DELETE" : "POST"
      
      const response = await fetch(endpoint, {
        method,
        credentials: "include",
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
        if (!isLiked) {
          fetchLikes() // Refresh likes list
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const endpoint = type === "reels"
        ? `/api/reels/${item.id}/comments`
        : `/api/posts/${item.id}/comments`
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        setNewComment("")
        fetchComments() // Refresh comments
        toast({
          title: "Comment added",
          description: "Your comment has been posted",
        })
      } else {
        throw new Error("Failed to post comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete this ${type === "reels" ? "reel" : "post"}?`)) return

    try {
      const endpoint = type === "reels"
        ? `/api/reels/${item.id}`
        : `/api/posts/${item.id}`
      
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "Deleted",
          description: `${type === "reels" ? "Reel" : "Post"} deleted successfully`,
        })
        onClose()
        if (onDelete) onDelete(item.id)
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      console.error("Error deleting:", error)
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      })
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return timestamp
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Media Section */}
        <div className="w-full md:w-3/5 bg-black flex items-center justify-center">
          {type === "reels" ? (
            <video
              src={item.video_url || item.video}
              controls
              autoPlay
              loop
              className="w-full h-full max-h-[90vh] object-contain"
            />
          ) : (
            <img
              src={item.image || item.media_urls?.[0] || "/placeholder-image.jpg"}
              alt={item.caption || item.content || "Post"}
              className="w-full h-full max-h-[90vh] object-contain"
            />
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-2/5 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.user?.avatar || "/placeholder-user.jpg"} />
                <AvatarFallback>
                  {item.user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{item.user?.username || "User"}</p>
                {item.location && (
                  <p className="text-xs text-muted-foreground">{item.location}</p>
                )}
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Caption */}
          {(item.caption || item.content) && (
            <div className="p-4 border-b dark:border-gray-800">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.user?.avatar || "/placeholder-user.jpg"} />
                  <AvatarFallback>
                    {item.user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold mr-2">{item.user?.username}</span>
                    {item.caption || item.content}
                  </p>
                  {item.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <ScrollArea className="flex-1 p-4">
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user?.avatar || "/placeholder-user.jpg"} />
                      <AvatarFallback>
                        {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold mr-2">{comment.user?.username}</span>
                        {comment.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(comment.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs">Be the first to comment</p>
              </div>
            )}
          </ScrollArea>

          {/* Actions Section */}
          <div className="border-t dark:border-gray-800 p-4 space-y-3">
            {/* Like and Comment buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <Heart
                  className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                />
              </button>
              <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <MessageCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Likes count */}
            <div>
              <button
                onClick={() => setShowLikes(!showLikes)}
                className="font-semibold text-sm hover:opacity-70 transition-opacity"
              >
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </button>
              
              {/* Likes list */}
              {showLikes && likes.length > 0 && (
                <div className="mt-2 p-3 bg-muted rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold mb-2">Liked by</p>
                  {likes.map((like) => (
                    <div key={like.id} className="flex items-center gap-2 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={like.user?.avatar || "/placeholder-user.jpg"} />
                        <AvatarFallback>
                          {like.user?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{like.user?.username}</span>
                      {like.user?.full_name && (
                        <span className="text-xs text-muted-foreground">
                          {like.user.full_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timestamp */}
            {item.timestamp && (
              <p className="text-xs text-muted-foreground uppercase">
                {formatTimestamp(item.timestamp)}
              </p>
            )}

            {/* Add comment */}
            <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-800">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
