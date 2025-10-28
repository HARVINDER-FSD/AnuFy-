"use client"

import { useState } from "react"
import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export function CreateStory() {
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedMedia(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = () => {
    setSelectedMedia(null)
    setMediaPreview(null)
  }

  const handleCreateStory = async () => {
    if (!selectedMedia) {
      toast({
        title: "Media required",
        description: "Please select an image or video for your story",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("media", selectedMedia)
      if (caption) {
        formData.append("caption", caption)
      }

      // Make API call to our backend
      let token = document.cookie.split(';').find(c => c.trim().startsWith('client-token='))?.split('=')[1] || localStorage.getItem('token') || ''
      if (token) token = token.replace(/^["']|["']$/g, '')

      const response = await fetch('/api/stories/instagram', {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create story')
      }

      toast({
        title: "Story created!",
        description: "Your story has been shared successfully.",
      })

      // Redirect to stories page
      router.push("/stories")
    } catch (error: any) {
      console.error("Error creating story:", error)
      toast({
        title: "Failed to create story",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Create Story</h2>
        
        {mediaPreview ? (
          <div className="relative aspect-[9/16] mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-full rounded-lg overflow-hidden"
            >
              {selectedMedia?.type.startsWith("image/") ? (
                <img 
                  src={mediaPreview} 
                  alt="Story preview" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <video 
                  src={mediaPreview} 
                  className="w-full h-full object-contain" 
                  controls
                />
              )}
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 mb-4">
            <Camera className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 mb-4">Upload a photo or video for your story</p>
            <input
              type="file"
              id="story-media"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaSelect}
            />
            <label htmlFor="story-media">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Select Media</span>
              </Button>
            </label>
          </div>
        )}
        
        <textarea
          placeholder="Add a caption to your story..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-3 border rounded-md mb-4 resize-none"
          maxLength={500}
        />
        
        <Button 
          onClick={handleCreateStory} 
          className="w-full" 
          disabled={!selectedMedia || isUploading}
        >
          {isUploading ? "Creating..." : "Share Story"}
        </Button>
      </CardContent>
    </Card>
  )
}