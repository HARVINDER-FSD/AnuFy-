"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, TrendingUp, Users, Hash, Loader2, Play } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/posts/post-card"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"

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
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const [trendingContent, setTrendingContent] = useState<any>({ posts: [], reels: [], users: [] })
  const [loadingTrending, setLoadingTrending] = useState(true)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch trending content on mount
  useEffect(() => {
    fetchTrendingContent()
    fetchSearchHistory()
  }, [])

  const fetchTrendingContent = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch('/api/explore/trending?category=all&limit=20', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Trending content received:', {
          posts: data.posts?.length || 0,
          reels: data.reels?.length || 0,
          users: data.users?.length || 0
        })

        // Log first reel to check thumbnail
        if (data.reels && data.reels.length > 0) {
          console.log('First reel data:', {
            id: data.reels[0]._id,
            has_thumbnail: !!data.reels[0].thumbnail_url,
            has_video: !!data.reels[0].video_url,
            thumbnail_url: data.reels[0].thumbnail_url,
            video_url: data.reels[0].video_url
          })
        }

        setTrendingContent(data)
      }
    } catch (error) {
      console.error('Error fetching trending:', error)
    } finally {
      setLoadingTrending(false)
    }
  }

  const fetchSearchHistory = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch('/api/search/history?limit=10', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSearchHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
    }
  }

  const saveToHistory = async (query: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      await fetch('/api/search/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ query, type: 'general' })
      })

      fetchSearchHistory()
    } catch (error) {
      console.error('Error saving to history:', error)
    }
  }

  const clearHistory = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      await fetch('/api/search/history', {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      setSearchHistory([])
      toast({ title: 'Search history cleared' })
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ users: [], posts: [], hashtags: [] })
      setShowHistory(true)
      return
    }

    setShowHistory(false)
    setIsSearching(true)

    // Save to history
    saveToHistory(query)
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search users, posts, or hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
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
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">Trending Now</h2>
          </div>

          {loadingTrending ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Trending Posts Grid */}
              {trendingContent.posts && trendingContent.posts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Trending Posts</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {trendingContent.posts.slice(0, 9).map((post: any) => (
                      <button
                        key={post._id}
                        onClick={() => window.location.href = '/feed'}
                        className="aspect-square relative group overflow-hidden rounded"
                      >
                        <img
                          src={post.media_urls?.[0] || '/placeholder.svg'}
                          alt={post.caption || 'Post'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs">
                          <span>❤️ {post.likes_count || 0}</span>
                          <span>💬 {post.comments_count || 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Reels Grid */}
              {trendingContent.reels && trendingContent.reels.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Trending Reels</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {trendingContent.reels.slice(0, 9).map((reel: any) => {
                      return (
                        <button
                          key={reel._id}
                          onClick={() => window.location.href = '/reels'}
                          className="aspect-[9/16] relative group overflow-hidden rounded bg-gradient-to-br from-purple-500 to-pink-500"
                        >
                          {reel.thumbnail_url ? (
                            <img
                              src={reel.thumbnail_url}
                              alt={reel.caption || 'Reel'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // If thumbnail fails, hide it and show gradient
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : reel.video_url ? (
                            <video
                              src={reel.video_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              onError={(e) => {
                                // If video fails, hide it and show gradient
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-10 w-10 text-white" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                            <Play className="h-4 w-4 text-white fill-white" />
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs">
                            <span>❤️ {reel.likes_count || 0}</span>
                            <span>👁️ {reel.views_count || 0}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Content Message */}
              {(!trendingContent.posts || trendingContent.posts.length === 0) &&
                (!trendingContent.reels || trendingContent.reels.length === 0) &&
                (!trendingContent.users || trendingContent.users.length === 0) && (
                  <div className="text-center py-12">
                    <TrendingUp className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No trending content yet</h3>
                    <p className="text-muted-foreground">Check back later for trending posts and reels</p>
                  </div>
                )}

              {/* Suggested Users */}
              {trendingContent.users && trendingContent.users.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Suggested Users</h3>
                  <div className="space-y-2">
                    {trendingContent.users.slice(0, 5).map((user: any) => (
                      <Card key={user._id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
                                <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-sm">{user.username}</span>
                                  {user.is_verified && (
                                    <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                                      <span className="text-[8px] text-primary-foreground">✓</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{user.full_name}</p>
                                <p className="text-xs text-muted-foreground">{user.followers_count || 0} followers</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={followingUsers.has(user._id) ? "outline" : "default"}
                              onClick={() =>
                                followingUsers.has(user._id) ? handleUnfollowUser(user._id) : handleFollowUser(user._id)
                              }
                            >
                              {followingUsers.has(user._id) ? "Following" : "Follow"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-6 w-6 text-primary" />
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
              <Users className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
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
                  <Search className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground">Try searching with different keywords</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center py-8">
              <Search className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search for posts</h3>
              <p className="text-muted-foreground">Enter a search term to find relevant posts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
