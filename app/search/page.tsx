"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, TrendingUp, Users, Hash, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/posts/post-card"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/components/ui/use-toast"

interface SearchResults {
  users: any[]
  posts: any[]
  hashtags: any[]
}

const trendingTopics = [
  { tag: "#TechNews", posts: "12.5K posts" },
  { tag: "#WebDev", posts: "8.2K posts" },
  { tag: "#AI", posts: "15.3K posts" },
  { tag: "#Design", posts: "6.7K posts" },
  { tag: "#Photography", posts: "9.1K posts" },
  { tag: "#Travel", posts: "7.8K posts" },
]

const suggestedUsers = [
  {
    id: "1",
    username: "techguru",
    name: "Tech Guru",
    followers: "125K",
    verified: true,
    bio: "Sharing the latest in technology",
  },
  {
    id: "2",
    username: "designpro",
    name: "Design Pro",
    followers: "89K",
    verified: false,
    bio: "UI/UX Designer & Creative",
  },
  {
    id: "3",
    username: "codewizard",
    name: "Code Wizard",
    followers: "156K",
    verified: true,
    bio: "Full-stack developer",
  },
  {
    id: "4",
    username: "artlover",
    name: "Art Lover",
    followers: "67K",
    verified: false,
    bio: "Digital artist & illustrator",
  },
]

export default function SearchPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResults>({ users: [], posts: [], hashtags: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("trending")
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ users: [], posts: [], hashtags: [] })
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedSearchQuery) {
      performSearch(debouncedSearchQuery)
      setActiveTab("posts")
    }
  }, [debouncedSearchQuery, performSearch])

  const handleFollowUser = async (userId: string) => {
    try {
      // Get token from cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => {
        const trimmed = cookie.trim();
        return trimmed.startsWith('token=') || trimmed.startsWith('client-token=');
      });
      
      if (!tokenCookie) {
        toast({
          title: "Authentication required",
          description: "Please log in to follow users",
          variant: "destructive",
        });
        return;
      }
      
      const token = tokenCookie.split('=')[1];
      
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFollowingUsers((prev) => new Set([...prev, userId]));
        toast({
          title: "Success",
          description: data.message || "You are now following this user",
        });
      } else if (response.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please log in to follow users",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to follow user');
      }
    } catch (error: any) {
      console.error("Follow failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleUnfollowUser = async (userId: string) => {
    try {
      // Get token from cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => {
        const trimmed = cookie.trim();
        return trimmed.startsWith('token=') || trimmed.startsWith('client-token=');
      });
      
      if (!tokenCookie) {
        toast({
          title: "Authentication required",
          description: "Please log in to unfollow users",
          variant: "destructive",
        });
        return;
      }
      
      const token = tokenCookie.split('=')[1];
      
      // Use POST method (same endpoint toggles follow/unfollow)
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast({
          title: "Success",
          description: data.message || "You have unfollowed this user",
        });
      } else if (response.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please log in to unfollow users",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unfollow user');
      }
    } catch (error: any) {
      console.error("Unfollow failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users, posts, or hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Trending Topics</h2>
          </div>

          {trendingTopics.map((topic, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSearchQuery(topic.tag)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-primary">{topic.tag}</h3>
                    <p className="text-sm text-muted-foreground">{topic.posts}</p>
                  </div>
                  <Hash className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {searchQuery ? `People matching "${searchQuery}"` : "Suggested for You"}
            </h2>
          </div>

          {(searchQuery ? searchResults.users : suggestedUsers).map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{user.name || user.username}</span>
                        {user.verified && (
                          <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
                      <p className="text-xs text-muted-foreground">{user.followers} followers</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={followingUsers.has(user.id) ? "outline" : "default"}
                    onClick={() =>
                      followingUsers.has(user.id) ? handleUnfollowUser(user.id) : handleFollowUser(user.id)
                    }
                  >
                    {followingUsers.has(user.id) ? "Following" : "Follow"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {searchQuery && searchResults.users.length === 0 && !isSearching && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">Try searching with different keywords</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {searchQuery ? (
            <>
              {searchResults.posts.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Posts matching "{searchQuery}"</h2>
                  </div>
                  {searchResults.posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground">Try searching with different keywords</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search for posts</h3>
              <p className="text-muted-foreground">Enter a search term to find relevant posts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
