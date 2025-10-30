"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MoreHorizontal, UserPlus, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface UserProfileProps {
  user: {
    id: string
    username: string
    email: string
    avatar?: string
    bio?: string
    followers: number
    following: number
    posts: number
    verified: boolean
    isFollowing?: boolean
    isPrivate?: boolean
  }
  isOwnProfile?: boolean
}

export function UserProfile({ user, isOwnProfile = false }: UserProfileProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [followersCount, setFollowersCount] = useState(user.followers)
  const [profileData, setProfileData] = useState(user)
  const { toast } = useToast()
  
  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('[UserProfile] Profile update detected, refreshing data...');
      // Add timestamp to force cache invalidation
      const timestamp = new Date().getTime();
      
      if (isOwnProfile && profileData.username) {
        fetch(`/api/users/${profileData.username}?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        .then(response => response.json())
        .then(data => {
          console.log('[UserProfile] Fresh profile data loaded:', data);
          setProfileData({
            ...profileData,
            ...data,
            avatar: data.avatar_url || data.avatar || profileData.avatar
          });
        })
        .catch(error => {
          console.error('[UserProfile] Error refreshing profile data:', error);
        });
      }
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);
    window.addEventListener('user-data-refreshed', handleProfileUpdate);
    window.addEventListener('invalidate-cache', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
      window.removeEventListener('user-data-refreshed', handleProfileUpdate);
      window.removeEventListener('invalidate-cache', handleProfileUpdate);
    };
  }, [isOwnProfile, profileData.username]);

  const handleFollow = async () => {
    try {
      const newFollowingState = !isFollowing
      
      // Optimistic UI update
      setIsFollowing(newFollowingState)
      setFollowersCount((prev) => (newFollowingState ? prev + 1 : prev - 1))
      
      // Make API call
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method: newFollowingState ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to update follow status')
      }
      
      toast({
        title: newFollowingState ? "Following!" : "Unfollowed",
        description: newFollowingState ? `You are now following ${user.username}` : `You unfollowed ${user.username}`,
      })
    } catch (error) {
      // Revert UI on error
      setIsFollowing(!isFollowing)
      setFollowersCount(user.followers)
      
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage 
              src={`${profileData.avatar || "/placeholder.svg"}${profileData.avatar && !profileData.avatar.includes('?') ? `?_t=${Date.now()}` : profileData.avatar ? `&_t=${Date.now()}` : ''}`} 
              alt={profileData.username} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {profileData.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{user.username}</h1>
            {user.verified && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm text-primary-foreground">✓</span>
              </div>
            )}
          </div>

          {user.bio && <p className="text-muted-foreground mb-4 max-w-md mx-auto">{user.bio}</p>}

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="font-bold text-lg">{user.posts}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{followersCount}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{user.following}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="flex gap-3 justify-center">
              <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} className="gap-2">
                <UserPlus className="h-4 w-4" />
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="tagged">Tagged</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {user.isPrivate && !isOwnProfile && !isFollowing ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">This account is private</h3>
                  <p className="text-muted-foreground">Follow {user.username} to see their posts</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg">
                    <img
                      src="/placeholder.jpg"
                      alt={`Post ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No media posts yet</p>
            </div>
          </TabsContent>

          <TabsContent value="tagged" className="mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tagged posts yet</p>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
