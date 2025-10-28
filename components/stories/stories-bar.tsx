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
  const [userAvatar, setUserAvatar] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  // Load viewed stories from localStorage after mount (prevents hydration error)
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const viewed = JSON.parse(localStorage.getItem('viewedStories') || '[]')
      setViewedStories(new Set(viewed))
    }
  }, [])

  useEffect(() => {
    // Fetch stories immediately with optimizations
    const fetchStories = async () => {
      try {
        // Get token for authenticated request
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token=') || row.startsWith('client-token='))
          ?.split('=')[1]

        const response = await fetch('/api/stories', {
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setStories(data)
        } else {
          console.error('Failed to fetch stories:', response.status)
        }
      } catch (error) {
        console.error('Error fetching stories:', error)
      } finally {
        setLoading(false)
      }
    }

    // Start fetching immediately
    fetchStories()
  }, [])

  // Fetch user avatar from their stories or profile
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (user) {
        console.log('StoriesBar - User object:', user)

        // Try to get avatar from user object first (check multiple possible fields)
        const userAvatar = user.avatar || (user as any).avatar_url || (user as any).profile_picture
        if (userAvatar && userAvatar !== '/placeholder-user.jpg') {
          console.log('StoriesBar - Using user avatar:', userAvatar)
          setUserAvatar(userAvatar)
          return
        }

        // If not available, fetch from profile API
        try {
          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token=') || row.startsWith('client-token='))
            ?.split('=')[1]

          console.log('StoriesBar - Fetching from /api/users/me')
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          })

          if (response.ok) {
            const profileData = await response.json()
            console.log('StoriesBar - Profile data:', profileData)
            const fetchedAvatar = profileData.avatar || profileData.avatar_url || profileData.profile_picture
            if (fetchedAvatar && fetchedAvatar !== '/placeholder-user.jpg') {
              console.log('StoriesBar - Using fetched avatar:', fetchedAvatar)
              setUserAvatar(fetchedAvatar)
              return
            }
          }
        } catch (error) {
          console.error('StoriesBar - Error fetching user avatar:', error)
        }

        // Last resort: try to get from stories
        const myStoryData = stories.find(s => s.user_id === user.id)
        if (myStoryData?.avatar_url) {
          console.log('StoriesBar - Using story avatar:', myStoryData.avatar_url)
          setUserAvatar(myStoryData.avatar_url)
        }
      }
    }

    fetchUserAvatar()
  }, [user, stories])

  const handleStoryClick = (storyUserId?: string) => {
    if (user) {
      if (storyUserId) {
        // Mark story as viewed
        setViewedStories(prev => new Set(prev).add(storyUserId))
        // Save to localStorage
        if (typeof window !== 'undefined') {
          const viewed = JSON.parse(localStorage.getItem('viewedStories') || '[]')
          if (!viewed.includes(storyUserId)) {
            viewed.push(storyUserId)
            localStorage.setItem('viewedStories', JSON.stringify(viewed))
          }
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

  // Separate your stories from others
  const myStories = user ? Object.values(groupedStories).find((us: any) => us.user_id === user.id) : null
  const otherStories = Object.values(groupedStories).filter((us: any) => us.user_id !== user?.id)

  // Get avatar from multiple sources with priority
  const myAvatar = myStories?.avatar_url ||
    userAvatar ||
    user?.avatar ||
    (user as any)?.avatar_url ||
    (user as any)?.profile_picture

  // Filter out placeholder avatars
  const displayAvatar = myAvatar && myAvatar !== '/placeholder-user.jpg' ? myAvatar : null

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 px-2 sm:px-4 mb-2 scrollbar-hide">
      {/* Your Story - Shows your stories if you have any, otherwise create button */}
      {user && (
        <div
          className="flex flex-col items-center gap-1.5 md:gap-2 min-w-0 cursor-pointer flex-shrink-0"
          onClick={() => myStories ? handleStoryClick(user.id) : handleCreateStory()}
        >
          <div className="relative">
            <Avatar className={`h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 border-2 ${myStories
              ? viewedStories.has(user.id)
                ? 'ring-2 border-gray-400 ring-gray-400/20'
                : 'ring-2 border-primary ring-primary/20'
              : 'border-border'
              }`}>
              <AvatarImage
                src={displayAvatar || "/placeholder.svg"}
                alt={user.username || "User"}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            {!myStories && (
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground text-center w-14 sm:w-16 truncate">
            {myStories ? 'Your story' : 'Add story'}
          </span>
        </div>
      )}

      {/* Other Users' Stories */}
      {loading ? (
        // Loading skeleton - reduced to 3 for faster perceived load
        Array.from({ length: 3 }).map((_, i) => (
          <div key={`story-skeleton-${i}`} className="flex flex-col items-center gap-1.5 md:gap-2 min-w-0 flex-shrink-0">
            <div className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-2.5 sm:h-3 w-10 sm:w-12 bg-muted rounded animate-pulse" />
          </div>
        ))
      ) : (
        otherStories.map((userStory: any) => {
          const isViewed = viewedStories.has(userStory.user_id)
          return (
            <div
              key={userStory.user_id}
              className="flex flex-col items-center gap-1.5 md:gap-2 min-w-0 cursor-pointer flex-shrink-0"
              onClick={() => handleStoryClick(userStory.user_id)}
            >
              <div className="relative">
                <Avatar className={`h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 border-2 ring-2 ${isViewed
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
