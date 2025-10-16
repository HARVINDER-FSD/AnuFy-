"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from 'date-fns'

interface User {
  id: string
  username: string
  avatar_url?: string
  is_verified: boolean
}

interface Post {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
    verified: boolean
  }
  content: string
  image?: string
  video?: string
  likes: number
  comments: number
  shares: number
  timestamp: string
  liked: boolean
  bookmarked: boolean
}

// Convert API post to UI post format
const mapApiPostToUiPost = (apiPost: any): Post => {
  // Extract media URL for image or video
  let image, video;
  if (apiPost.media_urls && apiPost.media_urls.length > 0) {
    if (apiPost.media_type === 'image') {
      image = apiPost.media_urls[0];
    } else if (apiPost.media_type === 'video') {
      video = apiPost.media_urls[0];
    }
  }

  return {
    id: apiPost.id,
    user: {
      id: apiPost.user.id,
      username: apiPost.user.username,
      avatar: apiPost.user.avatar_url || "/placeholder-user.jpg",
      verified: apiPost.user.is_verified || false,
    },
    content: apiPost.content || "",
    image: image,
    video: video,
    likes: apiPost.likes_count || 0,
    comments: apiPost.comments_count || 0,
    shares: apiPost.shares_count || 0,
    timestamp: formatDistanceToNow(new Date(apiPost.created_at), { addSuffix: true }),
    liked: apiPost.is_liked || false,
    bookmarked: apiPost.is_bookmarked || false,
  };
};

// Demo posts data to use as fallback
const demoPostsData = [
  {
    id: "demo-post-1",
    user: {
      id: "user-1",
      username: "johndoe",
      avatar: "/placeholder-user.jpg",
      verified: true,
    },
    content: "Just enjoying a beautiful day! #sunshine #weekend",
    image: "/placeholder.jpg",
    likes: 124,
    comments: 18,
    shares: 5,
    timestamp: "2 hours ago",
    liked: false,
    bookmarked: false,
  },
  {
    id: "demo-post-2",
    user: {
      id: "user-2",
      username: "sarahsmith",
      avatar: "/placeholder-user.jpg",
      verified: false,
    },
    content: "Check out my new photography project! What do you think?",
    image: "/placeholder.jpg",
    likes: 89,
    comments: 32,
    shares: 12,
    timestamp: "5 hours ago",
    liked: false,
    bookmarked: false,
  },
  {
    id: "demo-post-3",
    user: {
      id: "user-3",
      username: "techguru",
      avatar: "/placeholder-user.jpg",
      verified: true,
    },
    content: "Just launched my new app! Download link in bio. #tech #developer",
    image: "/placeholder.jpg",
    likes: 215,
    comments: 45,
    shares: 28,
    timestamp: "1 day ago",
    liked: false,
    bookmarked: false,
  }
];

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)

  const fetchPosts = async (skipCount = 0) => {
    try {
      setLoading(true)
      
      // Direct fetch from our new API endpoint
      const response = await fetch(`/api/posts/instagram/feed?limit=10&skip=${skipCount}`, {
        credentials: 'include', // Include cookies for authentication
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      const data = await response.json()
      
      // Map API data to UI format if posts exist
      const formattedPosts = data.posts ? data.posts.map(mapApiPostToUiPost) : []
      
      if (skipCount === 0) {
        // First load or refresh
        setPosts(formattedPosts.length > 0 ? formattedPosts : demoPostsData)
      } else {
        // Load more - append to existing posts
        setPosts(prev => [...prev, ...formattedPosts])
      }
      
      setHasMore(data.hasMore)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch posts:", err)
      // Use demo data as fallback only on initial load
      if (skipCount === 0) {
        setPosts(demoPostsData)
      }
      setError('Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load more posts
  const loadMore = () => {
    if (!loading && hasMore) {
      const newSkip = skip + 10
      setSkip(newSkip)
      fetchPosts(newSkip)
    }
  }

  // Refresh posts
  const refreshPosts = () => {
    setSkip(0)
    fetchPosts(0)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const likePost = async (postId: string) => {
    try {
      // Optimistically update UI
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: !post.liked,
                likes: post.liked ? post.likes - 1 : post.likes + 1,
              }
            : post,
        ),
      )
      
      // Send API request
      const action = posts.find(p => p.id === postId)?.liked ? 'unlike' : 'like'
      const response = await fetch(`/api/posts/${postId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        // Revert on error
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  liked: !post.liked,
                  likes: post.liked ? post.likes - 1 : post.likes + 1,
                }
              : post,
          ),
        )
        throw new Error('Failed to update like status')
      }
    } catch (err) {
      console.error('Error liking post:', err)
    }
  }

  const bookmarkPost = async (postId: string) => {
    try {
      // Optimistically update UI
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)))
      
      // Send API request
      const action = posts.find(p => p.id === postId)?.bookmarked ? 'unbookmark' : 'bookmark'
      const response = await fetch(`/api/posts/${postId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        // Revert on error
        setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)))
        throw new Error('Failed to update bookmark status')
      }
    } catch (err) {
      console.error('Error bookmarking post:', err)
    }
  }

  const sharePost = async (postId: string) => {
    try {
      // Optimistically update UI
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                shares: post.shares + 1,
              }
            : post,
        ),
      )
      
      // Send API request
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        // Revert on error
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  shares: post.shares - 1,
                }
              : post,
          ),
        )
        throw new Error('Failed to share post')
      }
    } catch (err) {
      console.error('Error sharing post:', err)
    }
  }

  const commentOnPost = async (postId: string) => {
    // This will be handled by the PostCard component's comment modal
    // No navigation needed - just trigger the modal
    console.log('Comment on post:', postId)
  }

  return {
    posts,
    loading,
    error,
    likePost,
    bookmarkPost,
    sharePost,
    commentOnPost,
  }
}
