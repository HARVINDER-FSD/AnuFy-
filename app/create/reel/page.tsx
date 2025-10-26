"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { ArrowLeft, Camera, X, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary-upload"

export default function CreateReelPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([50])
  const [isMuted, setIsMuted] = useState(false)
  const [showCaptions, setShowCaptions] = useState(true)
  const [showLocation, setShowLocation] = useState(false)
  const [location, setLocation] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  // Update video volume when slider changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume[0] / 100
    }
  }, [volume])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive",
        })
        return
      }

      setVideoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedVideo(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Video preview only - actual upload happens on submit
      // This avoids the 413 error by not uploading through API
    }
  }

  const removeVideo = () => {
    setSelectedVideo(null)
    setVideoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100
    }
  }

  const generateThumbnail = async (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true

      video.onloadedmetadata = () => {
        // Set canvas size to video dimensions
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Seek to 1 second or 10% of video duration
        video.currentTime = Math.min(1, video.duration * 0.1)
      }

      video.onseeked = () => {
        if (ctx) {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader()
              reader.onloadend = () => {
                resolve(reader.result as string)
              }
              reader.readAsDataURL(blob)
            } else {
              reject(new Error('Failed to generate thumbnail'))
            }
          }, 'image/jpeg', 0.8)
        }
      }

      video.onerror = () => {
        reject(new Error('Failed to load video'))
      }

      video.src = URL.createObjectURL(videoFile)
    })
  }

  const handleSubmit = async () => {
    if (!videoFile) {
      toast({
        title: "Video required",
        description: "Please select a video for your reel.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Validate file
      const validation = validateFile(videoFile)
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        })
        return
      }

      // Generate thumbnail from video
      toast({
        title: "Generating thumbnail...",
        description: "Creating preview image from video.",
      })

      const thumbnailDataUrl = await generateThumbnail(videoFile)

      // Convert data URL to blob for upload
      const thumbnailBlob = await fetch(thumbnailDataUrl).then(r => r.blob())
      const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' })

      // Upload video to Cloudinary with progress
      toast({
        title: "Uploading video...",
        description: "This may take a moment for large files.",
      })

      const uploadResult = await uploadToCloudinary(videoFile, (progress) => {
        setUploadProgress(progress)
      })

      // Upload thumbnail to Cloudinary
      toast({
        title: "Uploading thumbnail...",
        description: "Almost done!",
      })

      const thumbnailResult = await uploadToCloudinary(thumbnailFile)

      // Create reel with the uploaded URLs
      const token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token')
      if (!token) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to create a reel.",
          variant: "destructive",
        })
        router.push('/login')
        return
      }

      const response = await fetch("/api/reels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          video_url: uploadResult.url,
          thumbnail_url: thumbnailResult.url,
          caption,
          location: showLocation ? location : null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Reel created successfully!",
          description: "Your reel has been shared.",
        })
        router.push("/reels")
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to create reel")
      }
    } catch (error: any) {
      console.error("Error creating reel:", error)
      toast({
        title: "Failed to create reel",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create Reel</h1>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedVideo}
        >
          {isSubmitting
            ? uploadProgress > 0
              ? `Uploading ${uploadProgress}%`
              : "Sharing..."
            : "Share Reel"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {selectedVideo ? (
            <div className="relative aspect-[9/16] w-full rounded-md overflow-hidden mb-4">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full z-10"
                onClick={removeVideo}
              >
                <X className="h-4 w-4" />
              </Button>

              <video
                ref={videoRef}
                src={selectedVideo}
                className="w-full h-full object-cover rounded-md"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.volume = volume[0] / 100
                  }
                }}
              />

              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>

                  <div className="w-20">
                    <Slider
                      value={volume}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 mb-4 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">Upload a video for your reel</p>
              <Button variant="outline" asChild>
                <span>Select Video</span>
              </Button>
            </div>
          )}

          <input
            type="file"
            accept="video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleVideoSelect}
          />

          <div className="space-y-4">
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Add a caption to your reel..."
                className="border-none resize-none text-lg focus-visible:ring-0 p-0 min-h-[80px]"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-captions"
                checked={showCaptions}
                onCheckedChange={setShowCaptions}
              />
              <Label htmlFor="show-captions">Show captions on video</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-location"
                checked={showLocation}
                onCheckedChange={setShowLocation}
              />
              <Label htmlFor="show-location">Add location</Label>
            </div>

            {showLocation && (
              <div>
                <Label htmlFor="location">Location</Label>
                <input
                  id="location"
                  type="text"
                  placeholder="Where was this taken?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
