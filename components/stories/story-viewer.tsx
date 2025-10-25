"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal, Trash2, Music, Eye, AtSign, Download, Archive, EyeOff, Link2, MessageCircleOff, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
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

interface Story {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
  }
  media: string
  type: "image" | "video"
  timestamp: string
  views: number
  liked: boolean
  isOwner?: boolean
  texts?: Array<{
    id: string
    content: string
    x: number
    y: number
    fontSize: number
    color: string
    fontFamily: string
    rotation: number
  }>
  stickers?: Array<{
    id: string
    emoji: string
    x: number
    y: number
    size: number
    rotation: number
  }>
  drawings?: Array<{
    points: Array<{ x: number, y: number }>
    color: string
    size: number
  }>
  filter?: string
  music?: string | null
}

interface StoryViewerProps {
  stories: Story[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  onDelete?: (storyId: string) => void
  currentUserId?: string
}

export function StoryViewer({ stories, currentIndex, onClose, onNext, onPrevious, onDelete, currentUserId }: StoryViewerProps) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewsModal, setShowViewsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [views, setViews] = useState<any[]>([])
  const [likes, setLikes] = useState<any[]>([])
  const [viewsTab, setViewsTab] = useState<'views' | 'likes'>('views')
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoDuration, setVideoDuration] = useState<number>(15)
  const [isMentioned, setIsMentioned] = useState(false)
  const [isReposting, setIsReposting] = useState(false)

  const currentStory = stories[currentIndex]

  // Dynamic duration: 15s for images, actual duration (max 60s) for videos
  const duration = currentStory?.type === 'video'
    ? Math.min(videoDuration * 1000, 60000) // Max 60 seconds for videos
    : 15000 // 15 seconds for images

  const isOwner = currentUserId === currentStory?.user.id || currentStory?.isOwner

  // Filters mapping
  const filters: Record<string, string> = {
    'none': '',
    'clarendon': 'contrast(1.2) saturate(1.35)',
    'gingham': 'brightness(1.05) hue-rotate(-10deg)',
    'moon': 'grayscale(1) contrast(1.1) brightness(1.1)',
    'lark': 'contrast(0.9) brightness(1.1)',
    'reyes': 'sepia(0.22) brightness(1.1) contrast(0.85)',
    'juno': 'contrast(1.2) brightness(1.1) saturate(1.4)',
    'slumber': 'saturate(0.66) brightness(1.05)',
    'crema': 'sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)',
    'ludwig': 'contrast(1.05) brightness(1.05) saturate(2)',
    'aden': 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)',
    'perpetua': 'contrast(1.1) brightness(1.25) saturate(1.1)',
  }

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onNext()
          return 0
        }
        return prev + 100 / (duration / 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPaused, onNext, duration])

  useEffect(() => {
    setProgress(0)
    setVideoDuration(15) // Reset to default
    setIsLiked(currentStory?.liked || false)

    // Record view
    if (currentStory && !isOwner) {
      recordView()
    }

    // Check if user has liked this story
    if (currentStory) {
      checkLikeStatus()
      checkIfMentioned()
    }

    // Play music if available
    if (currentStory?.music && audioRef.current) {
      let musicData: any = currentStory.music
      if (typeof currentStory.music === 'string') {
        try {
          musicData = JSON.parse(currentStory.music)
        } catch {
          musicData = null
        }
      }

      if (musicData?.previewUrl) {
        audioRef.current.src = musicData.previewUrl
        audioRef.current.volume = 0.5 // 50% volume
        audioRef.current.play().catch(err => {
          console.log('Audio autoplay prevented:', err)
        })
      }
    }

    // Cleanup: stop music when story changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [currentIndex, currentStory])

  const getToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token=') || row.startsWith('client-token='))
      ?.split('=')[1]
  }

  const recordView = async () => {
    try {
      const token = getToken()
      await fetch(`/api/stories/${currentStory.id}/views`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
    } catch (error) {
      console.error('Error recording view:', error)
    }
  }

  const checkLikeStatus = async () => {
    try {
      const token = getToken()
      const response = await fetch(`/api/stories/${currentStory.id}/like`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Check if current user is in the likes list
        const userLiked = data.likes?.some((like: any) => like.user_id === currentUserId)
        setIsLiked(userLiked || false)
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const checkIfMentioned = () => {
    // Check if current user is mentioned in this story
    const mentionStickers = currentStory?.stickers?.filter((s: any) => s.type === 'mention') || []
    // Get current user's username from localStorage or cookies
    const currentUsername = localStorage.getItem('username') ||
      document.cookie.split('username=')[1]?.split(';')[0]

    const mentioned = mentionStickers.some((s: any) =>
      s.data?.username === currentUsername || s.data?.username === `@${currentUsername}`
    )
    setIsMentioned(mentioned)
  }

  const handleRepost = async () => {
    if (isReposting) return

    setIsReposting(true)
    try {
      const token = getToken()
      const response = await fetch(`/api/stories/${currentStory.id}/repost`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast({
          title: "Story reposted!",
          description: "The story has been added to your stories"
        })
        // Optionally close viewer or navigate
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        const error = await response.json()
        toast({
          title: "Failed to repost",
          description: error.message || "Please try again",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error reposting story:', error)
      toast({
        title: "Error",
        description: "Failed to repost story",
        variant: "destructive"
      })
    } finally {
      setIsReposting(false)
    }
  }

  const fetchViewsAndLikes = async () => {
    if (!isOwner) return

    try {
      const token = getToken()

      // Fetch views
      const viewsResponse = await fetch(`/api/stories/${currentStory.id}/views`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (viewsResponse.ok) {
        const viewsData = await viewsResponse.json()
        setViews(viewsData.views || [])
      }

      // Fetch likes
      const likesResponse = await fetch(`/api/stories/${currentStory.id}/like`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (likesResponse.ok) {
        const likesData = await likesResponse.json()
        setLikes(likesData.likes || [])
      }
    } catch (error) {
      console.error('Error fetching views/likes:', error)
    }
  }

  // Render drawings on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !currentStory?.drawings || currentStory.drawings.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all paths
    currentStory.drawings.forEach(drawing => {
      if (drawing.points.length < 2) return

      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      const firstPoint = drawing.points[0]
      ctx.moveTo((firstPoint.x / 100) * canvas.width, (firstPoint.y / 100) * canvas.height)

      drawing.points.forEach(point => {
        ctx.lineTo((point.x / 100) * canvas.width, (point.y / 100) * canvas.height)
      })

      ctx.stroke()
    })
  }, [currentStory])

  const handleLike = async () => {
    try {
      const token = getToken()
      const response = await fetch(`/api/stories/${currentStory.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        toast({
          title: data.liked ? "Story liked" : "Story unliked",
          description: data.liked ? "❤️" : "",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like story",
        variant: "destructive"
      })
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return

    try {
      const token = getToken()
      const response = await fetch(`/api/stories/${currentStory.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ message: replyText.trim() })
      })

      if (response.ok) {
        toast({
          title: "Reply sent",
          description: "Your reply has been sent to the story owner",
        })
        setReplyText("")
      } else {
        throw new Error('Failed to send reply')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      })
    }
  }

  const handleViewsClick = async () => {
    if (!isOwner) return
    await fetchViewsAndLikes()
    setShowViewsModal(true)
  }

  const handleDelete = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch(`/api/stories/${currentStory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Permission denied",
            description: "You can only delete your own stories.",
            variant: "destructive"
          })
          return
        }
        throw new Error('Failed to delete story')
      }

      toast({
        title: "Story deleted",
        description: "Your story has been deleted successfully.",
      })

      onDelete?.(currentStory.id)
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete story.",
        variant: "destructive"
      })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  if (!currentStory) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        {/* Hidden audio player for music */}
        <audio ref={audioRef} loop />

        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header - Only user info */}
        <div className="absolute top-8 left-4 right-4 flex items-center z-10">
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={currentStory.user.avatar || "/placeholder.svg"} alt={currentStory.user.username} />
            <AvatarFallback>{currentStory.user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <span className="text-white font-semibold text-sm">{currentStory.user.username}</span>
            <span className="text-white/70 text-xs ml-2">{currentStory.timestamp}</span>
          </div>
        </div>

        {/* Story Content */}
        <div
          className="relative w-full h-full max-w-md mx-auto"
          onMouseDown={() => {
            setIsPaused(true)
            if (audioRef.current) audioRef.current.pause()
          }}
          onMouseUp={() => {
            setIsPaused(false)
            if (audioRef.current && currentStory?.music) audioRef.current.play().catch(() => { })
          }}
          onTouchStart={() => {
            setIsPaused(true)
            if (audioRef.current) audioRef.current.pause()
          }}
          onTouchEnd={() => {
            setIsPaused(false)
            if (audioRef.current && currentStory?.music) audioRef.current.play().catch(() => { })
          }}
        >
          {/* Media with filter */}
          {currentStory.type === "image" ? (
            <img
              src={currentStory.media || "/placeholder.svg"}
              alt="Story"
              className="w-full h-full object-contain"
              style={{ filter: currentStory.filter ? filters[currentStory.filter] : '' }}
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory.media}
              className="w-full h-full object-contain"
              style={{ filter: currentStory.filter ? filters[currentStory.filter] : '' }}
              autoPlay
              muted
              playsInline
              onLoadedMetadata={(e) => {
                const video = e.currentTarget
                // Set video duration (max 60 seconds)
                setVideoDuration(Math.min(video.duration, 60))
              }}
              onEnded={() => {
                // Auto-advance when video ends (if shorter than 60s)
                if (videoRef.current && videoRef.current.duration < 60) {
                  onNext()
                }
              }}
            />
          )}

          {/* Text overlays */}
          {currentStory.texts && currentStory.texts.map(text => (
            <div
              key={text.id}
              className="absolute select-none pointer-events-none"
              style={{
                left: `${text.x}%`,
                top: `${text.y}%`,
                transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                fontSize: `${text.fontSize}px`,
                color: text.color,
                fontFamily: text.fontFamily,
                textShadow: '2px 2px 8px rgba(0,0,0,0.9), -1px -1px 4px rgba(0,0,0,0.5)',
                padding: '8px 12px',
                maxWidth: '85%',
                wordWrap: 'break-word',
                textAlign: 'center',
                fontWeight: '700',
                letterSpacing: '0.5px',
                lineHeight: '1.3',
                zIndex: 10,
              }}
            >
              {text.content}
            </div>
          ))}

          {/* Sticker overlays */}
          {currentStory.stickers && currentStory.stickers.map(sticker => (
            <div
              key={sticker.id}
              className="absolute select-none pointer-events-none"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                fontSize: `${sticker.size}px`,
                zIndex: 10,
              }}
            >
              {sticker.emoji}
            </div>
          ))}

          {/* Drawing canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 5 }}
          />

          {/* Music indicator - Sliding Marquee */}
          {currentStory.music && (() => {
            // Parse music data (could be string or object)
            let musicData: any = currentStory.music
            if (typeof currentStory.music === 'string') {
              try {
                musicData = JSON.parse(currentStory.music)
              } catch {
                musicData = { title: currentStory.music, artist: '' }
              }
            }

            const musicTitle = musicData?.title || 'Unknown Song'
            const musicArtist = musicData?.artist || ''
            const displayText = musicArtist ? `${musicTitle} • ${musicArtist}` : musicTitle

            return (
              <div className="absolute top-16 left-4 right-4 z-10 overflow-hidden">
                <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2.5 flex items-center gap-3 shadow-lg">
                  <Music className="h-4 w-4 text-white flex-shrink-0 animate-pulse" />
                  <div className="flex-1 overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap">
                      <span className="text-white text-sm font-medium inline-block pr-8">
                        {displayText}
                      </span>
                      <span className="text-white text-sm font-medium inline-block pr-8">
                        {displayText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Navigation areas - Exclude bottom 100px for controls */}
          <div className="absolute inset-0 bottom-24 flex">
            <div className="flex-1 cursor-pointer" onClick={onPrevious} />
            <div className="flex-1 cursor-pointer" onClick={onNext} />
          </div>
        </div>

        {/* Bottom actions - Different for owner vs viewer */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe pointer-events-none">
          {isOwner ? (
            /* Owner actions: Send Story, Mention, Eye, Menu - All in one line */
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-12 w-12 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowShareModal(true)
                  }}
                >
                  <Send className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-12 w-12 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    toast({ title: "Mention", description: "Mention someone in this story" })
                  }}
                >
                  <AtSign className="h-6 w-6" />
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 flex items-center gap-1.5 h-12 px-4"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewsClick()
                  }}
                >
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-medium">{currentStory.views}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-12 w-12"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mb-2">
                    <DropdownMenuItem onClick={() => {
                      toast({ title: "Story hidden", description: "Your story is now hidden from specific users" })
                    }}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Story From
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      toast({ title: "Archived", description: "Story moved to archive" })
                    }}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Story
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (currentStory.type === 'video') {
                        toast({ title: "Downloading", description: "Video download started" })
                      } else {
                        toast({ title: "Downloading", description: "Image download started" })
                      }
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Save {currentStory.type === 'video' ? 'Video' : 'Photo'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      toast({ title: "Link copied", description: "Story link copied to clipboard" })
                    }}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      toast({ title: "Comments disabled", description: "Users can no longer reply to this story" })
                    }}>
                      <MessageCircleOff className="h-4 w-4 mr-2" />
                      Turn Off Comments
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      toast({ title: "Shared", description: "Story shared successfully" })
                    }}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Story
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            /* Viewer actions: Reply, Like, Repost (if mentioned), Menu */
            <div className="p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
              {isMentioned && (
                <div className="mb-3 flex justify-center">
                  <Button
                    onClick={handleRepost}
                    disabled={isReposting}
                    className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-2 font-semibold"
                  >
                    {isReposting ? "Reposting..." : "Add to Your Story"}
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2.5 sm:py-2">
                  <Input
                    placeholder="Reply to story..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="border-none bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0 text-sm sm:text-base h-auto py-0"
                    onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 sm:h-auto sm:w-auto p-1 sm:p-2"
                    onClick={handleReply}
                  >
                    <Send className="h-4 w-4 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-white hover:bg-white/20 h-11 w-11 sm:h-auto sm:w-auto p-2 ${isLiked ? "text-red-500" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike()
                  }}
                >
                  <Heart className={`h-6 w-6 sm:h-5 sm:w-5 ${isLiked ? "fill-current" : ""}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-11 w-11 sm:h-auto sm:w-auto p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mb-2">
                    <DropdownMenuItem onClick={() => {
                      toast({ title: "Muted", description: `You won't see ${currentStory.user.username}'s stories` })
                    }}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Mute {currentStory.user.username}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      toast({ title: "Link copied", description: "Story link copied to clipboard" })
                    }}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      Report Story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={onPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {currentIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={onNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* Views/Likes Modal */}
        {showViewsModal && isOwner && (
          <div className="absolute inset-0 z-20 bg-black/90 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex gap-4">
                  <button
                    className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${viewsTab === 'views' ? 'border-black text-black' : 'border-transparent text-gray-400'
                      }`}
                    onClick={() => setViewsTab('views')}
                  >
                    Views ({views.length})
                  </button>
                  <button
                    className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${viewsTab === 'likes' ? 'border-black text-black' : 'border-transparent text-gray-400'
                      }`}
                    onClick={() => setViewsTab('likes')}
                  >
                    Likes ({likes.length})
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewsModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {viewsTab === 'views' ? (
                  views.length > 0 ? (
                    <div className="space-y-3">
                      {views.map((view) => (
                        <div key={view.user_id} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={view.avatar_url} alt={view.username} />
                            <AvatarFallback>{view.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{view.username}</p>
                            <p className="text-xs text-gray-500">{view.full_name}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(view.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No views yet</p>
                    </div>
                  )
                ) : (
                  likes.length > 0 ? (
                    <div className="space-y-3">
                      {likes.map((like) => (
                        <div key={like.user_id} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={like.avatar_url} alt={like.username} />
                            <AvatarFallback>{like.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{like.username}</p>
                            <p className="text-xs text-gray-500">{like.full_name}</p>
                          </div>
                          <Heart className="h-5 w-5 text-red-500 fill-current" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No likes yet</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Story?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your story.
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
          contentType="story"
          contentId={currentStory.id}
          previewData={{
            media_url: currentStory.media,
            media_type: currentStory.type,
            username: currentStory.user.username,
            avatar: currentStory.user.avatar
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
