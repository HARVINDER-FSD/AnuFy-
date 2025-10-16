"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

interface Story {
  id: string
  mediaUrl: string
  mediaType: string
  caption?: string
  createdAt: string
  expiresAt: string
  user: {
    id: string
    username: string
    avatarUrl?: string
    isVerified?: boolean
  }
}

interface StoryViewerProps {
  stories: Story[]
  initialStoryIndex?: number
  onClose: () => void
}

export function StoryViewer({ stories, initialStoryIndex = 0, onClose }: StoryViewerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  
  const currentStory = stories[currentIndex]
  
  // Auto-advance story
  useEffect(() => {
    if (!currentStory || isPaused) return
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          handleNext()
          return 0
        }
        return prev + 1
      })
    }, 50) // 5 seconds total (50ms * 100)
    
    return () => clearInterval(interval)
  }, [currentIndex, isPaused, stories.length])
  
  // Reset progress when changing stories
  useEffect(() => {
    setProgress(0)
  }, [currentIndex])
  
  // Record view
  useEffect(() => {
    if (!currentStory) return
    
    const recordView = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        await fetch(`/api/stories/${currentStory.id}/view`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
      } catch (error) {
        console.error("Error recording view:", error)
      }
    }
    
    recordView()
  }, [currentStory])
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }
  
  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onClose()
    }
  }
  
  const handlePause = () => {
    setIsPaused(!isPaused)
  }
  
  if (!currentStory) return null
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="flex gap-1">
          {stories.map((_, index) => (
            <div 
              key={index} 
              className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden"
            >
              {index === currentIndex && (
                <div 
                  className="h-full bg-white" 
                  style={{ width: `${progress}%` }}
                />
              )}
              {index < currentIndex && (
                <div className="h-full bg-white w-full" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="absolute top-12 left-4 right-4 z-10 flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-white">
          <AvatarImage 
            src={currentStory.user.avatarUrl || "/placeholder-user.jpg"} 
            alt={currentStory.user.username} 
          />
          <AvatarFallback>{currentStory.user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-white">{currentStory.user.username}</span>
            {currentStory.user.isVerified && (
              <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-gray-300">
            {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <div 
        className="w-full h-full max-w-md max-h-[80vh] relative"
        onClick={handlePause}
      >
        {currentStory.mediaType === "image" ? (
          <div className="relative w-full h-full">
            <Image
              src={currentStory.mediaUrl}
              alt="Story"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <video 
            src={currentStory.mediaUrl} 
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            loop
          />
        )}
        
        {currentStory.caption && (
          <div className="absolute bottom-8 left-4 right-4 p-4 bg-black bg-opacity-50 rounded-lg">
            <p className="text-white">{currentStory.caption}</p>
          </div>
        )}
      </div>
      
      <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start" onClick={handlePrevious}>
        {currentIndex > 0 && (
          <Button variant="ghost" size="icon" className="text-white ml-4">
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end" onClick={handleNext}>
        <Button variant="ghost" size="icon" className="text-white mr-4">
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}