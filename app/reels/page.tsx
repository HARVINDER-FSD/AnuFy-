"use client"

import { useState, useEffect, useRef } from "react"
import { ReelPlayer } from "@/components/reels/reel-player"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"

// Mock reels data
const mockReels = [
  {
    id: "1",
    user: {
      id: "1",
      username: "creator_one",
      avatar: "/placeholder-user.jpg",
      verified: true,
    },
    video: "/placeholder-video.mp4",
    caption: "Check out this amazing sunset! Nature is incredible 🌅 #sunset #nature #beautiful",
    music: {
      title: "Chill Vibes",
      artist: "Lo-Fi Beats",
    },
    likes: 1250,
    comments: 89,
    shares: 45,
    liked: false,
    bookmarked: false,
  },
  {
    id: "2",
    user: {
      id: "2",
      username: "tech_guru",
      avatar: "/placeholder-user.jpg",
      verified: false,
    },
    video: "/placeholder-video.mp4",
    caption: "Quick coding tip that will save you hours! Follow for more tech content 💻 #coding #programming #tech",
    music: {
      title: "Focus Flow",
      artist: "Study Beats",
    },
    likes: 892,
    comments: 156,
    shares: 78,
    liked: true,
    bookmarked: true,
  },
  {
    id: "3",
    user: {
      id: "3",
      username: "fitness_pro",
      avatar: "/placeholder-user.jpg",
      verified: true,
    },
    video: "/placeholder-video.mp4",
    caption: "Morning workout routine to start your day right! 💪 Who's joining me? #fitness #workout #motivation",
    music: {
      title: "Pump It Up",
      artist: "Workout Mix",
    },
    likes: 2100,
    comments: 234,
    shares: 112,
    liked: false,
    bookmarked: false,
  },
]

// Function to fetch reels from API
const fetchReels = async () => {
  try {
    // Get token from cookies
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token=') || row.startsWith('client-token='))
      ?.split('=')[1]

    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch('/api/reels', { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch reels')
    }
    const data = await response.json()

    // Get current user ID from token for isOwner check
    let currentUserId = null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        currentUserId = payload.userId
      } catch (e) {
        // Token parsing failed, continue without user ID
      }
    }

    // Transform API data to match ReelPlayer component format
    const transformedReels = (data.reels || []).map((reel: any) => ({
      id: reel.id,
      user: {
        id: reel.user.id,
        username: reel.user.username,
        avatar: reel.user.avatar_url || '/placeholder-user.jpg',
        verified: reel.user.is_verified || false,
      },
      video: reel.video_url,
      caption: reel.caption || '',
      music: reel.music || null,
      likes: reel.likes_count || 0,
      comments: reel.comments_count || 0,
      shares: reel.shares_count || 0,
      liked: false,
      bookmarked: false,
      isOwner: currentUserId === reel.user.id,
    }))

    return transformedReels
  } catch (error) {
    console.error('Error fetching reels:', error)
    return []
  }
}

