"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Grid3X3, Bookmark, UserPlus, Film } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { jwtDecode } from "jwt-decode"
import { useAuth } from "@/components/auth/auth-provider"
import { ContentGrid } from "@/components/profile/content-grid"

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
  posts_count?: number;
  posts?: any[];
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved" | "tagged">("posts")
  const [posts, setPosts] = useState<any[]>([])
  const [reels, setReels] = useState<any[]>([])
  const [savedItems, setSavedItems] = useState<any[]>([])
  const [taggedItems, setTaggedItems] = useState<any[]>([])
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout, loading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return;
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to manual redirect
      window.location.replace('/login');
    }
  }

  // Don't show loading spinner, just return null to avoid double loading states
  if (!user) {
    // Don't render anything while checking auth status
    return null;
  }

  const handleEditProfile = () => {
    router.push('/profile/edit');
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
    toast({
      title: "Post deleted",
      description: "Your post has been deleted successfully.",
    })
  }

  const handleReelDeleted = (reelId: string) => {
    setReels(prev => prev.filter(reel => reel.id !== reelId))
    toast({
      title: "Reel deleted",
      description: "Your reel has been deleted successfully.",
    })
  }

  const handleLikeUpdate = (itemId: string, isLiked: boolean, likesCount: number) => {
    console.log('[Profile] Like update received:', { itemId, isLiked, likesCount })

    // Update posts if the item is a post
    setPosts(prev => prev.map(post =>
      post.id === itemId
        ? { ...post, is_liked: isLiked, liked: isLiked, likes: likesCount, likes_count: likesCount }
        : post
    ))

    // Update reels if the item is a reel
    setReels(prev => prev.map(reel =>
      reel.id === itemId
        ? { ...reel, is_liked: isLiked, liked: isLiked, likes: likesCount, likes_count: likesCount }
        : reel
    ))

    // Update saved items
    setSavedItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, is_liked: isLiked, liked: isLiked, likes: likesCount, likes_count: likesCount }
        : item
    ))

    // Update tagged items
    setTaggedItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, is_liked: isLiked, liked: isLiked, likes: likesCount, likes_count: likesCount }
        : item
    ))
  }

  // Load user posts and reels
  useEffect(() => {
    const fetchUserContent = async () => {
      if (!user?.id) return

      try {
        // Fetch user's posts
        const postsResponse = await fetch(`/api/posts/user/${user.id}`, {
          credentials: 'include'
        })
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          const fetchedPosts = postsData.posts || postsData.data || []
          console.log('[Profile] Fetched posts:', fetchedPosts)
          console.log('[Profile] First post liked status:', fetchedPosts[0]?.liked, fetchedPosts[0]?.is_liked)
          console.log('[Profile] First post likes count:', fetchedPosts[0]?.likes, fetchedPosts[0]?.likes_count)
          setPosts(fetchedPosts)
        } else {
          console.error('Failed to fetch posts:', postsResponse.status)
        }

        // Fetch user's reels
        const reelsResponse = await fetch(`/api/reels/user/${user.id}`, {
          credentials: 'include'
        })
        if (reelsResponse.ok) {
          const reelsData = await reelsResponse.json()
          setReels(reelsData.reels || reelsData.data || [])
        }

        // Fetch user's saved items
        const savedResponse = await fetch(`/api/users/${user.id}/saved`, {
          credentials: 'include'
        })
        if (savedResponse.ok) {
          const savedData = await savedResponse.json()
          setSavedItems(savedData.items || savedData.data || [])
        }

        // Fetch user's tagged items
        const taggedResponse = await fetch(`/api/users/${user.id}/tagged`, {
          credentials: 'include'
        })
        if (taggedResponse.ok) {
          const taggedData = await taggedResponse.json()
          setTaggedItems(taggedData.items || taggedData.data || [])
        }
      } catch (error) {
        console.error('Error fetching content:', error)
      }
    }

    fetchUserContent()
  }, [user])

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Profile Header - Instagram Style */}
      <div className="mb-6">
        {/* Profile Info Row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
            <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.username} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Stats and Name */}
          <div className="flex-1 min-w-0">
            {/* Username */}
            <h1 className="text-xl font-semibold mb-3">{user.name || user.username}</h1>

            {/* Stats Row */}
            <div className="flex items-center gap-6 mb-3">
              <div className="text-center">
                <div className="font-semibold">{user.posts_count || 0}</div>
                <div className="text-sm text-muted-foreground">posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{user.followers || 0}</div>
                <div className="text-sm text-muted-foreground">followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{user.following || 0}</div>
                <div className="text-sm text-muted-foreground">following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm mb-4">{user.bio}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href="/profile/edit" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Edit profile
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + '/profile/' + user.username)
              toast({ title: "Profile link copied!" })
            }}
          >
            Share profile
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs
        defaultValue="posts"
        className="w-full"
        orientation="horizontal"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "posts" | "reels" | "saved" | "tagged")}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts" className="gap-2" tabIndex={0}>
            <Grid3X3 className="h-5 w-5" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="reels" className="gap-2" tabIndex={0}>
            <Film className="h-5 w-5" />
            Reels
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2" tabIndex={0}>
            <Bookmark className="h-5 w-5" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="tagged" className="gap-2" tabIndex={0}>
            <UserPlus className="h-5 w-5" />
            Tagged
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <ContentGrid
            key="posts-grid"
            type="posts"
            items={posts}
            currentUserId={user?.id}
            onItemDeleted={handlePostDeleted}
            onLikeUpdate={handleLikeUpdate}
          />
        </TabsContent>

        <TabsContent value="reels" className="mt-6">
          <ContentGrid
            key="reels-grid"
            type="reels"
            items={reels}
            currentUserId={user?.id}
            onItemDeleted={handleReelDeleted}
            onLikeUpdate={handleLikeUpdate}
          />
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <ContentGrid
            key="saved-grid"
            type="saved"
            items={savedItems}
            currentUserId={user?.id}
            onLikeUpdate={handleLikeUpdate}
          />
        </TabsContent>

        <TabsContent value="tagged" className="mt-6">
          <ContentGrid
            key="tagged-grid"
            type="tagged"
            items={taggedItems}
            currentUserId={user?.id}
            onLikeUpdate={handleLikeUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
