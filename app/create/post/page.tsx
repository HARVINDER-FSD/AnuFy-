"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { ArrowLeft, ImageIcon, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import Cookies from "js-cookie"

export default function CreatePostPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [content, setContent] = useState("")
  const [location, setLocation] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      try {
        const formData = new FormData()
        formData.append('file', file)

        const token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token')
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          setUploadedImageUrl(result.url) // Store Cloudinary URL separately
          console.log('Image uploaded successfully:', result.url)
        } else {
          const errorData = await response.json()
          console.error('Upload failed:', errorData.message)
          // Keep the preview even if upload fails
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setUploadedImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && !selectedImage) {
      alert("Please add some content or an image to your post")
      return
    }

    setIsSubmitting(true)

    try {
      // Get auth token from cookies
      const token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token')

      if (!token) {
        alert("You must be logged in to create a post")
        router.push('/login')
        return
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          location: location || null,
          media_urls: uploadedImageUrl ? [uploadedImageUrl] : (selectedImage ? [selectedImage] : []),
          media_type: selectedImage ? "image" : "text",
        }),
      })

      if (response.ok) {
        // Show success message
        alert("Post created successfully!")
        router.push("/feed")
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create Post</h1>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && !selectedImage)}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Avatar>
              <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.username || "User"} />
              <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{user?.name || user?.username || "Your Name"}</div>
              <div className="text-xs text-muted-foreground">
                {location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Textarea
            placeholder="What's on your mind?"
            className="border-none resize-none text-lg focus-visible:ring-0 p-0 min-h-[120px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {selectedImage && (
            <div className="relative mt-4 rounded-md overflow-hidden">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full z-10"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={selectedImage}
                alt="Selected image"
                className="w-full h-auto object-cover rounded-md max-h-96"
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Add Photo
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />

            <Input
              placeholder="Add location"
              className="flex-1 h-9 focus-visible:ring-0"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Tips for great posts</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Add a clear, high-quality image to grab attention</li>
          <li>• Write an engaging caption that tells a story</li>
          <li>• Add your location to help others discover your content</li>
          <li>• Keep it authentic and true to your personal style</li>
        </ul>
      </div>
    </div>
  )
}