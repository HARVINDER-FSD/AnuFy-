"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
}

interface StoryViewerProps {
  stories: Story[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export function StoryViewer({ stories, currentIndex, onClose, onNext, onPrevious }: StoryViewerProps) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isLiked, setIsLiked] = useState(false)

  const currentStory = stories[currentIndex]
  const duration = 5000 // 5 seconds per story

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
    setIsLiked(currentStory?.liked || false)
  }, [currentIndex, currentStory])

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleReply = () => {
    if (replyText.trim()) {
      // Send reply logic here
      setReplyText("")
    }
  }

  if (!currentStory) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
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

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={currentStory.user.avatar || "/placeholder.svg"} alt={currentStory.user.username} />
              <AvatarFallback>{currentStory.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-white font-semibold text-sm">{currentStory.user.username}</span>
              <span className="text-white/70 text-xs ml-2">{currentStory.timestamp}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Story Content */}
        <div
          className="relative w-full h-full max-w-md mx-auto"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.type === "image" ? (
            <img src={currentStory.media || "/placeholder.svg"} alt="Story" className="w-full h-full object-cover" />
          ) : (
            <video src={currentStory.media} className="w-full h-full object-cover" autoPlay muted loop />
          )}

          {/* Navigation areas */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 cursor-pointer" onClick={onPrevious} />
            <div className="flex-1 cursor-pointer" onClick={onNext} />
          </div>
        </div>

        {/* Bottom actions */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Input
                placeholder="Reply to story..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="border-none bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0"
                onKeyPress={(e) => e.key === "Enter" && handleReply()}
              />
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={handleReply}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className={`text-white hover:bg-white/20 ${isLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            </Button>
          </div>
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
      </motion.div>
    </AnimatePresence>
  )
}
