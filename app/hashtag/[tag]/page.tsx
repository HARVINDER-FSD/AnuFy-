"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Grid3x3, Play } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Post {
  _id: string
  caption: string
  media_urls: string[]
  likes_count: number
  comments_count: number
  user: {
    _id: string
    username: string
    avatar_url: string
  }
}

interface Reel {
  _id: string
  caption: string
  video_url: string
  thumbnail_url: string
  likes_count: number
  views_count: number
  user: {
    _id: string
    username: string
    avatar_url: string
  }
}

export default function HashtagPage() {
  const params = useParams()
  const router = useRouter()
  const tag = params?.tag as string
  const [posts, setPosts] = useState<Post[]>([])
  const [reels, setReels] = useState<Reel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (tag) {
      fetchHashtagContent()
    }
  }, [tag])

  const fetchHashtagContent = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      // Fetch posts with this hashtag
      const postsResponse = await fetch(`/api/search/advanced?q=${encodeURIComponent('#' + tag)}&type=posts&limit=50`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        setPosts(postsData.posts || [])
      }

      // Fetch reels with this hashtag
      const reelsResponse = await fetch(`/api/search/advanced?q=${encodeURIComponent('#' + tag)}&type=reels&limit=50`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (reelsResponse.ok) {
        const reelsData = await reelsResponse.json()
        setReels(reelsData.reels || [])
      }

      setTotalCount((postsData?.posts?.length || 0) + (reelsData?.reels?.length || 0))
    } catch (error) {
      console.error('Error fetching hashtag content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">#{tag}</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${totalCount} ${totalCount === 1 ? 'post' : 'posts'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-12">
            <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              Be the first to post with #{tag}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="posts" className="flex-1">
                <Grid3x3 className="h-4 w-4 mr-2" />
                Posts ({posts.length})
              </TabsTrigger>
              <TabsTrigger value="reels" className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Reels ({reels.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <button
                    key={post._id}
                    onClick={() => router.push(`/feed`)}
                    className="aspect-square relative group overflow-hidden rounded"
                  >
                    <img
                      src={post.media_urls[0] || '/placeholder.svg'}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <span className="flex items-center gap-1">
                        ❤️ {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {post.comments_count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reels" className="mt-4">
              <div className="grid grid-cols-3 gap-1">
                {reels.map((reel) => (
                  <button
                    key={reel._id}
                    onClick={() => router.push(`/reels`)}
                    className="aspect-[9/16] relative group overflow-hidden rounded"
                  >
                    <img
                      src={reel.thumbnail_url || '/placeholder.svg'}
                      alt={reel.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Play className="h-5 w-5 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <span className="flex items-center gap-1">
                        ❤️ {reel.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        👁️ {reel.views_count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
