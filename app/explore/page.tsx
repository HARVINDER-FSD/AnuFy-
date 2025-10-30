"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, Play, Heart, MessageCircle, Eye, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import MasterAPI from "@/lib/master-api"
import { useRouter } from "next/navigation"

export default function ExplorePage() {
    const { toast } = useToast()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("trending")
    const [trendingContent, setTrendingContent] = useState<any>({ posts: [], reels: [], users: [] })
    const [loading, setLoading] = useState(true)
    const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchTrendingContent()
    }, [])

    const fetchTrendingContent = async () => {
        try {
            setLoading(true)
            const response = await MasterAPI.call('/api/explore/trending?category=all&limit=30')
            console.log('[Explore] Trending data:', response)

            // Handle different response formats
            let posts = []
            let reels = []

            if (response) {
                // Format: { success: true, data: { posts: [...], reels: [...] } }
                if (response.data && typeof response.data === 'object') {
                    posts = Array.isArray(response.data.posts) ? response.data.posts : []
                    reels = Array.isArray(response.data.reels) ? response.data.reels : []
                }
                // Format: { success: true, data: [...] } (old format - just posts)
                else if (response.data && Array.isArray(response.data)) {
                    posts = response.data
                }
                // Format: { posts: [...], reels: [...] }
                else if (response.posts || response.reels) {
                    posts = Array.isArray(response.posts) ? response.posts : []
                    reels = Array.isArray(response.reels) ? response.reels : []
                }
                // Format: [...] (direct array)
                else if (Array.isArray(response)) {
                    posts = response
                }
            }

            setTrendingContent({
                posts,
                reels,
                users: []
            })
        } catch (error) {
            console.error('Error fetching trending:', error)
            toast({
                title: "Error",
                description: "Failed to load trending content",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFollowUser = async (userId: string) => {
        try {
            const data = await MasterAPI.User.followUser(userId)
            setFollowingUsers((prev) => new Set([...prev, userId]))
            toast({
                title: "Success",
                description: data.message || "You are now following this user",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to follow user",
                variant: "destructive",
            })
        }
    }

    const handleUnfollowUser = async (userId: string) => {
        try {
            const cookies = document.cookie.split(';')
            const tokenCookie = cookies.find(cookie => {
                const trimmed = cookie.trim()
                return trimmed.startsWith('token=') || trimmed.startsWith('client-token=')
            })

            if (!tokenCookie) {
                toast({
                    title: "Authentication required",
                    description: "Please log in to unfollow users",
                    variant: "destructive",
                })
                return
            }

            const token = tokenCookie.split('=')[1]
            const response = await fetch(`/api/users/${userId}/follow`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setFollowingUsers((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(userId)
                    return newSet
                })
                toast({
                    title: "Success",
                    description: data.message || "You have unfollowed this user",
                })
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to unfollow user",
                variant: "destructive",
            })
        }
    }

    const handlePostClick = (postId: string) => {
        router.push(`/feed`)
    }

    const handleReelClick = (reelId: string) => {
        router.push(`/reels`)
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Explore</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trending">Trending</TabsTrigger>
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="reels">Reels</TabsTrigger>
                </TabsList>

                <TabsContent value="trending" className="space-y-6 mt-6">
                    {loading ? (
                        <div className="space-y-6">
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Trending Posts Grid */}
                            {trendingContent.posts && trendingContent.posts.length > 0 ? (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">Trending Posts</h2>
                                    <div className="grid grid-cols-3 gap-1">
                                        {trendingContent.posts.map((post: any) => (
                                            <button
                                                key={post._id}
                                                onClick={() => handlePostClick(post._id)}
                                                className="aspect-square relative group overflow-hidden rounded"
                                            >
                                                {post.media_urls?.[0] ? (
                                                    <img
                                                        src={post.media_urls[0]}
                                                        alt={post.caption || 'Post'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/placeholder.svg'
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                        <span className="text-white text-xs text-center p-2">
                                                            {post.caption?.substring(0, 50) || 'Post'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {post.likes_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3" />
                                                        {post.comments_count || 0}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <TrendingUp className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No trending content yet</h3>
                                    <p className="text-muted-foreground">Check back later for trending posts</p>
                                </div>
                            )}

                            {/* Trending Reels Grid */}
                            {trendingContent.reels && trendingContent.reels.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">Trending Reels</h2>
                                    <div className="grid grid-cols-3 gap-1">
                                        {trendingContent.reels.map((reel: any) => (
                                            <button
                                                key={reel._id}
                                                onClick={() => handleReelClick(reel._id)}
                                                className="aspect-[9/16] relative group overflow-hidden rounded bg-gradient-to-br from-purple-500 to-pink-500"
                                            >
                                                {reel.thumbnail_url ? (
                                                    <img
                                                        src={reel.thumbnail_url}
                                                        alt={reel.caption || 'Reel'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
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
                                                            e.currentTarget.style.display = 'none'
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
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {reel.likes_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {reel.views_count || 0}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Users */}
                            {trendingContent.users && trendingContent.users.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">Suggested Users</h2>
                                    <div className="space-y-2">
                                        {trendingContent.users.map((user: any) => (
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

                <TabsContent value="posts" className="space-y-4 mt-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : trendingContent.posts && trendingContent.posts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                            {trendingContent.posts.map((post: any) => (
                                <button
                                    key={post._id}
                                    onClick={() => handlePostClick(post._id)}
                                    className="aspect-square relative group overflow-hidden rounded"
                                >
                                    {post.media_urls?.[0] ? (
                                        <img
                                            src={post.media_urls[0]}
                                            alt={post.caption || 'Post'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/placeholder.svg'
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                            <span className="text-white text-xs text-center p-2">
                                                {post.caption?.substring(0, 50) || 'Post'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs">
                                        <span className="flex items-center gap-1">
                                            <Heart className="h-3 w-3" />
                                            {post.likes_count || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="h-3 w-3" />
                                            {post.comments_count || 0}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <TrendingUp className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                            <p className="text-muted-foreground">Check back later for trending posts</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="reels" className="space-y-4 mt-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : trendingContent.reels && trendingContent.reels.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                            {trendingContent.reels.map((reel: any) => (
                                <button
                                    key={reel._id}
                                    onClick={() => handleReelClick(reel._id)}
                                    className="aspect-[9/16] relative group overflow-hidden rounded bg-gradient-to-br from-purple-500 to-pink-500"
                                >
                                    {reel.thumbnail_url ? (
                                        <img
                                            src={reel.thumbnail_url}
                                            alt={reel.caption || reel.title || 'Reel'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
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
                                                e.currentTarget.style.display = 'none'
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
                                        <span className="flex items-center gap-1">
                                            <Heart className="h-3 w-3" />
                                            {reel.likes_count || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            {reel.view_count || reel.views_count || 0}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Play className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No reels yet</h3>
                            <p className="text-muted-foreground">Check back later for trending reels</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
