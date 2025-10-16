"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PostCard } from "@/components/posts/post-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, ImageIcon, Video, Music } from "lucide-react"

const categories = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "people", label: "People", icon: Users },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "videos", label: "Videos", icon: Video },
  { id: "music", label: "Music", icon: Music },
]

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState("trending")
  const [exploreData, setExploreData] = useState({
    trending: [],
    people: [],
    photos: [],
    videos: [],
    music: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        const response = await fetch(`/api/explore?category=${activeCategory}`)
        if (response.ok) {
          const data = await response.json()
          setExploreData((prev) => ({
            ...prev,
            [activeCategory]: data.content || [],
          }))
        }
      } catch (error) {
        console.error("Failed to fetch explore data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExploreData()
  }, [activeCategory])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Explore</h1>
        <p className="text-muted-foreground">Discover trending content and new creators</p>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="space-y-6">
        {activeCategory === "trending" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Trending hashtags */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending Hashtags
                </h3>
                <div className="space-y-2">
                  {["#TechNews", "#WebDev", "#AI", "#Design", "#Photography"].map((tag, index) => (
                    <div key={tag} className="flex items-center justify-between">
                      <span className="text-primary font-medium">{tag}</span>
                      <Badge variant="secondary">{Math.floor(Math.random() * 50) + 10}K</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Featured creators */}
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Featured Creators
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { username: "techguru", followers: "125K", verified: true },
                    { username: "designpro", followers: "89K", verified: false },
                    { username: "codewizard", followers: "156K", verified: true },
                    { username: "artlover", followers: "67K", verified: false },
                  ].map((user) => (
                    <div key={user.username} className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">{user.username}</span>
                          {user.verified && (
                            <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-xs text-primary-foreground">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.followers}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Posts Grid for other categories */}
        {activeCategory !== "trending" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exploreData[activeCategory as keyof typeof exploreData].length > 0 ? (
              exploreData[activeCategory as keyof typeof exploreData].map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  {loading ? "Loading..." : `No ${activeCategory} content available`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