export default function ReelsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reels, setReels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Load initial reels
  useEffect(() => {
    const loadReels = async () => {
      try {
        setLoading(true)

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )

        const fetchedReels = await Promise.race([
          fetchReels(),
          timeoutPromise
        ]) as any[]

        if (fetchedReels && fetchedReels.length > 0) {
          setReels(fetchedReels)
          setHasMore(fetchedReels.length >= 10)
        } else {
          // Use mock data if API fails
          console.log('No reels from API, using mock data')
          setReels(mockReels)
          setHasMore(false)
        }
      } catch (error) {
        console.error("Error loading reels:", error)
        // Use mock data on error
        setReels(mockReels)
        setHasMore(false)
        toast({
          title: "Using demo content",
          description: "Showing sample reels. API connection failed.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadReels()
  }, [toast])

  // Load more reels when reaching near the end
  useEffect(() => {
    const loadMoreReels = async () => {
      if (loadingMore || !hasMore || reels.length === 0) return

      // Load more when user is 2 reels away from the end
      if (currentIndex >= reels.length - 2) {
        setLoadingMore(true)
        try {
          const nextPage = page + 1
          const moreReels = await fetchReels()

          if (moreReels.length > 0) {
            // Filter out duplicates by ID
            const existingIds = new Set(reels.map((r: any) => r.id))
            const newReels = moreReels.filter((r: any) => !existingIds.has(r.id))

            if (newReels.length > 0) {
              setReels(prev => [...prev, ...newReels])
              setPage(nextPage)
              setHasMore(moreReels.length >= 10)
            } else {
              setHasMore(false)
            }
          } else {
            setHasMore(false)
          }
        } catch (error) {
          console.error("Error loading more reels:", error)
        } finally {
          setLoadingMore(false)
        }
      }
    }

    loadMoreReels()
  }, [currentIndex, reels.length, loadingMore, hasMore, page, reels])

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(scrollTimeout)

      scrollTimeout = setTimeout(() => {
        if (containerRef.current) {
          const scrollTop = containerRef.current.scrollTop
          const itemHeight = containerRef.current.clientHeight
          const newIndex = Math.round(scrollTop / itemHeight)

          // Only update if index actually changed and is valid
          if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
            setCurrentIndex(newIndex)
          }
        }
      }, 100) // Reduced delay for faster response
    }

    const container = containerRef.current
    if (container && reels.length > 0) {
      container.addEventListener("scroll", handleScroll, { passive: true })
      return () => {
        container.removeEventListener("scroll", handleScroll)
        clearTimeout(scrollTimeout)
      }
    }
  }, [currentIndex, reels.length])

  const handleLike = async (reelId: string) => {
    // Find the current reel
    const currentReel = reels.find((r) => r.id === reelId)
    if (!currentReel) return

    // Optimistic UI update
    setReels((prev) =>
      prev.map((reel) =>
        reel.id === reelId
          ? {
            ...reel,
            liked: !reel.liked,
            likes: reel.liked ? reel.likes - 1 : reel.likes + 1,
          }
          : reel,
      ),
    )

    try {
      // Make API call
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      const response = await fetch(`/api/reels/${reelId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to update like status')
      }

      toast({
        title: currentReel.liked ? "Removed like" : "Liked!",
        description: "Your preference has been saved",
      })
    } catch (error) {
      // Revert UI on error
      setReels((prev) =>
        prev.map((reel) =>
          reel.id === reelId
            ? {
              ...reel,
              liked: currentReel.liked,
              likes: currentReel.likes,
            }
            : reel,
        ),
      )

      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleBookmark = async (reelId: string) => {
    // Find the current reel
    const currentReel = reels.find((r) => r.id === reelId)
    if (!currentReel) return

    // Optimistic UI update
    setReels((prev) =>
      prev.map((reel) => (reel.id === reelId ? { ...reel, bookmarked: !reel.bookmarked } : reel)),
    )

    try {
      // Make API call
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      const response = await fetch(`/api/reels/${reelId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to update bookmark status')
      }

      toast({
        title: currentReel.bookmarked ? "Removed from saved" : "Saved!",
        description: "Your preference has been saved",
      })
    } catch (error) {
      // Revert UI on error
      setReels((prev) =>
        prev.map((reel) =>
          reel.id === reelId ? { ...reel, bookmarked: currentReel.bookmarked } : reel
        ),
      )

      toast({
        title: "Error",
        description: "Failed to update bookmark status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleComment = async (reelId: string) => {
    // For now, just show a toast. You can implement a comment modal later
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      // Fetch comments for the reel
      const response = await fetch(`/api/reels/${reelId}/comment`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Comments",
          description: `This reel has ${data.comments?.length || 0} comments`,
        })
      } else {
        toast({
          title: "Comments",
          description: "Click to view comments (feature in development)",
        })
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: "Comments",
        description: "Comments feature available - check console for details",
      })
    }
  }

  const handleShare = async (reelId: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      const response = await fetch(`/api/reels/${reelId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          platform: 'internal',
          message: 'Check out this reel!'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to share reel')
      }

      toast({
        title: "Shared!",
        description: "Reel shared successfully",
      })
    } catch (error) {
      console.error('Error sharing reel:', error)
      toast({
        title: "Error",
        description: "Failed to share reel. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = (reelId: string) => {
    // Remove the deleted reel from the list
    setReels(prevReels => prevReels.filter(r => r.id !== reelId))

    // Adjust current index if needed
    if (currentIndex >= reels.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }

    toast({
      title: "Reel deleted",
      description: "Your reel has been removed successfully",
    })
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reels...</p>
        </div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-28 h-28 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-14 h-14 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">No Reels Yet</h2>
          <p className="text-muted-foreground mb-6">
            Be the first to create a reel! Share your moments with the world.
          </p>
          <button
            onClick={() => router.push('/create/reel')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Create Your First Reel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="h-screen w-full snap-start snap-always"
            style={{ scrollSnapAlign: "start" }}
          >
            <ReelPlayer
              reel={reel}
              isActive={index === currentIndex}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onBookmark={handleBookmark}
              onDelete={handleDelete}
              currentUserId={user?.id}
            />
          </div>
        ))}
      </div>


    </div>
  )
}
