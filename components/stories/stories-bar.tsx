"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import ProfileManager from "@/lib/profile-manager"
import MasterAPI from "@/lib/master-api"

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
        const data = await MasterAPI.Story.getStories()
        // Ensure data is an array
        if (Array.isArray(data)) {
          setStories(data)
        } else if (data && Array.isArray(data.stories)) {
          setStories(data.stories)
        } else if (data && Array.isArray(data.data)) {
          setStories(data.data)
        } else {
          console.warn('Stories data is not an array:', data)
          setStories([])
        }
      } catch (error) {
        console.error('Error fetching stories:', error)
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    // Start fetching immediately
    fetchStories()
  }, [])

  // Fetch user avatar using ProfileManager
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user) return

      try {
        // Use ProfileManager to get fresh profile data
        const profileData = await ProfileManager.getCurrentUserProfile(true);
        if (profileData?.avatar_url) {
          setUserAvatar(profileData.avatar_url);
          return;
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }

      // Fallback: try to get from user object
      const userAvatarFromAuth = user.avatar || (user as any).avatar_url || (user as any).profile_picture;
      if (userAvatarFromAuth && userAvatarFromAuth !== '/placeholder-user.jpg') {
        setUserAvatar(userAvatarFromAuth);
        return;
      }

      // Last resort: try to get from stories
      const myStoryData = stories.find(s => s.user_id === user.id);
      if (myStoryData?.avatar_url && myStoryData.avatar_url !== '/placeholder-user.jpg') {
        setUserAvatar(myStoryData.avatar_url);
      }
    }

    fetchUserAvatar();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUserAvatar();
    };

    const events = ['profile-updated', 'force-profile-refresh', 'force-mongodb-refresh'];
    events.forEach(event => {
      window.addEventListener(event, handleProfileUpdate);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleProfileUpdate);
      });
    };
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

  // Group stories by user (with safety check)
  const groupedStories = Array.isArray(stories) ? stories.reduce((acc, story) => {
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
  }, {} as Record<string, any>) : {}

  // Separate your stories from others
  const myStories = user ? Object.values(groupedStories).find((us: any) => us.user_id === user.id) : null
  const otherStories = Object.values(groupedStories).filter((us: any) => us.user_id !== user?.id)

  // Get avatar from multiple sources with priority
  // Accept any avatar including /placeholder-user.jpg (it's a valid avatar)
  let displayAvatar = '/placeholder.svg'

  if (userAvatar && userAvatar !== '') {
    displayAvatar = userAvatar
  } else if (myStories?.avatar_url) {
    displayAvatar = myStories.avatar_url
  } else if (user?.avatar) {
    displayAvatar = user.avatar
  } else if ((user as any)?.avatar_url) {
    displayAvatar = (user as any).avatar_url
  } else if ((user as any)?.profile_picture) {
    displayAvatar = (user as any).profile_picture
  }

  console.log('[StoriesBar] Final display avatar:', displayAvatar)

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development' && user && mounted) {
    console.log('StoriesBar Avatar Debug:', {
      userAvatar,
      myStoriesAvatar: myStories?.avatar_url,
      userObjectAvatar: user?.avatar,
      finalDisplayAvatar: displayAvatar
    })
  }

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
                src={displayAvatar}
                alt={user.username || "User"}
                className="object-cover"
                loading="lazy"
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
