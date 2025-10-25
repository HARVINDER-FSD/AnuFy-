"use client"

import { useState, useRef } from "react"
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Play, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShareModal } from "@/components/share/share-modal"

// Global lock to prevent multiple simultaneous like requests
const globalLikeLocks = new Map<string, boolean>()

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
  isOwner?: boolean
  likedByFriends?: string[]
}

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onBookmark?: (postId: string) => void
  onDelete?: (postId: string) => void
  currentUserId?: string
}

export function PostCard({ post, onLike, onComment, onShare, onBookmark, onDelete, currentUserId }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.liked)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [likedByUsers, setLikedByUsers] = useState<string[]>(post.likedByFriends || [])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMenu, setShowMenu] = useState(false) // Simple menu state
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLikeDisabled, setIsLikeDisabled] = useState(false)
  const isLikingRef = useRef(false)
  const { toast } = useToast()

  const isOwner = currentUserId === post.user.id || post.isOwner

  const handleLike = async () => {
    // CRITICAL: Check global lock FIRST before any logging
    // This prevents Fast Refresh from triggering duplicate requests
    if (globalLikeLocks.get(post.id)) {
      return // Silently block if already processing
    }

    const clickTime = new Date().toISOString()
    const clickId = Math.random().toString(36).substring(7)

    console.log(`[PostCard ${clickId}] handleLike called at ${clickTime}`)
    console.log(`[PostCard ${clickId}] Post ID:`, post.id)

    // Check ALL locks and disabled state
    if (isLikingRef.current || isLikeDisabled) {
      console.log(`[PostCard ${clickId}] BLOCKED - lock is active or button disabled`)
      return
    }

    // Acquire ALL locks and disable button
    isLikingRef.current = true
    globalLikeLocks.set(post.id, true)
    setIsLikeDisabled(true)
    console.log(`[PostCard ${clickId}] All locks acquired, button disabled, proceeding with API call`)

    const previousLiked = isLiked
    const previousCount = likesCount

    try {
      // Optimistic update
      setIsLiked(!isLiked)
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1)

      // API call
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed')

      const data = await response.json()

      console.log('[PostCard] API response:', data)
      console.log('[PostCard] Setting isLiked to:', data.liked)

      // Update with server data
      setIsLiked(data.liked)
      setLikesCount(data.likeCount)
      setLikedByUsers(data.likedBy || [])

      onLike?.(post.id)
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      })
    } finally {
      // Release locks and re-enable button after delay (10 seconds to absolutely prevent double-clicks)
      setTimeout(() => {
        isLikingRef.current = false
        globalLikeLocks.delete(post.id)
        setIsLikeDisabled(false)
        console.log(`[PostCard] All locks released and button re-enabled for post ${post.id}`)
      }, 10000)
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

  const handleShare = () => {
    // Open share modal to select users
    setShowShareModal(true)
  }

  const handleShareSuccess = () => {
    // Called when share is successful
    onShare?.(post.id)
    toast({
      title: "Post shared!",
      description: "You shared this post successfully.",
    })
  }

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token') ||
        document.cookie.split('; ').find(row => row.startsWith('client-token='))?.split('=')[1];

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Permission denied",
            description: "You can only delete your own posts.",
            variant: "destructive"
          })
          return
        }
        throw new Error('Failed to delete post')
      }

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      })

      onDelete?.(post.id)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive"
      })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <Card className="overflow-hidden border-0 md:border rounded-none md:rounded-lg shadow-none md:shadow-sm">
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

          {/* Simple Dropdown Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 py-1">
                  {isOwner && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => {
                        setShowMenu(false)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Post
                    </button>
                  )}
                  {!isOwner && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setShowMenu(false)
                        toast({
                          title: "Report",
                          description: "Report functionality coming soon",
                        })
                      }}
                    >
                      Report Post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.image && (
          <div className="aspect-square bg-muted relative">
            <img src={post.image || "/placeholder.svg"} alt="Post content" className="w-full h-full object-contain" />
          </div>
        )}

        {post.video && (
          <div className="aspect-video bg-muted relative">
            <video src={post.video} className="w-full h-full object-contain" controls={false} poster="/placeholder.jpg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="lg" className="rounded-full w-16 h-16">
                <Play className="h-6 w-6 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="flex flex-col px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={handleLike}
                disabled={isLikeDisabled}
              >
                <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleComment}>
                <MessageCircle className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleShare}>
                <Share className="h-6 w-6" />
              </Button>
              {isOwner && (
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-500" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-6 w-6" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleBookmark}>
              <Bookmark className={`h-6 w-6 ${isBookmarked ? "fill-foreground" : ""}`} />
            </Button>
          </div>

          {/* Counts display */}
          <div className="mt-2 px-1 space-y-1">
            <p className="font-semibold text-sm">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</p>
            {likedByUsers && likedByUsers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Liked by <span className="font-semibold text-foreground">{likedByUsers[0]}</span>
                {likedByUsers.length > 1 && <span> and <span className="font-semibold text-foreground">{likedByUsers.length - 1} {likedByUsers.length === 2 ? 'other' : 'others'}</span></span>}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{post.comments} comments • {post.shares} shares</p>
          </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSuccess={handleShareSuccess}
        contentType="post"
        contentId={post.id}
        previewData={{
          media_url: post.image || post.video,
          media_type: post.image ? 'image' : 'video',
          caption: post.content,
          username: post.user.username,
          avatar: post.user.avatar
        }}
      />
    </Card>
  )
}
