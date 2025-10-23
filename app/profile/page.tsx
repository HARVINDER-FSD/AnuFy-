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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleEditProfile = () => {
    router.push('/profile/edit');
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId))
    toast({
      title: "Post deleted",
      description: "Your post has been deleted successfully.",
    })
  }

  const handleReelDeleted = (reelId: string) => {
    setReels(reels.filter(r => r.id !== reelId))
    toast({
      title: "Reel deleted",
      description: "Your reel has been deleted successfully.",
    })
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
          console.log('Fetched posts:', fetchedPosts)
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

    // TEMPORARY: Add test posts if no API data
    if (user) {
      const testPosts = [
        {
          id: 'test-1',
          user_id: user.id,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.name || user.username,
            avatar: user.avatar,
            avatar_url: user.avatar,
            is_verified: user.verified || false
          },
          caption: 'Test post 1 - Click me to open!',
          content: 'Test post 1 - Click me to open!',
          image: 'https://picsum.photos/400/400?random=1',
          media_urls: ['https://picsum.photos/400/400?random=1'],
          likes: 10,
          likes_count: 10,
          comments: 5,
          comments_count: 5,
          shares_count: 2,
          timestamp: 'Just now',
          created_at: new Date().toISOString(),
          is_liked: false,
          is_saved: false
        },
        {
          id: 'test-2',
          user_id: user.id,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.name || user.username,
            avatar: user.avatar,
            avatar_url: user.avatar,
            is_verified: user.verified || false
          },
          caption: 'Test post 2 - Click me too!',
          content: 'Test post 2 - Click me too!',
          image: 'https://picsum.photos/400/400?random=2',
          media_urls: ['https://picsum.photos/400/400?random=2'],
          likes: 20,
          likes_count: 20,
          comments: 8,
          comments_count: 8,
          shares_count: 3,
          timestamp: '1 hour ago',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          is_liked: false,
          is_saved: false
        },
        {
          id: 'test-3',
          user_id: user.id,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.name || user.username,
            avatar: user.avatar,
            avatar_url: user.avatar,
            is_verified: user.verified || false
          },
          caption: 'Test post 3 - Modal should open!',
          content: 'Test post 3 - Modal should open!',
          image: 'https://picsum.photos/400/400?random=3',
          media_urls: ['https://picsum.photos/400/400?random=3'],
          likes: 15,
          likes_count: 15,
          comments: 3,
          comments_count: 3,
          shares_count: 1,
          timestamp: '2 hours ago',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          is_liked: false,
          is_saved: false
        }
      ]
      setPosts(testPosts)
      console.log('Test posts loaded:', testPosts.length)
      
      // Add test reels if no API data
      const testReels = [
        {
          id: 'reel-1',
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            verified: user.verified || false
          },
          video: 'https://example.com/reel1.mp4',
          video_url: 'https://example.com/reel1.mp4',
          thumbnail_url: 'https://picsum.photos/400/600?random=1',
          caption: 'My first reel',
          likes: 45,
          comments: 12,
          shares: 5,
          isOwner: true
        },
        {
          id: 'reel-2',
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            verified: user.verified || false
          },
          video: 'https://example.com/reel2.mp4',
          video_url: 'https://example.com/reel2.mp4',
          thumbnail_url: 'https://picsum.photos/400/600?random=2',
          caption: 'Check out this cool effect',
          likes: 78,
          comments: 23,
          shares: 15,
          isOwner: true
        },
        {
          id: 'reel-3',
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            verified: user.verified || false
          },
          video: 'https://example.com/reel3.mp4',
          video_url: 'https://example.com/reel3.mp4',
          thumbnail_url: 'https://picsum.photos/400/600?random=3',
          caption: 'Having fun with friends',
          likes: 120,
          comments: 45,
          shares: 30,
          isOwner: true
        }
      ]
      setReels(testReels)
      console.log('Test reels loaded:', testReels.length)
      
      // Add test saved items
      const testSavedItems = [
        {
          id: 'saved-1',
          user: {
            id: 'other-user-1',
            username: 'friend1',
            avatar: 'https://picsum.photos/100/100?random=10',
            verified: true
          },
          content: 'Saved post from friend',
          image: 'https://picsum.photos/400/400?random=10',
          media_urls: ['https://picsum.photos/400/400?random=10'],
          likes: 230,
          comments: 45,
          shares: 12,
          timestamp: '3 days ago',
          liked: true,
          bookmarked: true
        },
        {
          id: 'saved-2',
          user: {
            id: 'other-user-2',
            username: 'friend2',
            avatar: 'https://picsum.photos/100/100?random=11',
            verified: false
          },
          content: 'Another saved post',
          image: 'https://picsum.photos/400/400?random=11',
          media_urls: ['https://picsum.photos/400/400?random=11'],
          likes: 120,
          comments: 18,
          shares: 5,
          timestamp: '1 week ago',
          liked: true,
          bookmarked: true
        }
      ]
      setSavedItems(testSavedItems)
      console.log('Test saved items loaded:', testSavedItems.length)
      
      // Add test tagged items
      const testTaggedItems = [
        {
          id: 'tagged-1',
          user: {
            id: 'other-user-3',
            username: 'friend3',
            avatar: 'https://picsum.photos/100/100?random=12',
            verified: false
          },
          content: `Post where ${user.username} was tagged`,
          image: 'https://picsum.photos/400/400?random=12',
          media_urls: ['https://picsum.photos/400/400?random=12'],
          likes: 85,
          comments: 12,
          shares: 3,
          timestamp: '2 days ago',
          liked: false,
          bookmarked: false
        }
      ]
      setTaggedItems(testTaggedItems)
      console.log('Test tagged items loaded:', testTaggedItems.length)
    }
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
            <Settings className="h-4 w-4" />
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
            <Grid3X3 className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="reels" className="gap-2" tabIndex={0}>
            <Film className="h-4 w-4" />
            Reels
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2" tabIndex={0}>
            <Bookmark className="h-4 w-4" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="tagged" className="gap-2" tabIndex={0}>
            <UserPlus className="h-4 w-4" />
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
          />
        </TabsContent>

        <TabsContent value="reels" className="mt-6">
          <ContentGrid 
            key="reels-grid"
            type="reels"
            items={reels} 
            currentUserId={user?.id}
            onItemDeleted={handleReelDeleted} 
          />
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <ContentGrid 
            key="saved-grid"
            type="saved"
            items={savedItems} 
            currentUserId={user?.id}
          />
        </TabsContent>

        <TabsContent value="tagged" className="mt-6">
          <ContentGrid 
            key="tagged-grid"
            type="tagged"
            items={taggedItems} 
            currentUserId={user?.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
