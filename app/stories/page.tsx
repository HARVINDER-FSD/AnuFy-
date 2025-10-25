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
  const [currentIndex, setCurrentIndex] = useState(0)
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
          const data = await response.json()
          setStories(data)
          
          // Group stories by user
          const grouped = data.reduce((acc: any, story: Story) => {
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
              setCurrentIndex(userIndex)
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
    if (currentIndex < groupedStories.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      router.push("/feed")
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleClose = () => {
    router.push("/feed")
  }

  // Format stories for StoryViewer component
  const formattedStories = groupedStories.flatMap((group: any) =>
    group.stories.map((story: Story) => ({
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
  )

  return (
    <div className="fixed inset-0 z-50">
      <StoryViewer
        stories={formattedStories}
        currentIndex={currentIndex}
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
