"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Play, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
    verified: boolean
  }
  content: string
  image?: string
  video?: string
  likes: number
  comments: number
  shares: number
  timestamp: string
  liked: boolean
  bookmarked: boolean
}

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onBookmark?: (postId: string) => void
}

export function PostCard({ post, onLike, onComment, onShare, onBookmark }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.liked)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked)
  const [likesCount, setLikesCount] = useState(post.likes)
  const { toast } = useToast()

  const handleLike = async () => {
    try {
      const newLikedState = !isLiked
      setIsLiked(newLikedState)
      setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1))

      // Make API call to like/unlike post with cookies for auth
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please log in to like posts",
            variant: "destructive"
          });
          // Revert state changes
          setIsLiked(!newLikedState)
          setLikesCount((prev) => (newLikedState ? prev - 1 : prev + 1))
          return;
        } else {
          throw new Error('Failed to update like status');
        }
      }
      
      const data = await response.json();
      
      // Update with accurate data from server
      setIsLiked(data.liked)
      onLike?.(post.id)

      if (data.liked) {
        toast({
          title: "Post liked!",
          description: "You liked this post.",
        })
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked)
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1))
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive"
      })
    }
  }

  const handleBookmark = async () => {
    try {
      const newBookmarkedState = !isBookmarked
      setIsBookmarked(newBookmarkedState)

      // Make API call to bookmark/unbookmark post
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) throw new Error('Failed to update bookmark status');
      
      onBookmark?.(post.id)

      toast({
        title: newBookmarkedState ? "Post saved!" : "Post removed from saved",
        description: newBookmarkedState ? "Added to your saved posts." : "Removed from your saved posts.",
      })
    } catch (error) {
      setIsBookmarked(!isBookmarked)
      toast({
        title: "Error",
        description: "Failed to update bookmark status.",
        variant: "destructive"
      })
    }
  }
  
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  
  const fetchComments = async () => {
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comment`, {
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingComments(false)
    }
  }
  
  const handleComment = () => {
    setShowCommentModal(true)
    fetchComments()
    onComment?.(post.id)
  }
  
  const submitComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      const response = await fetch(`/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText }),
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) throw new Error('Failed to add comment');
      
      const data = await response.json();
      
      // Add new comment to the list
      setComments([data.comment, ...comments]);
      setCommentText("");
      
      toast({
        title: "Comment added!",
        description: "Your comment has been added to the post.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive"
      })
    }
  }
  
  const handleShare = async () => {
    // Get token from cookies
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
      
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to share posts",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Make API call to share post with auth token
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please log in to share posts",
            variant: "destructive"
          });
          return;
        }
        throw new Error('Failed to share post');
      }
      
      onShare?.(post.id)
      
      toast({
        title: "Post shared!",
        description: "You shared this post with your followers.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share post.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.username} />
              <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{post.user.username}</span>
                {post.user.verified && (
                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground">✓</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{post.timestamp}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.image && (
          <div className="aspect-square bg-muted relative">
            <img src={post.image || "/placeholder.svg"} alt="Post content" className="w-full h-full object-cover" />
          </div>
        )}

        {post.video && (
          <div className="aspect-video bg-muted relative">
            <video src={post.video} className="w-full h-full object-cover" controls={false} poster="/placeholder.jpg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="lg" className="rounded-full w-16 h-16">
                <Play className="h-6 w-6 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleLike}>
              <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleComment}>
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleShare}>
              <Share className="h-6 w-6" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleBookmark}>
            <Bookmark className={`h-6 w-6 ${isBookmarked ? "fill-foreground" : ""}`} />
          </Button>
        </div>
    </CardContent>
    
    {/* Comment Modal */}
    <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto space-y-4 my-4">
          {isLoadingComments ? (
            <div className="text-center py-4">Loading comments...</div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id || comment.id} className="flex gap-3 pb-3 border-b">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user_avatar || comment.userAvatar || "/placeholder.svg"} alt={comment.username} />
                  <AvatarFallback>{comment.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">No comments yet. Be the first to comment!</div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Textarea 
            placeholder="Add a comment..." 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 resize-none"
            rows={2}
          />
          <Button 
            size="icon" 
            onClick={submitComment} 
            disabled={!commentText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </Card>
)
}
