"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Grid3X3, Bookmark, UserPlus, Film } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { ContentGrid } from "@/components/profile/content-grid"
import ProfileManager from "@/lib/profile-manager"

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
  const [freshUserData, setFreshUserData] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout, loading } = useAuth()
  
  // Use fresh data if available, otherwise fall back to auth context
  const displayUser = freshUserData || user

  // Handler functions (defined before hooks)
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to manual redirect
      window.location.replace('/login');
    }
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

  // Load fresh user data when profile is updated
  useEffect(() => {
    if (!user) return;
    
    const fetchFreshUserData = async () => {
      try {
        // Use ProfileManager to get fresh data directly from MongoDB
        const userId = user?.id;
        if (!userId) return;
        
        const profileData = await ProfileManager.fetchProfileData(userId, true);
        if (profileData) {
          console.log('[Profile] Fetched fresh user data with ProfileManager:', profileData);
          
          // Convert to user format
          const userData = {
            id: profileData.id,
            username: profileData.username,
            name: profileData.name || '',
            email: profileData.email,
            bio: profileData.bio || '',
            avatar: profileData.avatar_url,
            followers: profileData.followers || 0,
            following: profileData.following || 0,
            verified: profileData.verified || false,
            posts_count: profileData.posts_count || 0
          };
          
          // Force update the user data
          setFreshUserData(userData);
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('profiles-cleared', { 
            detail: { timestamp: Date.now() } 
          }));
        }
      } catch (error) {
        console.error('[Profile] Error fetching fresh user data:', error);
      }
    };

    // Immediately fetch fresh data on mount
    fetchFreshUserData();

    // Listen for all profile update events
    const handleProfileUpdate = () => {
      console.log('[Profile] Profile updated event received, fetching fresh data...');
      fetchFreshUserData();
    };

    // Listen to all profile-related events
    const events = [
      'profile-updated', 
      'user-data-refreshed', 
      'invalidate-cache', 
      'force-profile-refresh', 
      'force-mongodb-refresh', 
      'cache-cleared',
      'profiles-cleared'
    ];
    
    events.forEach(event => window.addEventListener(event, handleProfileUpdate));
    
    // Set up an interval to periodically check for updates (every 30 seconds)
    const refreshInterval = setInterval(fetchFreshUserData, 30000);
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleProfileUpdate));
      clearInterval(refreshInterval);
    };
  }, [user?.username]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return;
    }
  }, [user, loading, router])

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

  // Early return AFTER all hooks
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Profile Header - Instagram Style */}
      <div className="mb-6">
        {/* Profile Info Row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
            <AvatarImage src={displayUser.avatar || "/placeholder-user.jpg"} alt={displayUser.username || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {displayUser.username ? displayUser.username.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>

          {/* Stats and Name */}
          <div className="flex-1 min-w-0">
            {/* Username */}
            <h1 className="text-xl font-semibold mb-3">{displayUser.name || displayUser.username}</h1>

            {/* Stats Row */}
            <div className="flex items-center gap-6 mb-3">
              <div className="text-center">
                <div className="font-semibold">{displayUser.posts_count || 0}</div>
                <div className="text-sm text-muted-foreground">posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{displayUser.followers || 0}</div>
                <div className="text-sm text-muted-foreground">followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{displayUser.following || 0}</div>
                <div className="text-sm text-muted-foreground">following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {displayUser.bio && (
          <p className="text-sm mb-4">{displayUser.bio}</p>
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
              navigator.clipboard.writeText(window.location.origin + '/profile/' + displayUser.username)
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
