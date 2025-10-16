"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { ArrowLeft, Camera, X, Type, Smile, MapPin, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import Cookies from "js-cookie"
import { motion } from "framer-motion"

export default function CreateStoryPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showText, setShowText] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
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
        
        const token = Cookies.get('token')
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          setSelectedImage(result.url) // Update with Cloudinary URL
        } else {
          console.error('Upload failed')
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!selectedImage) {
      alert("Please select an image for your story")
      return
    }

    setIsSubmitting(true)

    try {
      const token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token')
      
      if (!token) {
        alert("You must be logged in to create a story")
        router.push('/login')
        return
      }

      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          media_url: selectedImage,
          media_type: "image",
          caption: caption || null,
          location: location || null,
        }),
      })

      if (response.ok) {
        alert("Story created successfully!")
        router.push("/stories")
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to create story")
      }
    } catch (error) {
      console.error("Error creating story:", error)
      alert("Failed to create story. Please try again.")
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
          <h1 className="text-2xl font-bold">Create Story</h1>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !selectedImage}
        >
          {isSubmitting ? "Sharing..." : "Share Story"}
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

          {selectedImage ? (
            <div className="relative aspect-[9/16] mb-4 rounded-lg overflow-hidden">
              <Image
                src={selectedImage}
                alt="Story preview"
                width={400}
                height={711}
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Story overlay controls */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowText(!showText)}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <Type className="h-4 w-4 mr-1" />
                  Text
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowStickers(!showStickers)}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <Smile className="h-4 w-4 mr-1" />
                  Stickers
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowMusic(!showMusic)}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <Music className="h-4 w-4 mr-1" />
                  Music
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 mb-4">
              <Camera className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">Upload a photo for your story</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Photo
              </Button>
            </div>
          )}

          <Textarea
            placeholder="Add a caption to your story..."
            className="border-none resize-none text-lg focus-visible:ring-0 p-0 min-h-[80px]"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
          />

          <div className="flex items-center gap-2 mt-6 pt-4 border-t">
            <input
              type="text"
              placeholder="Add location"
              className="flex-1 h-9 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Story Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Stories disappear after 24 hours</li>
          <li>• Add text, stickers, and music to make your story engaging</li>
          <li>• Use high-quality images for better results</li>
          <li>• Add your location to help others discover your content</li>
        </ul>
      </div>
    </div>
  )
}
