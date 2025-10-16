"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ImageIcon, Video, Smile, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface CreatePostProps {
  onPostCreated?: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) return

    setIsPosting(true)
    try {
      // Create form data for API call
      const formData = new FormData()
      formData.append("content", content)
      if (selectedImage) {
        formData.append("media", selectedImage)
      }
      
      // Make real API call to our backend
      // Get token from cookie or localStorage for Authorization header
      let token = document.cookie.split(';').find(c => c.trim().startsWith('client-token='))?.split('=')[1] || localStorage.getItem('token') || ''
      if (token) token = token.replace(/^["']|["']$/g, '')

      const response = await fetch('/api/posts/instagram', {
        method: 'POST',
        body: formData,
        // No Content-Type header as it's set automatically for FormData
        credentials: 'include', // Include cookies for authentication
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create post');
      }

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      })

      // Reset form
      setContent("")
      setSelectedImage(null)
      setImagePreview(null)
      onPostCreated?.()
    } catch (error: any) {
      console.error("Post creation error:", error);
      toast({
        title: "Failed to create post",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  if (!user) return null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-none p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
            />

            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-lg overflow-hidden"
              >
                <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full max-h-64 object-cover" />
                <Button variant="secondary" size="sm" className="absolute top-2 right-2" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="image-upload" />
                <label htmlFor="image-upload">
                  <Button variant="ghost" size="sm" className="gap-2" asChild>
                    <span className="cursor-pointer">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      Photo
                    </span>
                  </Button>
                </label>

                <Button variant="ghost" size="sm" className="gap-2" disabled>
                  <Video className="h-4 w-4 text-muted-foreground" />
                  Video
                </Button>

                <Button variant="ghost" size="sm" className="gap-2" disabled>
                  <Smile className="h-4 w-4 text-muted-foreground" />
                  Emoji
                </Button>

                <Button variant="ghost" size="sm" className="gap-2" disabled>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </Button>
              </div>

              <Button onClick={handlePost} disabled={(!content.trim() && !selectedImage) || isPosting} size="sm">
                {isPosting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
