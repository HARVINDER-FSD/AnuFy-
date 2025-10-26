"use client"

import { motion } from "framer-motion"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PostCard } from "@/components/posts/post-card"
import { StoriesBar } from "@/components/stories/stories-bar"
import { usePosts } from "@/hooks/use-posts"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth/auth-provider"

export default function FeedPage() {
  const { posts, loading, error, likePost, bookmarkPost, sharePost, commentOnPost, deletePost } = usePosts()
  const { user, loading: authLoading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, authLoading])

  // Show nothing while checking auth
  if (authLoading || !user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-4">
      {/* Stories Section */}
      <StoriesBar />

      {error && (
        <div className="p-4 mx-4 bg-red-50 text-red-800 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Posts Feed */}
      <div className="px-4 space-y-4">
        {loading && posts.length === 0
          ? // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="aspect-square w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))
          : posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PostCard
                post={post}
                onLike={likePost}
                onComment={commentOnPost}
                onShare={sharePost}
                onBookmark={bookmarkPost}
                onDelete={deletePost}
              />
            </motion.div>
          ))}
      </div>

      {/* All caught up message */}
      {!loading && posts.length > 0 && (
        <div className="px-4 text-center py-8">
          <p className="text-muted-foreground">You're all caught up!</p>
        </div>
      )}

      {posts.length === 0 && !loading && !error && (
        <div className="text-center p-8 border rounded-lg mx-4">
          <p className="text-muted-foreground">No posts yet. Create your first post!</p>
        </div>
      )}
    </div>
  )
}
