"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { StoryViewer } from "@/components/stories/story-viewer"
import { useAuth } from "@/components/auth/auth-provider"

interface Story {
  id: string
  user_id: string
  username: string
  full_name: string
  avatar_url: string
  is_verified: boolean
  media_url: string
  media_type: string
  caption: string
  created_at: string
  views_count: number
  texts?: any[]
  stickers?: any[]
  drawings?: any[]
  filter?: string
  music?: string | null
}

function StoriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [stories, setStories] = useState<Story[]>([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [groupedStories, setGroupedStories] = useState<any[]>([])

  // Get user ID from URL params if viewing specific user's stories
  const viewingUserId = searchParams.get('user')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories')
        if (response.ok) {
          const result = await response.json()
          // Backend returns { success: true, data: [...] }
          const storiesArray = result?.success && Array.isArray(result.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : []

          setStories(storiesArray)

          // Group stories by user
          const grouped = storiesArray.reduce((acc: any, story: Story) => {
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
          }, {})

          const groupedArray = Object.values(grouped)
          setGroupedStories(groupedArray)

          // If viewing specific user, find their index
          if (viewingUserId) {
            const userIndex = groupedArray.findIndex((g: any) => g.user_id === viewingUserId)
            if (userIndex !== -1) {
              setCurrentUserIndex(userIndex)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching stories:', error)
      } finally {
        setLoadingStories(false)
      }
    }

    if (user) {
      fetchStories()
    }
  }, [user, viewingUserId])

  // Show loading while checking authentication
  if (loading || loadingStories) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Loading stories...
      </div>
    )
  }

  // If user not authenticated
  if (!user) return null

  // If no stories available
  if (groupedStories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground mb-4">No stories available</p>
        <button
          onClick={() => router.push("/feed")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Back to Feed
        </button>
      </div>
    )
  }

  // Story navigation handlers
  const handleNext = () => {
    const currentGroup = groupedStories[currentUserIndex]
    if (!currentGroup) return

    // Check if there are more stories in current user's group
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      // Move to next story of same user
      setCurrentStoryIndex(currentStoryIndex + 1)
    } else {
      // Finished current user's stories, move to next user
      if (currentUserIndex < groupedStories.length - 1) {
        setCurrentUserIndex(currentUserIndex + 1)
        setCurrentStoryIndex(0)
      } else {
        // Finished all stories, return to feed
        router.push("/feed")
      }
    }
  }

  const handlePrevious = () => {
    // Check if there are previous stories in current user's group
    if (currentStoryIndex > 0) {
      // Move to previous story of same user
      setCurrentStoryIndex(currentStoryIndex - 1)
    } else {
      // At first story of current user, move to previous user's last story
      if (currentUserIndex > 0) {
        const prevUserIndex = currentUserIndex - 1
        const prevGroup = groupedStories[prevUserIndex]
        setCurrentUserIndex(prevUserIndex)
        setCurrentStoryIndex(prevGroup.stories.length - 1)
      }
      // If already at first user's first story, do nothing
    }
  }

  const handleClose = () => {
    router.push("/feed")
  }

  // Get current user's stories
  const currentGroup = groupedStories[currentUserIndex]
  if (!currentGroup) return null

  // Format current user's stories for StoryViewer component
  const formattedStories = currentGroup.stories.map((story: Story) => ({
    id: story.id,
    user: {
      id: story.user_id,
      username: story.username,
      avatar: story.avatar_url,
    },
    media: story.media_url,
    type: story.media_type as "image" | "video",
    timestamp: new Date(story.created_at).toLocaleString(),
    views: story.views_count,
    liked: false,
    caption: story.caption,
    texts: story.texts || [],
    stickers: story.stickers || [],
    drawings: story.drawings || [],
    filter: story.filter || 'none',
    music: story.music || null,
    isOwner: story.user_id === user?.id
  }))

  return (
    <div className="fixed inset-0 z-50">
      <StoryViewer
        stories={formattedStories}
        currentIndex={currentStoryIndex}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onClose={handleClose}
        currentUserId={user?.id}
      />
    </div>
  )
}

export default function StoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Loading stories...
      </div>
    }>
      <StoriesContent />
    </Suspense>
  )
}
