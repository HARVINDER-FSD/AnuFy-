"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PostCard } from "@/components/posts/post-card"
import { useAuth } from "@/components/auth/auth-provider"
import { X } from "lucide-react"

interface Post {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
    verified: boolean
  }
  content: string
  caption?: string
  media_urls?: string[]
  image?: string
  video?: string
  likes: number
  comments: number
  shares: number
  timestamp: string
  created_at?: string
  liked: boolean
  bookmarked: boolean
}

interface PostGridProps {
  posts: Post[]
  onPostDeleted?: (postId: string) => void
}

export function PostGrid({ posts, onPostDeleted }: PostGridProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const { user } = useAuth()

  console.log('PostGrid rendered with posts:', posts?.length || 0)

  const handlePostClick = (post: Post) => {
    console.log('Post clicked:', post.id)
    console.log('Opening modal for post:', post)
    alert(`Click works! Post ID: ${post.id}\n\nNow trying to open modal...`)
    setSelectedPost(post)
    console.log('Selected post set')
  }

  const handleDeletePost = (postId: string) => {
    setSelectedPost(null)
    onPostDeleted?.(postId)
  }

  // Format post for PostCard component
  const formatPostForCard = (post: Post) => {
    return {
      id: post.id,
      user: post.user,
      content: post.content || post.caption || "",
      image: post.media_urls?.[0] || post.image,
      video: post.video,
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      timestamp: post.timestamp || post.created_at || "Just now",
      liked: post.liked || false,
      bookmarked: post.bookmarked || false,
      isOwner: user?.id === post.user?.id
    }
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="col-span-3 text-center py-12">
        <p className="text-muted-foreground text-lg">No posts yet</p>
        <p className="text-muted-foreground text-sm mt-2">
          Posts you create will appear here
        </p>
      </div>
    )
  }

  return (
    <>
      {/* BIG TEST BUTTON */}
      <button
        onClick={() => alert('TEST BUTTON WORKS! Clicks are working.')}
        className="w-full bg-red-500 text-white p-8 text-2xl font-bold rounded-lg mb-4 hover:bg-red-600"
      >
        🔴 CLICK ME TO TEST IF CLICKS WORK
      </button>
      
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <div
            key={post.id}
            className="aspect-square bg-muted rounded-lg cursor-pointer hover:opacity-80 transition-opacity relative group w-full"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handlePostClick(post)
            }}
            onMouseDown={(e) => {
              console.log('Mouse down on post:', post.id)
            }}
          >
            <img
              src={post.media_urls?.[0] || post.image || "/placeholder.jpg"}
              alt={post.caption || post.content || "Post"}
              className="w-full h-full object-cover rounded-lg pointer-events-none select-none"
              draggable="false"
            />
            
            {/* Hover overlay with stats - pointer-events-none so it doesn't block clicks */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4 text-white pointer-events-none">
              <div className="flex items-center gap-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                <span className="font-semibold">{post.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{post.comments || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Detail Modal - Simple Custom Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Post content */}
            <PostCard
              post={formatPostForCard(selectedPost)}
              currentUserId={user?.id}
              onDelete={handleDeletePost}
            />
          </div>
        </div>
      )}
    </>
  )
}
