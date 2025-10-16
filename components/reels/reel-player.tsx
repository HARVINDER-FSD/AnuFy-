"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Play, Volume2, VolumeX, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

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
}

interface ReelPlayerProps {
  reel: Reel
  isActive: boolean
  onLike?: (reelId: string) => void
  onComment?: (reelId: string) => void
  onShare?: (reelId: string) => void
  onBookmark?: (reelId: string) => void
}

export function ReelPlayer({ reel, isActive, onLike, onComment, onShare, onBookmark }: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isLiked, setIsLiked] = useState(reel.liked)
  const [isBookmarked, setIsBookmarked] = useState(reel.bookmarked)
  const [likesCount, setLikesCount] = useState(reel.likes)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [commentLikes, setCommentLikes] = useState<Record<string, {liked: boolean, count: number}>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }, [isActive])

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

  return (
    <Card className="relative w-full aspect-[9/16] overflow-hidden bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 text-white ml-1" />
          </div>
        </motion.div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 w-8 h-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 w-8 h-8 p-0" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* User info and actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-end justify-between">
          {/* User info and caption */}
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={reel.user.avatar || "/placeholder.svg"} alt={reel.user.username} />
                <AvatarFallback>{reel.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold text-sm">{reel.user.username}</span>
                  {reel.user.verified && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground">✓</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 mt-1 bg-transparent border-white text-white hover:bg-white hover:text-black"
                >
                  Follow
                </Button>
              </div>
            </div>

            <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>

            {reel.music && (
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <span>♪</span>
                <span>
                  {reel.music.title} - {reel.music.artist}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-4">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col gap-1 text-white hover:bg-white/20 w-12 h-auto p-2 ${isLiked ? "text-red-500" : ""}`}
                onClick={handleLike}
              >
                <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col gap-1 text-white hover:bg-white/20 w-12 h-auto p-2"
              onClick={handleCommentClick}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">{reel.comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col gap-1 text-white hover:bg-white/20 w-12 h-auto p-2"
              onClick={() => onShare?.(reel.id)}
            >
              <Share className="h-6 w-6" />
              <span className="text-xs">{reel.shares}</span>
            </Button>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 w-12 h-12 p-0"
                onClick={handleBookmark}
              >
                <Bookmark className={`h-6 w-6 ${isBookmarked ? "fill-current text-primary" : ""}`} />
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
    </Card>
  )
}
