"use client"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ImageIcon, Video, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"

const createOptions = [
  {
    id: "post",
    title: "Create Post",
    description: "Share a photo, video, or text with your followers",
    icon: Type,
    color: "bg-blue-500",
  },
  {
    id: "story",
    title: "Add to Story",
    description: "Share a moment that disappears after 24 hours",
    icon: ImageIcon,
    color: "bg-purple-500",
  },
  {
    id: "reel",
    title: "Create Reel",
    description: "Make a short, entertaining video",
    icon: Video,
    color: "bg-pink-500",
  },
  {
    id: "live",
    title: "Go Live",
    description: "Broadcast live to your followers",
    icon: Video,
    color: "bg-red-500",
  },
]

export default function CreatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }
  
  // Only render content if authenticated
  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create</h1>
      </div>

      <div className="grid gap-4">
        {createOptions.map((option, index) => {
          const Icon = option.icon
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => {
                  if (option.id === "post") {
                    window.location.href = "/create/post";
                  } else if (option.id === "story") {
                    window.location.href = "/stories/create";
                  } else if (option.id === "reel") {
                    window.location.href = "/create/reel";
                  } else {
                    // Future implementation for other creation types
                    alert(`${option.title} feature coming soon!`);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{option.title}</h3>
                      <p className="text-muted-foreground text-sm">{option.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Tips for great content</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use good lighting for photos and videos</li>
          <li>• Write engaging captions that start conversations</li>
          <li>• Post consistently to keep your audience engaged</li>
          <li>• Use relevant hashtags to reach new people</li>
        </ul>
      </div>
    </div>
  )
}
