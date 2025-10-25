"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Play, Volume2, VolumeX, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface Reel {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
    verified: boolean
  }
  video: string
  caption: string
  music?: {
    title: string
    artist: string
  }
  likes: number
  comments: number
  shares: number
  liked: boolean
  bookmarked: boolean
  isOwner?: boolean
}

interface ReelPlayerProps {
  reel: Reel
  isActive: boolean
  onLike?: (reelId: string) => void
  onComment?: (reelId: string) => void
  onShare?: (reelId: string) => void
  onBookmark?: (reelId: string) => void
  onDelete?: (reelId: string) => void
  currentUserId?: string
}

export function ReelPlayer({ reel, isActive, onLike, onComment, onShare, onBookmark, onDelete, currentUserId }: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true) // Must start muted due to browser autoplay policy
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isLiked, setIsLiked] = useState(reel.liked)
  const [isBookmarked, setIsBookmarked] = useState(reel.bookmarked)
  const [likesCount, setLikesCount] = useState(reel.likes)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean, count: number }>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { toast } = useToast()

  const isOwner = currentUserId === reel.user.id || reel.isOwner

  // Debug logging
  useEffect(() => {
    console.log('ReelPlayer - currentUserId:', currentUserId)
    console.log('ReelPlayer - reel.user.id:', reel.user.id)
    console.log('ReelPlayer - reel.isOwner:', reel.isOwner)
    console.log('ReelPlayer - isOwner:', isOwner)
  }, [currentUserId, reel.user.id, reel.isOwner, isOwner])

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      console.log('ReelPlayer: No video ref')
      return
    }

    console.log('ReelPlayer: isActive changed to', isActive, 'for reel', reel.id)

    if (isActive) {
      // Reset to muted when becoming active (for autoplay to work)
      video.muted = true
      setIsMuted(true)
      setHasInteracted(false)

      console.log('ReelPlayer: Attempting to play reel', reel.id)

      // Load the video first
      video.load()

      // Small delay to ensure video is ready
      const timer = setTimeout(() => {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('ReelPlayer: Successfully playing reel', reel.id)
              setIsPlaying(true)
            })
            .catch((error) => {
              console.log('ReelPlayer: Autoplay prevented for reel', reel.id, error)
              // Autoplay was prevented, try again after a short delay
              setTimeout(() => {
                video.play()
                  .then(() => {
                    console.log('ReelPlayer: Retry successful for reel', reel.id)
                    setIsPlaying(true)
                  })
                  .catch((err) => {
                    console.log('ReelPlayer: Retry failed for reel', reel.id, err)
                  })
              }, 200)
            })
        }
      }, 100)

      return () => clearTimeout(timer)
    } else {
      console.log('ReelPlayer: Pausing reel', reel.id)
      video.pause()
      video.currentTime = 0 // Reset video to start
      setIsPlaying(false)
    }
  }, [isActive, reel.id])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Handle tap on video - toggle mute instead of play/pause
  const handleVideoTap = () => {
    if (!hasInteracted) {
      // First tap: unmute the video
      setHasInteracted(true)
      if (videoRef.current) {
        videoRef.current.muted = false
        setIsMuted(false)
      }
    } else {
      // Subsequent taps: toggle mute
      toggleMute()
    }
  }

  const handleLike = () => {
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1))
    onLike?.(reel.id)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onBookmark?.(reel.id)
  }

  const fetchComments = async () => {
    setIsLoadingComments(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch(`/api/reels/${reel.id}/comment`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleCommentClick = () => {
    setShowCommentModal(true)
    fetchComments()
    onComment?.(reel.id)
  }

  const submitComment = async () => {
    if (!commentText.trim()) return

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch(`/api/reels/${reel.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ content: commentText })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setCommentText("")
        toast({
          title: "Comment added!",
          description: "Your comment has been posted.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive"
      })
    }
  }

  const likeComment = async (commentId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: {
            liked: data.liked,
            count: (prev[commentId]?.count || 0) + (data.liked ? 1 : -1)
          }
        }))
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const submitReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch(`/api/comments/${parentCommentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ content: replyText })
      })

      if (response.ok) {
        const data = await response.json()
        // Add reply to the comments list
        setComments(prev => [...prev, data.reply])
        setReplyText("")
        setReplyingTo(null)
        toast({
          title: "Reply added!",
          description: "Your reply has been posted.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reply.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch(`/api/reels/${reel.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Permission denied",
            description: "You can only delete your own reels.",
            variant: "destructive"
          })
          return
        }
        throw new Error('Failed to delete reel')
      }

      toast({
        title: "Reel deleted",
        description: "Your reel has been deleted successfully.",
      })

      onDelete?.(reel.id)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reel.",
        variant: "destructive"
      })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Video - Full screen */}
      <video
        ref={videoRef}
        src={reel.video}
        className="absolute inset-0 w-full h-full object-cover pointer-events-auto"
        loop
        muted
        playsInline
        onClick={handleVideoTap}
      />

      {/* Overlay layer for controls - prevents video from blocking */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top right controls - Custom menu that actually works */}
        <div className="absolute top-3 right-3 z-[60] pointer-events-auto">
          <button
            className="w-12 h-12 flex items-center justify-center text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation()
              console.log('Menu button clicked! Current state:', showMenu)
              setShowMenu(!showMenu)
            }}
          >
            <MoreHorizontal className="h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </button>

          {/* Custom dropdown menu */}
          {showMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-[70]"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />

              {/* Menu content */}
              <div className="absolute right-0 top-14 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-[80] overflow-hidden">
                {isOwner ? (
                  <button
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">Delete Reel</span>
                  </button>
                ) : (
                  <>
                    <button
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        toast({
                          title: "Not Interested",
                          description: "We'll show you fewer reels like this",
                        })
                      }}
                    >
                      <span className="font-medium">Not Interested</span>
                    </button>
                    <button
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        toast({
                          title: "Report Sent",
                          description: "Thank you for reporting. We'll review this content.",
                        })
                      }}
                    >
                      <span className="font-medium">Report</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom content - fully overlaid with no extra space */}
        <div className="absolute bottom-0 left-0 right-0 pb-16 z-10 pointer-events-none">
          <div className="flex items-end justify-between">
            {/* Left side - User info and caption */}
            <div className="flex-1 min-w-0 px-3 pb-3 pointer-events-auto">
              {/* User info row */}
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-9 w-9 border-2 border-white flex-shrink-0">
                  <AvatarImage src={reel.user.avatar || "/placeholder.svg"} alt={reel.user.username} />
                  <AvatarFallback>{reel.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-white font-bold text-sm truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{reel.user.username}</span>
                {reel.user.verified && (
                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-primary-foreground">✓</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 ml-auto bg-transparent border border-white text-white hover:bg-white hover:text-black font-bold"
                >
                  Follow
                </Button>
              </div>

              {/* Caption */}
              {reel.caption && (
                <p className="text-white text-sm line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{reel.caption}</p>
              )}

              {/* Music info */}
              {reel.music && (
                <div className="flex items-center gap-1 text-white text-xs mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <span>♪</span>
                  <span className="truncate">
                    {reel.music.title} - {reel.music.artist}
                  </span>
                </div>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex flex-col gap-4 pr-2 pb-3 pointer-events-auto items-center">
              <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`text-white hover:bg-transparent w-11 h-11 p-0 ${isLiked ? "text-red-500" : ""}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isLiked ? "fill-current" : ""}`} />
                </Button>
                <span className="text-white text-xs font-bold mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
                </span>
              </motion.div>

              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-transparent w-11 h-11 p-0"
                  onClick={handleCommentClick}
                >
                  <MessageCircle className="h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </Button>
                <span className="text-white text-xs font-bold mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {reel.comments > 999 ? `${(reel.comments / 1000).toFixed(1)}k` : reel.comments}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-transparent w-11 h-11 p-0"
                  onClick={() => {
                    setShowShareModal(true)
                    onShare?.(reel.id)
                  }}
                >
                  <Share className="h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </Button>
                <span className="text-white text-xs font-bold mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {reel.shares > 999 ? `${(reel.shares / 1000).toFixed(1)}k` : reel.shares}
                </span>
              </div>

              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-transparent w-11 h-11 p-0"
                  onClick={handleBookmark}
                >
                  <Bookmark className={`h-7 w-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isBookmarked ? "fill-current text-yellow-400" : ""}`} />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

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
                comments.filter(c => !c.parent_comment_id).map((comment) => (
                  <div key={comment._id || comment.id} className="space-y-2">
                    <div className="flex gap-3 pb-3 border-b">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user_avatar || "/placeholder.svg"} alt={comment.username} />
                        <AvatarFallback>{comment.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Just now'}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>

                        {/* Like and Reply buttons */}
                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => likeComment(comment._id || comment.id)}
                          >
                            <Heart className={`h-3 w-3 mr-1 ${commentLikes[comment._id || comment.id]?.liked ? 'fill-current text-red-500' : ''}`} />
                            {commentLikes[comment._id || comment.id]?.count || 0}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => setReplyingTo(comment._id || comment.id)}
                          >
                            Reply
                          </Button>
                        </div>

                        {/* Reply input */}
                        {replyingTo === (comment._id || comment.id) && (
                          <div className="flex items-center gap-2 mt-2">
                            <Textarea
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="flex-1 resize-none text-sm"
                              rows={2}
                            />
                            <div className="flex flex-col gap-1">
                              <Button
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => submitReply(comment._id || comment.id)}
                                disabled={!replyText.trim()}
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyText("")
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {comments.filter(r => r.parent_comment_id === (comment._id || comment.id)).map(reply => (
                          <div key={reply._id || reply.id} className="flex gap-2 mt-3 ml-4 pl-4 border-l-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.user_avatar || "/placeholder.svg"} alt={reply.username} />
                              <AvatarFallback>{reply.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs">{reply.username}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {reply.created_at ? formatDistanceToNow(new Date(reply.created_at), { addSuffix: true }) : 'Just now'}
                                </span>
                              </div>
                              <p className="text-xs mt-0.5">{reply.content}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-[10px] mt-1"
                                onClick={() => likeComment(reply._id || reply.id)}
                              >
                                <Heart className={`h-2.5 w-2.5 mr-1 ${commentLikes[reply._id || reply.id]?.liked ? 'fill-current text-red-500' : ''}`} />
                                {commentLikes[reply._id || reply.id]?.count || 0}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
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
              <AlertDialogTitle>Delete Reel?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your reel and remove it from our servers.
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
          contentType="post"
          contentId={reel.id}
          previewData={{
            media_url: reel.video,
            media_type: 'video',
            caption: reel.caption,
            username: reel.user.username,
            avatar: reel.user.avatar
          }}
        />
      </div>
    </div>
  )
}
