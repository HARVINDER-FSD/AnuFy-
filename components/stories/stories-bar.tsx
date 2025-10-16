"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

interface Story {
  id: string
  user_id: string
  username: string
  full_name: string
  avatar_url: string
  is_verified: boolean
  media_url: string
  media_type: string
  created_at: string
}

export function StoriesBar() {
  const { user } = useAuth()
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load viewed stories from localStorage
    const viewed = JSON.parse(localStorage.getItem('viewedStories') || '[]')
    setViewedStories(new Set(viewed))

    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories')
        if (response.ok) {
          const data = await response.json()
          setStories(data)
        }
      } catch (error) {
        console.error('Error fetching stories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  const handleStoryClick = (storyUserId?: string) => {
    if (user) {
      if (storyUserId) {
        // Mark story as viewed
        setViewedStories(prev => new Set(prev).add(storyUserId))
        // Save to localStorage
        const viewed = JSON.parse(localStorage.getItem('viewedStories') || '[]')
        if (!viewed.includes(storyUserId)) {
          viewed.push(storyUserId)
          localStorage.setItem('viewedStories', JSON.stringify(viewed))
        }
        // Navigate to specific user's story
        window.location.href = `/stories?user=${storyUserId}`
      } else {
        // Navigate to stories page or create story
        window.location.href = '/stories'
      }
    } else {
      router.push('/login')
    }
  }

  const handleCreateStory = () => {
    if (user) {
      router.push('/stories/create')
    } else {
      router.push('/login')
    }
  }

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = {
        user_id: story.user_id,
        username: story.username,
        full_name: story.full_name,
        avatar_url: story.avatar_url,
        is_verified: story.is_verified,
        stories: []
      }
    }
    acc[story.user_id].stories.push(story)
    return acc
  }, {} as Record<string, any>)

  const userStories = Object.values(groupedStories)

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 px-2 sm:px-4 mb-2 scrollbar-hide">
      {/* Your Story / Create Story */}
      <div 
        className="flex flex-col items-center gap-1.5 md:gap-2 min-w-0 cursor-pointer flex-shrink-0"
        onClick={handleCreateStory}
      >
        <div className="relative">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 border-2 border-border">
            <AvatarImage 
              src={user?.avatar || user?.avatar_url || "/placeholder.svg"} 
              alt={user?.username || "User"} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
          </div>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground text-center w-14 sm:w-16 truncate">Your story</span>
      </div>

      {/* Other Users' Stories */}
      {loading ? (
        // Loading skeleton
        Array.from({ length: 5 }).map((_, i) => (
          <div key={`story-skeleton-${i}`} className="flex flex-col items-center gap-1.5 md:gap-2 min-w-0 flex-shrink-0">
            <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 rounded-full bg-muted animate-pulse" />
            <div className="h-2.5 sm:h-3 w-10 sm:w-12 bg-muted rounded animate-pulse" />
          </div>
        ))
      ) : (
        userStories.map((userStory: any) => {
          const isViewed = viewedStories.has(userStory.user_id)
          return (
          <div 
            key={userStory.user_id} 
            className="flex flex-col items-center gap-1.5 md:gap-2 min-w-0 cursor-pointer flex-shrink-0"
            onClick={() => handleStoryClick(userStory.user_id)}
          >
            <div className="relative">
              <Avatar className={`h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 border-2 ring-2 ${
                isViewed 
                  ? 'border-gray-400 ring-gray-400/20' 
                  : 'border-primary ring-primary/20'
              }`}>
                <AvatarImage src={userStory.avatar_url || "/placeholder.svg"} alt={userStory.username} />
                <AvatarFallback className="text-sm sm:text-base">{userStory.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {userStory.is_verified && (
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <span className="text-[8px] sm:text-[10px] text-primary-foreground">✓</span>
                </div>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground text-center truncate w-14 sm:w-16">
              {userStory.username}
            </span>
          </div>
          )
        })
      )}
    </div>
  )
}
