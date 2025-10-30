"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Settings, Grid3X3, Bookmark, UserPlus, Lock, X, Search, Heart, MessageCircle, Send, Film } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { InstagramPostModal } from "@/components/profile/instagram-post-modal"
import { PostCard } from "@/components/posts/post-card"

interface UserProfile {
  id: string
  username: string
  full_name: string
  avatar: string
  bio: string
  website: string
  is_verified: boolean
  is_private: boolean
  posts_count: number
  followers_count: number
  following_count: number
  is_following: boolean
  is_own_profile: boolean
  posts: any[]
  reels?: any[]
  reels_count?: number
}

export default function UserProfilePage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [followersSearch, setFollowersSearch] = useState("")
  const [followingSearch, setFollowingSearch] = useState("")
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [reels, setReels] = useState<any[]>([])
  const [loadingReels, setLoadingReels] = useState(false)
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({})
  
  // Handle like updates from PostCard or ContentGrid
  const handleLikeUpdate = (itemId: string, isLiked: boolean, likesCount: number) => {
    // Update the liked status in local state
    setLikedItems(prev => ({
      ...prev,
      [itemId]: isLiked
    }))
    
    // Update posts if the liked item is a post
    if (profile?.posts) {
      setProfile(prev => {
        if (!prev) return prev
        return {
          ...prev,
          posts: prev.posts.map(post => 
            post.id === itemId 
              ? { 
                  ...post, 
                  is_liked: isLiked,
                  liked: isLiked,
                  likes: likesCount,
                  likes_count: likesCount
                }
              : post
          )
        }
      })
    }
    
    // Update reels if the liked item is a reel
    setReels(prev => 
      prev.map(reel => 
        reel.id === itemId 
          ? { 
              ...reel, 
              is_liked: isLiked,
              liked: isLiked,
              likes: likesCount,
              likes_count: likesCount
            }
          : reel
      )
    )
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching profile for username:", username);

        // Get token from cookies or localStorage for authentication
        let token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('client-token='))
          ?.split('=')[1];

        // Fallback to localStorage if not found in cookies
        if (!token) {
          token = localStorage.getItem('token') || undefined;
        }

        console.log("Token found:", token ? "Yes" : "No");

        const response = await fetch(`/api/users/${username}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log("Error response:", errorData);
          throw new Error(`Failed to fetch profile: ${errorData.message || response.statusText}`)
        }
        const data = await response.json()
        console.log("Profile data received:", data);
        setProfile(data)
        setIsFollowing(data.is_following)
        setIsPending(data.is_pending || false)
        
        // Initialize likedItems state from posts data to ensure persistence after refresh
        if (data.posts && data.posts.length > 0) {
          const initialLikedState: Record<string, boolean> = {};
          data.posts.forEach((post: any) => {
            initialLikedState[post.id] = post.is_liked || false;
          });
          setLikedItems(initialLikedState);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      fetchProfile()
    }
  }, [username, toast])

  const handleFollow = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      // Get token from cookies for authentication
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`/api/users/${profile?.id}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to follow/unfollow user')
      }

      const data = await response.json()
      setIsFollowing(data.is_following)
      setIsPending(data.is_pending || false)

      // Update follower count (only if actually following, not pending)
      setProfile(prev => {
        if (!prev) return prev
        return {
          ...prev,
          followers_count: data.is_following
            ? prev.followers_count + 1
            : (isFollowing && !data.is_following)
              ? prev.followers_count - 1
              : prev.followers_count,
          is_following: data.is_following
        }
      })

      toast({
        title: data.is_pending ? "Request sent" : data.is_following ? "Following" : "Unfollowed",
        description: data.message,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    }
  }

  const fetchFollowers = async () => {
    if (!profile) return
    setLoadingFollowers(true)
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('client-token=') || c.trim().startsWith('token='))
        ?.split('=')[1]

      const response = await fetch(`/api/users/${profile.id}/followers`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (response.ok) {
        const data = await response.json()
        setFollowers(data.followers || [])
      }
    } catch (error) {
      console.error('Error fetching followers:', error)
    } finally {
      setLoadingFollowers(false)
    }
  }

  const fetchFollowing = async () => {
    if (!profile) return
    setLoadingFollowing(true)
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('client-token=') || c.trim().startsWith('token='))
        ?.split('=')[1]

      const response = await fetch(`/api/users/${profile.id}/following`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (response.ok) {
        const data = await response.json()
        setFollowing(data.following || [])
      } else {
        const errorData = await response.json();
        console.error('Error fetching following:', errorData);
        toast({
          title: "Error",
          description: "Failed to fetch following",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching following:', error)
      toast({
        title: "Error",
        description: "Failed to fetch following",
        variant: "destructive",
      })
    } finally {
      setLoadingFollowing(false)
    }
  }

  const fetchReels = async () => {
    if (!profile) {
      console.log('Cannot fetch reels: profile not loaded')
      return
    }

    console.log('Fetching reels for user:', profile.id)
    setLoadingReels(true)
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('client-token=') || c.trim().startsWith('token='))
        ?.split('=')[1]

      console.log('Token for reels fetch:', token ? 'Found' : 'Not found')

      const response = await fetch(`/api/reels/user/${profile.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      console.log('Reels fetch response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Reels data received:', data)
        const reelsData = data.reels || data.data || []
        setReels(reelsData)
        
        // Update likedItems state with reels like status
        if (reelsData.length > 0) {
          setLikedItems(prev => {
            const updatedLikedItems = {...prev}
            reelsData.forEach((reel: any) => {
              updatedLikedItems[reel.id] = reel.is_liked || false
            })
            return updatedLikedItems
          })
        }
      } else {
        const errorData = await response.json()
        console.error('Error fetching reels:', errorData)
        toast({
          title: "Error",
          description: "Failed to load reels",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching reels:', error)
      toast({
        title: "Error",
        description: "Failed to load reels",
        variant: "destructive",
      })
    } finally {
      setLoadingReels(false)
    }
  }

  // Auto-fetch reels when profile loads
  useEffect(() => {
    if (profile && profile.id) {
      console.log('useEffect triggered - fetching reels for profile:', profile.id)
      fetchReels()
    }
  }, [profile?.id])

  // Handle post click to open modal
  const handlePostClick = (post: any) => {
    // Ensure the post has the latest like status from our state
    const updatedPost = {
      ...post,
      is_liked: likedItems[post.id] !== undefined ? likedItems[post.id] : (post.is_liked || false),
      liked: likedItems[post.id] !== undefined ? likedItems[post.id] : (post.is_liked || false)
    }
    setSelectedPost(updatedPost)
    setShowPostModal(true)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!profile) {
    return <div className="flex justify-center items-center h-screen">User not found</div>
  }

  const canViewPosts = !profile.is_private || profile.is_following || profile.is_own_profile

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">{profile.username}</h2>
        {profile.is_own_profile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-4 py-4">
        {/* Profile Header - Instagram Style */}
        <div className="mb-6">
          {/* Profile Info Row */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
              <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Stats and Name */}
            <div className="flex-1 min-w-0">
              {/* Username with badges */}
              <div className="flex items-center gap-2 mb-3">
                <h1 className="text-xl font-semibold">{profile.full_name || profile.username}</h1>
                {profile.is_verified && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground">✓</span>
                  </div>
                )}
                {profile.is_private && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="font-semibold">{profile.posts_count || 0}</div>
                  <div className="text-sm text-muted-foreground">posts</div>
                </div>
                <div
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => {
                    setShowFollowersModal(true)
                    fetchFollowers()
                  }}
                >
                  <div className="font-semibold">{profile.followers_count || 0}</div>
                  <div className="text-sm text-muted-foreground">followers</div>
                </div>
                <div
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => {
                    setShowFollowingModal(true)
                    fetchFollowing()
                  }}
                >
                  <div className="font-semibold">{profile.following_count || 0}</div>
                  <div className="text-sm text-muted-foreground">following</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm mb-4">{profile.bio}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {profile.is_own_profile ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/profile/edit')}>
                  Edit profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast({ title: "Profile link copied!" })
                  }}
                >
                  Share profile
                </Button>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  variant={isFollowing ? "outline" : isPending ? "secondary" : "default"}
                  size="sm"
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : isPending ? 'Requested' : 'Follow'}
                </Button>
                {isFollowing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/messages?user=${profile.username}`)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="reels" className="gap-2">
              <Film className="h-4 w-4" />
              Reels
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="tagged" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tagged
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-6">
            {profile.is_private && !profile.is_following && !profile.is_own_profile ? (
              <div className="text-center py-12">
                <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">This Account is Private</h3>
                <p className="text-muted-foreground mb-4">
                  Follow this account to see their posts, stories, and reels.
                </p>
                {isPending ? (
                  <p className="text-sm text-muted-foreground">Follow request pending</p>
                ) : (
                  <Button onClick={handleFollow}>Follow</Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {profile.posts && profile.posts.length > 0 ? (
                  profile.posts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={{
                        id: post.id,
                        user: {
                          id: post.user_id || profile.id,
                          username: post.username || profile.username,
                          avatar: post.user_avatar || profile.avatar,
                          verified: post.is_verified || profile.is_verified || false,
                        },
                        content: post.caption || post.content || '',
                        image: post.media_urls?.[0] || post.image,
                        video: post.video,
                        likes: post.likes_count || 0,
                        comments: post.comments_count || 0,
                        shares: post.shares_count || 0,
                        timestamp: post.created_at || post.timestamp,
                        liked: likedItems[post.id] !== undefined ? likedItems[post.id] : (post.is_liked || false),
                        bookmarked: post.is_bookmarked || false,
                        isOwner: profile.is_own_profile,
                      }}
                      currentUserId={user?.id}
                      onLike={(postId) => {
                        // This will be called after the API call in PostCard's handleLike
                        // The actual state update happens in handleLikeUpdate
                      }}
                      onDelete={(postId) => {
                        // Remove post from profile
                        setProfile(prev => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            posts: prev.posts.filter(p => p.id !== postId),
                            posts_count: prev.posts_count - 1
                          }
                        })
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No posts yet</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reels" className="mt-6">
            {profile.is_private && !profile.is_following && !profile.is_own_profile ? (
              <div className="text-center py-12">
                <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">This Account is Private</h3>
                <p className="text-muted-foreground mb-4">
                  Follow this account to see their reels.
                </p>
              </div>
            ) : loadingReels && reels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading reels...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {reels && reels.length > 0 ? (
                  reels.map((reel: any) => (
                    <div
                      key={reel.id}
                      className="aspect-[9/16] bg-muted relative group cursor-pointer overflow-hidden"
                      onClick={() => {
                        // Open reel in modal or navigate to reel page
                        router.push(`/reels?id=${reel.id}`)
                      }}
                      data-liked={likedItems[reel.id] !== undefined ? likedItems[reel.id] : (reel.is_liked || false)}
                    >
                      {/* Video thumbnail */}
                      <video
                        src={reel.video_url || reel.video}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />

                      {/* Hover overlay with stats */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="h-5 w-5 fill-white" />
                          <span className="font-semibold">{reel.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-5 w-5 fill-white" />
                          <span className="font-semibold">{reel.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No reels yet</p>
                    {profile.is_own_profile && (
                      <Button
                        className="mt-4"
                        onClick={() => router.push('/create/reel')}
                      >
                        Create Your First Reel
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No saved posts</p>
            </div>
          </TabsContent>

          <TabsContent value="tagged" className="mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tagged posts</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Followers Modal */}
        <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
          <DialogContent className="sm:max-w-md p-0">
            <DialogHeader className="px-4 py-3 border-b">
              <DialogTitle className="text-base font-semibold">Followers</DialogTitle>
            </DialogHeader>

            {/* Search Bar */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={followersSearch}
                  onChange={(e) => setFollowersSearch(e.target.value)}
                  className="pl-9 bg-muted/50"
                />
              </div>
            </div>

            {/* Followers List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loadingFollowers ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (() => {
                const filteredFollowers = followers.filter(f =>
                  f.username.toLowerCase().includes(followersSearch.toLowerCase()) ||
                  f.full_name.toLowerCase().includes(followersSearch.toLowerCase())
                );
                return filteredFollowers.length > 0 ? (
                  filteredFollowers.map((follower) => (
                    <div
                      key={follower.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/profile/${follower.username}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={follower.avatar || "/placeholder-user.jpg"} />
                          <AvatarFallback>{follower.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{follower.username}</p>
                          <p className="text-sm text-muted-foreground">{follower.full_name}</p>
                        </div>
                      </div>
                      {profile?.is_own_profile ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle remove follower
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          Follow
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {followersSearch ? "No results found" : "No followers yet"}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Following Modal */}
        <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
          <DialogContent className="sm:max-w-md p-0">
            <DialogHeader className="px-4 py-3 border-b">
              <DialogTitle className="text-base font-semibold">Following</DialogTitle>
            </DialogHeader>

            {/* Search Bar */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={followingSearch}
                  onChange={(e) => setFollowingSearch(e.target.value)}
                  className="pl-9 bg-muted/50"
                />
              </div>
            </div>

            {/* Following List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loadingFollowing ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (() => {
                const filteredFollowing = following.filter(f =>
                  f.username.toLowerCase().includes(followingSearch.toLowerCase()) ||
                  f.full_name.toLowerCase().includes(followingSearch.toLowerCase())
                );
                return filteredFollowing.length > 0 ? (
                  filteredFollowing.map((followingUser) => (
                    <div
                      key={followingUser.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/profile/${followingUser.username}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={followingUser.avatar || "/placeholder-user.jpg"} />
                          <AvatarFallback>{followingUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{followingUser.username}</p>
                          <p className="text-sm text-muted-foreground">{followingUser.full_name}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle unfollow
                        }}
                      >
                        Following
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {followingSearch ? "No results found" : "Not following anyone yet"}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Instagram-Style Post Modal */}
        <InstagramPostModal
          item={selectedPost}
          type="posts"
          currentUserId={user?.id}
          isOpen={showPostModal}
          onClose={() => {
            setShowPostModal(false)
            setSelectedPost(null)
          }}
          onDelete={(postId) => {
            // Refresh profile data after deletion
            setProfile(prev => {
              if (!prev) return prev
              return {
                ...prev,
                posts: prev.posts.filter(p => p.id !== postId),
                posts_count: prev.posts_count - 1
              }
            })
          }}
          onLikeUpdate={handleLikeUpdate}
        />
      </div>
    </div>
  )
}