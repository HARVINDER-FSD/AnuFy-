"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bookmark } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"

interface SavedPost {
  id: string
  caption: string
  mediaUrl: string
  createdAt: string
  user: {
    id: string
    username: string
    profilePicture?: string
  }
  likes: number
  comments: number
}

export default function SavedPage() {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSavedPosts()
  }, [])

  const fetchSavedPosts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/posts/saved')
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved posts')
      }
      
      const data = await response.json()
      setSavedPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching saved posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Saved</h1>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="reels">Reels</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-200"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : savedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/posts/${post.id}`)}
                    >
                      <div className="aspect-square relative">
                        <img 
                          src={post.mediaUrl} 
                          alt={post.caption} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={post.user.profilePicture} alt={post.user.username} />
                            <AvatarFallback>{post.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{post.user.username}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className="text-sm line-clamp-2">{post.caption}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{post.likes} likes</span>
                          <span>{post.comments} comments</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bookmark className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No saved items</h3>
              <p className="text-muted-foreground">
                Save photos and videos that you want to see again
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="posts">
          {/* Same content as "all" but filtered for posts only */}
          <div className="text-center py-12">
            <Bookmark className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No saved posts</h3>
            <p className="text-muted-foreground">
              Save photos that you want to see again
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="reels">
          {/* Same content as "all" but filtered for reels only */}
          <div className="text-center py-12">
            <Bookmark className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No saved reels</h3>
            <p className="text-muted-foreground">
              Save videos that you want to see again
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}