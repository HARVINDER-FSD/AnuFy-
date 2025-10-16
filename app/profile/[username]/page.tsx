"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Settings, Grid3X3, Bookmark, UserPlus, Lock, X, Search, Heart, MessageCircle, Send } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"

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
          token = localStorage.getItem('token');
        }

        console.log("Token found:", token ? "Yes" : "No");

        const response = await fetch(`/api/users/${username}`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!profile) {
    return <div className="flex justify-center items-center h-screen">User not found</div>
  }

  const canViewPosts = !profile.is_private || profile.is_following || profile.is_own_profile

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <Avatar className="h-24 w-24 mx-auto mb-4">
          <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.username} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {profile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          {profile.is_verified && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm text-primary-foreground">✓</span>
            </div>
          )}
          {profile.is_private && (
            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
              <Lock className="h-3 w-3" />
            </div>
          )}
        </div>

        {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}

        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="font-bold text-lg">{profile.posts_count || 0}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div 
            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => {
              setShowFollowersModal(true)
              fetchFollowers()
            }}
          >
            <div className="font-bold text-lg">{profile.followers_count || 0}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div 
            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => {
              setShowFollowingModal(true)
              fetchFollowing()
            }}
          >
            <div className="font-bold text-lg">{profile.following_count || 0}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          {profile.is_own_profile && (
            <div className="text-center">
              <div className="font-bold text-lg">{profile.profile_visits_count || 0}</div>
              <div className="text-sm text-muted-foreground">Profile Views</div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          {profile.is_own_profile ? (
            <>
              <Button variant="outline" size="sm" onClick={() => router.push('/profile/edit')}>
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Posts
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
            <div className="grid grid-cols-3 gap-1">
              {profile.posts && profile.posts.length > 0 ? (
                profile.posts.map((post: any) => (
                  <div key={post.id} className="aspect-square bg-muted relative group cursor-pointer">
                    {post.media_urls && post.media_urls[0] && (
                      <img
                        src={post.media_urls[0]}
                        alt={post.caption || 'Post'}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="h-5 w-5 fill-white" />
                        <span>{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-5 w-5 fill-white" />
                        <span>{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-muted-foreground">No posts yet</p>
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
    </div>
  )
}