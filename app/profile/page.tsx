"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Grid3X3, Bookmark, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { jwtDecode } from "jwt-decode"
import { useAuth } from "@/components/auth/auth-provider"

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
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "tagged">("posts")
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <Avatar className="h-24 w-24 mx-auto mb-4">
          <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.username} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {user.username.charAt(0).toUpperCase()}
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

        <h2 className="text-xl font-medium mb-2">{user.name}</h2>
        <p className="text-muted-foreground mb-2">{user.email}</p>
        <p className="text-muted-foreground mb-4">{user.bio || "No bio yet"}</p>
        
        <Button onClick={handleEditProfile} className="mb-4">Edit Profile</Button>

        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="font-bold text-lg">{user.posts_count || 0}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{user.followers || 0}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{user.following || 0}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/profile/edit">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="posts" className="w-full" orientation="horizontal">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="gap-2" tabIndex={0}>
            <Grid3X3 className="h-4 w-4" />
            Posts
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
          <div className="grid grid-cols-3 gap-1">
            {user.posts && user.posts.length > 0 ? (
              user.posts.map((post) => (
                <div key={post.id} className="aspect-square bg-muted rounded-lg">
                  <img 
                    src={post.media_urls?.[0] || "/placeholder.jpg"} 
                    alt={post.caption || "Post"} 
                    className="w-full h-full object-cover rounded-lg" 
                  />
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <div className="text-center py-8">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
            <p className="text-muted-foreground">Posts you save will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="tagged" className="mt-6">
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tagged posts yet</h3>
            <p className="text-muted-foreground">Posts you're tagged in will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
