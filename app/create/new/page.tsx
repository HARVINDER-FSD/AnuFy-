"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { X, Camera, Image as ImageIcon, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TabType = "POST" | "STORY" | "REEL"

export default function CreateNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("POST")
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["POST", "STORY", "REEL"].includes(tab.toUpperCase())) {
      setActiveTab(tab.toUpperCase() as TabType)
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const imageUrls: string[] = []
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          imageUrls.push(e.target?.result as string)
          if (imageUrls.length === files.length) {
            setGalleryImages(prev => [...imageUrls, ...prev])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      })
      setStream(mediaStream)
      setShowCamera(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Could not access camera. Please check permissions.")
    }
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL("image/jpeg")
        setGalleryImages(prev => [imageData, ...prev])
        setSelectedMedia(imageData)
        closeCamera()
      }
    }
  }

  const handleNext = () => {
    if (!selectedMedia) {
      alert("Please select a photo or video")
      return
    }

    // Navigate to appropriate create page with media
    const routes = {
      POST: "/create/post",
      STORY: "/stories/create",
      REEL: "/create/reel"
    }

    // Store selected media in sessionStorage to pass to next page
    sessionStorage.setItem("selectedMedia", selectedMedia)
    router.push(routes[activeTab])
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white"
        >
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-white font-semibold text-lg">New post</h1>
        <Button
          variant="ghost"
          onClick={handleNext}
          disabled={!selectedMedia}
          className="text-blue-500 font-semibold disabled:text-gray-500"
        >
          Next
        </Button>
      </div>

      {/* Camera Fullscreen */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCamera}
              className="text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8 flex justify-center">
            <Button
              size="icon"
              onClick={capturePhoto}
              className="h-16 w-16 rounded-full bg-white hover:bg-gray-200"
            >
              <div className="h-14 w-14 rounded-full border-4 border-black" />
            </Button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Preview Area */}
      {!showCamera && (
        <>
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            {selectedMedia ? (
              <div className="relative w-full h-full">
                {activeTab === "REEL" && selectedMedia.startsWith("data:video") ? (
                  <video
                    src={selectedMedia}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={selectedMedia}
                    alt="Selected"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a photo or video</p>
              </div>
            )}
          </div>

          {/* Gallery Section */}
          <div className="bg-black border-t border-gray-800">
            {/* Recents Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">Recents</span>
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                SELECT MULTIPLE
              </Button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-3 gap-1 p-1 max-h-[40vh] overflow-y-auto">
              {/* Camera Tile */}
              <div
                onClick={openCamera}
                className="aspect-square bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <Camera className="h-8 w-8 text-white" />
              </div>

              {/* Gallery Images */}
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedMedia(image)}
                  className={cn(
                    "aspect-square relative cursor-pointer overflow-hidden",
                    selectedMedia === image && "ring-2 ring-blue-500"
                  )}
                >
                  <img
                    src={image}
                    alt={`Gallery ${index}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedMedia === image && (
                    <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {image.startsWith("data:video") && (
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      0:07
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={activeTab === "REEL" ? "video/*" : "image/*"}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
