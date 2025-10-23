"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import {
  ArrowLeft, Camera, X, Type, Smile, Music, Sparkles,
  Download, Send, Settings, Palette, Eraser, Undo, Redo,
  Image as ImageIcon, Video, Grid3X3, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

export default function CreateStoryPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()

  // Media states
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tool states
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'draw' | 'sticker' | 'music' | 'filter'>('none')

  // Text tool states
  const [texts, setTexts] = useState<Array<{
    id: string
    content: string
    x: number
    y: number
    fontSize: number
    color: string
    fontFamily: string
    rotation: number
  }>>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawColor, setDrawColor] = useState('#ffffff')
  const [drawSize, setDrawSize] = useState(5)
  const [drawings, setDrawings] = useState<Array<{
    points: Array<{ x: number, y: number }>
    color: string
    size: number
  }>>([])
  const [currentPath, setCurrentPath] = useState<Array<{ x: number, y: number }>>([])

  // Sticker states
  const [stickers, setStickers] = useState<Array<{
    id: string
    emoji: string
    x: number
    y: number
    size: number
    rotation: number
  }>>([])
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)

  // Music states
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null)

  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<string>('none')

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null)

  // Auth check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  // Color presets
  const colors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'
  ]

  // Drawing colors with labels
  const drawColors = [
    { color: '#ffffff', name: 'White' },
    { color: '#000000', name: 'Black' },
    { color: '#ff0000', name: 'Red' },
    { color: '#ff8800', name: 'Orange' },
    { color: '#ffff00', name: 'Yellow' },
    { color: '#00ff00', name: 'Green' },
    { color: '#00ffff', name: 'Cyan' },
    { color: '#0000ff', name: 'Blue' },
    { color: '#ff00ff', name: 'Pink' },
    { color: '#8800ff', name: 'Purple' },
  ]

  // Font families
  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
    'Georgia', 'Verdana', 'Comic Sans MS', 'Impact'
  ]

  // Sticker emojis
  const stickerCategories = {
    faces: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
    hearts: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
    hands: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
    nature: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '?', '??'],
    animals: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
    food: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
    activities: ['?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
    symbols: ['??', '??', '?', '?', '?', '??', '??', '??', '??', '??', '??', '??'],
  }

  // Music tracks
  const musicTracks = [
    { id: 'track1', name: 'Summer Vibes', artist: 'DJ Cool', duration: '0:30' },
    { id: 'track2', name: 'Chill Beats', artist: 'Lo-Fi Master', duration: '0:30' },
    { id: 'track3', name: 'Party Time', artist: 'The Groove', duration: '0:30' },
    { id: 'track4', name: 'Acoustic Dreams', artist: 'Guitar Hero', duration: '0:30' },
    { id: 'track5', name: 'Electronic Pulse', artist: 'Synth Wave', duration: '0:30' },
    { id: 'track6', name: 'Hip Hop Flow', artist: 'MC Rhythm', duration: '0:30' },
  ]

  // Filters
  const filters = [
    { name: 'None', value: 'none', filter: '' },
    { name: 'Clarendon', value: 'clarendon', filter: 'contrast(1.2) saturate(1.35)' },
    { name: 'Gingham', value: 'gingham', filter: 'brightness(1.05) hue-rotate(-10deg)' },
    { name: 'Moon', value: 'moon', filter: 'grayscale(1) contrast(1.1) brightness(1.1)' },
    { name: 'Lark', value: 'lark', filter: 'contrast(0.9) brightness(1.1)' },
    { name: 'Reyes', value: 'reyes', filter: 'sepia(0.22) brightness(1.1) contrast(0.85)' },
    { name: 'Juno', value: 'juno', filter: 'contrast(1.2) brightness(1.1) saturate(1.4)' },
    { name: 'Slumber', value: 'slumber', filter: 'saturate(0.66) brightness(1.05)' },
    { name: 'Crema', value: 'crema', filter: 'sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)' },
    { name: 'Ludwig', value: 'ludwig', filter: 'contrast(1.05) brightness(1.05) saturate(2)' },
    { name: 'Aden', value: 'aden', filter: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
    { name: 'Perpetua', value: 'perpetua', filter: 'contrast(1.1) brightness(1.25) saturate(1.1)' },
  ]

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return

    setMediaType(type)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedMedia(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = Cookies.get('client-token') || Cookies.get('token')
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSelectedMedia(result.url)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload media",
        variant: "destructive"
      })
    }
  }

  const addText = () => {
    const newText = {
      id: Date.now().toString(),
      content: 'Tap to edit',
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#ffffff',
      fontFamily: 'Arial',
      rotation: 0
    }
    setTexts([...texts, newText])
    setSelectedTextId(newText.id)
  }

  const updateText = (id: string, updates: Partial<typeof texts[0]>) => {
    setTexts(texts.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteText = (id: string) => {
    setTexts(texts.filter(t => t.id !== id))
    setSelectedTextId(null)
  }

  // Touch/Mouse drag handlers
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent, textId: string) => {
    e.stopPropagation()
    setIsDragging(true)
    setSelectedTextId(textId)

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    setDragStart({ x: clientX, y: clientY })
  }

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !selectedTextId) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const deltaX = clientX - dragStart.x
    const deltaY = clientY - dragStart.y

    const text = texts.find(t => t.id === selectedTextId)
    if (!text) return

    // Calculate percentage movement relative to container
    const container = mediaRef.current?.parentElement
    if (!container) return

    const percentX = (deltaX / container.clientWidth) * 100
    const percentY = (deltaY / container.clientHeight) * 100

    updateText(selectedTextId, {
      x: Math.max(0, Math.min(100, text.x + percentX)),
      y: Math.max(0, Math.min(100, text.y + percentY))
    })

    setDragStart({ x: clientX, y: clientY })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Drawing handlers
  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (activeTool !== 'draw') return

    setIsDrawing(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setCurrentPath([{ x, y }])
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || activeTool !== 'draw') return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    setCurrentPath(prev => [...prev, { x, y }])
  }

  const endDrawing = () => {
    if (!isDrawing) return

    if (currentPath.length > 1) {
      setDrawings([...drawings, {
        points: currentPath,
        color: drawColor,
        size: drawSize
      }])
    }

    setIsDrawing(false)
    setCurrentPath([])
  }

  const clearDrawings = () => {
    setDrawings([])
    setCurrentPath([])
  }

  const undoDrawing = () => {
    if (drawings.length > 0) {
      setDrawings(drawings.slice(0, -1))
    }
  }

  // Sticker handlers
  const addSticker = (emoji: string) => {
    const newSticker = {
      id: Date.now().toString(),
      emoji,
      x: 50,
      y: 50,
      size: 60,
      rotation: 0
    }
    setStickers([...stickers, newSticker])
    setSelectedStickerId(newSticker.id)
  }

  const updateSticker = (id: string, updates: Partial<typeof stickers[0]>) => {
    setStickers(stickers.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id))
    setSelectedStickerId(null)
  }

  // Sticker drag handlers
  const handleStickerDragStart = (e: React.TouchEvent | React.MouseEvent, stickerId: string) => {
    e.stopPropagation()
    setIsDragging(true)
    setSelectedStickerId(stickerId)

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    setDragStart({ x: clientX, y: clientY })
  }

  const handleStickerDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !selectedStickerId) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const deltaX = clientX - dragStart.x
    const deltaY = clientY - dragStart.y

    const sticker = stickers.find(s => s.id === selectedStickerId)
    if (!sticker) return

    const container = mediaRef.current?.parentElement
    if (!container) return

    const percentX = (deltaX / container.clientWidth) * 100
    const percentY = (deltaY / container.clientHeight) * 100

    updateSticker(selectedStickerId, {
      x: Math.max(0, Math.min(100, sticker.x + percentX)),
      y: Math.max(0, Math.min(100, sticker.y + percentY))
    })

    setDragStart({ x: clientX, y: clientY })
  }

  // Add touch event listeners for drag
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && (selectedTextId || selectedStickerId)) {
        e.preventDefault()
        if (selectedTextId) {
          handleDragMove(e as any)
        } else if (selectedStickerId) {
          handleStickerDragMove(e as any)
        }
      }
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('mousemove', (e) => {
      if (selectedTextId) handleDragMove(e as any)
      else if (selectedStickerId) handleStickerDragMove(e as any)
    })
    document.addEventListener('mouseup', handleDragEnd)

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, selectedTextId, selectedStickerId, dragStart, texts, stickers])

  // Render drawings on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all completed paths
    drawings.forEach(drawing => {
      if (drawing.points.length < 2) return

      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      const firstPoint = drawing.points[0]
      ctx.moveTo((firstPoint.x / 100) * canvas.width, (firstPoint.y / 100) * canvas.height)

      drawing.points.forEach(point => {
        ctx.lineTo((point.x / 100) * canvas.width, (point.y / 100) * canvas.height)
      })

      ctx.stroke()
    })

    // Draw current path
    if (currentPath.length > 1) {
      ctx.strokeStyle = drawColor
      ctx.lineWidth = drawSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      const firstPoint = currentPath[0]
      ctx.moveTo((firstPoint.x / 100) * canvas.width, (firstPoint.y / 100) * canvas.height)

      currentPath.forEach(point => {
        ctx.lineTo((point.x / 100) * canvas.width, (point.y / 100) * canvas.height)
      })

      ctx.stroke()
    }
  }, [drawings, currentPath, drawColor, drawSize])

  const handleSubmit = async () => {
    if (!selectedMedia) {
      toast({
        title: "No media selected",
        description: "Please select a photo or video",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = Cookies.get('client-token') || Cookies.get('token')

      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          media_url: selectedMedia,
          media_type: mediaType,
          texts: texts,
          stickers: stickers,
          drawings: drawings,
          filter: selectedFilter,
          music: selectedMusic,
        }),
      })

      if (response.ok) {
        toast({
          title: "Story created!",
          description: "Your story has been shared",
        })
        router.push("/stories")
      } else {
        throw new Error("Failed to create story")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Advanced AI Auto-Create with content detection
  const aiAutoCreate = () => {
    if (!selectedMedia) return

    // Detect content type from media
    const isVideo = mediaType === 'video'

    // Get current time for context
    const hour = new Date().getHours()
    const isMorning = hour >= 6 && hour < 12
    const isDay = hour >= 12 && hour < 18
    const isEvening = hour >= 18 && hour < 22
    const isNight = hour >= 22 || hour < 6

    // Content-aware caption categories
    const contentTypes = {
      selfie: ["Feeling myself ??", "Selfie game strong ??", "Just me ?", "Confidence level ??", "Main character energy ??"],
      food: ["Foodie life ??", "Yummy in my tummy ??", "Food coma incoming ??", "Treat yourself ??", "Delicious vibes ??"],
      travel: ["Wanderlust ??", "Adventure awaits ??", "Exploring ???", "Travel mode ON ??", "New places ???"],
      fitness: ["Workout done ??", "Fitness journey ???", "Healthy vibes ??", "Gym time ??", "Strong & proud ??"],
      nature: ["Nature therapy ??", "Fresh air ??", "Peaceful vibes ??", "Earth lover ??", "Natural beauty ??"],
      party: ["Party mode ??", "Good times ??", "Living it up ??", "Squad goals ??", "Night out ??"],
      pet: ["Cuteness overload ??", "Pet love ??", "Furry friend ??", "Animal vibes ??", "Best companion ??"],
      fashion: ["Style on point ", "Fashion vibes ", "Outfit of the day ", "Drip check ", "Serving looks "],
      morning: ["Rise and shine ??", "Morning vibes ?", "New day energy ??", "Coffee time ?", "Early bird ??"],
      evening: ["Golden hour ", "Sunset chaser ", "Evening magic ", "Grateful ", "Perfect ending "],
      night: ["Night owl ", "Starry nights ", "Midnight vibes ", "City lights ", "Late night "],
      general: ["Living my best life ?", "Good vibes only ??", "Making memories ??", "Blessed ??", "Positive energy ??"]
    }

    // Smart content detection (simplified - can be enhanced with actual image analysis)
    let detectedCategory = 'general'

    // Time-based detection
    if (isMorning) detectedCategory = 'morning'
    else if (isEvening) detectedCategory = 'evening'
    else if (isNight) detectedCategory = 'night'

    // Video-specific captions
    if (isVideo) {
      const videoCaptions = ["Watch this! ??", "Video vibes ??", "Caught on camera ??", "Must see ??", "Action! ???"]
      detectedCategory = 'general'
      contentTypes.general = videoCaptions
    }

    const captions = contentTypes[detectedCategory as keyof typeof contentTypes]
    const aiCaption = captions[Math.floor(Math.random() * captions.length)]

    // Smart color based on time
    const brightColors = ['#ffffff', '#ffff00', '#00ffff']
    const warmColors = ['#ffffff', '#ff8800', '#ffff00']
    const coolColors = ['#ffffff', '#00ffff', '#ff00ff']

    let smartColors = isDay ? brightColors : isEvening ? warmColors : coolColors
    const aiColor = smartColors[Math.floor(Math.random() * smartColors.length)]

    // Smart positioning
    const positions = [
      { x: 50, y: 15 }, { x: 50, y: 85 },
      { x: 20, y: 20 }, { x: 80, y: 20 },
      { x: 20, y: 80 }, { x: 80, y: 80 }
    ]
    const pos = positions[Math.floor(Math.random() * positions.length)]

    // Smart font size
    const fontSize = aiCaption.length > 20 ? 28 : aiCaption.length < 15 ? 42 : 36

    const mainText = {
      id: Date.now().toString(),
      content: aiCaption,
      x: pos.x,
      y: pos.y,
      fontSize,
      color: aiColor,
      fontFamily: fonts[Math.floor(Math.random() * fonts.length)],
      rotation: 0
    }

    // Add emoji accent 30% of the time
    const texts = [mainText]
    if (Math.random() > 0.7) {
      const emojis = ['?', '??', '?', '??', '??', '??', '??', '??']
      texts.push({
        id: (Date.now() + 1).toString(),
        content: emojis[Math.floor(Math.random() * emojis.length)],
        x: pos.x > 50 ? pos.x - 15 : pos.x + 15,
        y: pos.y > 50 ? pos.y - 10 : pos.y + 10,
        fontSize: fontSize * 0.7,
        color: aiColor,
        fontFamily: mainText.fontFamily,
        rotation: Math.random() > 0.5 ? 15 : -15
      })
    }

    setTexts(texts)
    // Auto-select the main text so user can edit immediately
    setSelectedTextId(mainText.id)
    setActiveTool('text')
  }

  return (
    <>
      <style jsx global>{`
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .safe-area-top {
            padding-top: max(12px, env(safe-area-inset-top));
          }
          .safe-area-bottom {
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
        }
        
        /* Prevent pull-to-refresh on mobile */
        body {
          overscroll-behavior-y: contain;
        }
        
        /* Better touch feedback */
        button:active {
          opacity: 0.8;
        }
      `}</style>
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Top bar - Mobile optimized */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-black/50 backdrop-blur-sm z-10 safe-area-top">
          <Button
            variant="ghost"
            size="icon"
            className="text-white h-11 w-11 sm:h-10 sm:w-10 active:scale-95 transition-transform"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-7 w-7 sm:h-6 sm:w-6" />
          </Button>

          <div className="flex gap-1.5 sm:gap-2 items-center">
            {selectedMedia && (
              <Button
                variant="ghost"
                className="text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 active:scale-95 transition-transform h-11 px-4 sm:h-10 sm:px-3"
                onClick={aiAutoCreate}
              >
                <Zap className="h-5 w-5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="text-sm sm:text-xs font-medium">AI Create</span>
              </Button>
            )}
            {selectedMusic && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
                <Music className="h-4 w-4 text-white animate-pulse" />
                <span className="text-white text-xs">Music</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white h-11 w-11 sm:h-10 sm:w-10 active:scale-95 transition-transform"
              onClick={() => {/* Download */ }}
            >
              <Download className="h-6 w-6 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {selectedMedia ? (
            <div className="relative w-full h-full max-w-md">
              {/* Media display */}
              {mediaType === 'image' ? (
                <img
                  ref={mediaRef as React.RefObject<HTMLImageElement>}
                  src={selectedMedia}
                  alt="Story"
                  className="w-full h-full object-contain"
                  style={{ filter: filters.find(f => f.value === selectedFilter)?.filter }}
                />
              ) : (
                <video
                  ref={mediaRef as React.RefObject<HTMLVideoElement>}
                  src={selectedMedia}
                  className="w-full h-full object-contain"
                  style={{ filter: filters.find(f => f.value === selectedFilter)?.filter }}
                  controls
                />
              )}

              {/* Text overlays - Mobile optimized with better touch targets */}
              {texts.map(text => (
                <div
                  key={text.id}
                  className="absolute cursor-move select-none touch-none"
                  style={{
                    left: `${text.x}%`,
                    top: `${text.y}%`,
                    transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                    fontSize: `${text.fontSize}px`,
                    color: text.color,
                    fontFamily: text.fontFamily,
                    textShadow: '2px 2px 8px rgba(0,0,0,0.9), -1px -1px 4px rgba(0,0,0,0.5)',
                    border: selectedTextId === text.id ? '2px dashed rgba(255,255,255,0.9)' : 'none',
                    padding: selectedTextId === text.id ? '12px 16px' : '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: selectedTextId === text.id ? 'rgba(0,0,0,0.3)' : 'transparent',
                    maxWidth: '85%',
                    wordWrap: 'break-word',
                    textAlign: 'center',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    lineHeight: '1.3',
                    zIndex: selectedTextId === text.id ? 20 : 10,
                    minWidth: '60px',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTextId(text.id)
                    setActiveTool('text')
                  }}
                  onTouchStart={(e) => handleDragStart(e, text.id)}
                  onMouseDown={(e) => handleDragStart(e, text.id)}
                >
                  {text.content}
                </div>
              ))}

              {/* Sticker overlays */}
              {stickers.map(sticker => (
                <div
                  key={sticker.id}
                  className="absolute cursor-move select-none touch-none"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                    fontSize: `${sticker.size}px`,
                    zIndex: selectedStickerId === sticker.id ? 20 : 10,
                    filter: selectedStickerId === sticker.id ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedStickerId(sticker.id)
                    setActiveTool('sticker')
                  }}
                  onTouchStart={(e) => handleStickerDragStart(e, sticker.id)}
                  onMouseDown={(e) => handleStickerDragStart(e, sticker.id)}
                >
                  {sticker.emoji}
                </div>
              ))}

              {/* Drawing canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: activeTool === 'draw' ? 'auto' : 'none' }}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
              />
            </div>
          ) : (
            <div className="text-center px-4">
              <Camera className="h-28 w-28 sm:h-24 sm:w-24 text-white/50 mx-auto mb-6" />
              <p className="text-white/70 mb-8 text-base sm:text-sm">Select a photo or video to create your story</p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-xs mx-auto">
                <Button
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white h-14 sm:h-11 text-base sm:text-sm active:scale-95 transition-transform"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-6 w-6 sm:h-5 sm:w-5 mr-2" />
                  Photo
                </Button>
                <Button
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white h-14 sm:h-11 text-base sm:text-sm active:scale-95 transition-transform"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="h-6 w-6 sm:h-5 sm:w-5 mr-2" />
                  Video
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleMediaSelect(e, 'image')}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleMediaSelect(e, 'video')}
        />

        {/* Tool panel - only show when media is selected */}
        {selectedMedia && (
          <>
            {/* Tools bar - Mobile optimized with labels and badges */}
            <div className="flex items-center justify-around p-3 sm:p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
              <button
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-95 ${activeTool === 'text' ? 'bg-white/20' : 'active:bg-white/10'
                  }`}
                onClick={() => {
                  setActiveTool('text')
                  addText()
                }}
              >
                <Type className="h-7 w-7 sm:h-6 sm:w-6 text-white" />
                <span className="text-white text-xs font-medium">Text</span>
                {texts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {texts.length}
                  </span>
                )}
              </button>

              <button
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-95 ${activeTool === 'draw' ? 'bg-white/20' : 'active:bg-white/10'
                  }`}
                onClick={() => setActiveTool('draw')}
              >
                <Palette className="h-7 w-7 sm:h-6 sm:w-6 text-white" />
                <span className="text-white text-xs font-medium">Draw</span>
                {drawings.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {drawings.length}
                  </span>
                )}
              </button>

              <button
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-95 ${activeTool === 'sticker' ? 'bg-white/20' : 'active:bg-white/10'
                  }`}
                onClick={() => setActiveTool('sticker')}
              >
                <Smile className="h-7 w-7 sm:h-6 sm:w-6 text-white" />
                <span className="text-white text-xs font-medium">Sticker</span>
                {stickers.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {stickers.length}
                  </span>
                )}
              </button>

              <button
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-95 ${activeTool === 'music' ? 'bg-white/20' : 'active:bg-white/10'
                  }`}
                onClick={() => setActiveTool('music')}
              >
                <Music className="h-7 w-7 sm:h-6 sm:w-6 text-white" />
                <span className="text-white text-xs font-medium">Music</span>
                {selectedMusic && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    ?
                  </span>
                )}
              </button>

              <button
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all active:scale-95 ${activeTool === 'filter' ? 'bg-white/20' : 'active:bg-white/10'
                  }`}
                onClick={() => setActiveTool('filter')}
              >
                <Sparkles className="h-7 w-7 sm:h-6 sm:w-6 text-white" />
                <span className="text-white text-xs font-medium">Filter</span>
                {selectedFilter !== 'none' && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    ?
                  </span>
                )}
              </button>
            </div>

            {/* Tool options panel - Mobile optimized */}
            {activeTool !== 'none' && (
              <div className="bg-black/90 backdrop-blur-sm p-4 max-h-64 sm:max-h-48 overflow-y-auto border-t border-white/10">
                {/* Text tool options */}
                {activeTool === 'text' && selectedTextId && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={texts.find(t => t.id === selectedTextId)?.content || ''}
                      onChange={(e) => updateText(selectedTextId, { content: e.target.value })}
                      className="w-full bg-white/10 text-white px-4 py-3 sm:py-2 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Enter text"
                    />

                    <div>
                      <p className="text-white/70 text-xs mb-2">Color</p>
                      <div className="flex gap-2.5 overflow-x-auto pb-2">
                        {colors.map(color => (
                          <button
                            key={color}
                            className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex-shrink-0 border-2 transition-all active:scale-95 ${texts.find(t => t.id === selectedTextId)?.color === color
                              ? 'border-white scale-110'
                              : 'border-transparent'
                              }`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateText(selectedTextId, { color })}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-white/70 text-xs mb-2">Font</p>
                      <select
                        value={texts.find(t => t.id === selectedTextId)?.fontFamily || 'Arial'}
                        onChange={(e) => updateText(selectedTextId, { fontFamily: e.target.value })}
                        className="w-full bg-white/10 text-white px-4 py-3 sm:py-2 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        {fonts.map(font => (
                          <option key={font} value={font} className="bg-black">{font}</option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteText(selectedTextId)}
                      className="w-full h-11 sm:h-9 text-base sm:text-sm active:scale-95 transition-transform"
                    >
                      <X className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                      Delete Text
                    </Button>
                  </div>
                )}

                {/* Draw tool options */}
                {activeTool === 'draw' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white/70 text-xs">Brush Color</p>
                        <span className="text-white text-xs">{drawColors.find(c => c.color === drawColor)?.name}</span>
                      </div>
                      <div className="flex gap-2.5 overflow-x-auto pb-2">
                        {drawColors.map(({ color, name }) => (
                          <button
                            key={color}
                            className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex-shrink-0 border-2 transition-all active:scale-95 ${drawColor === color
                              ? 'border-white scale-110'
                              : 'border-transparent'
                              }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setDrawColor(color)}
                            title={name}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white/70 text-xs">Brush Size</p>
                        <span className="text-white text-xs">{drawSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={drawSize}
                        onChange={(e) => setDrawSize(Number(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={undoDrawing}
                        disabled={drawings.length === 0}
                        className="flex-1 h-11 sm:h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 active:scale-95 transition-transform"
                      >
                        <Undo className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                        Undo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearDrawings}
                        disabled={drawings.length === 0}
                        className="flex-1 h-11 sm:h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 active:scale-95 transition-transform"
                      >
                        <Eraser className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sticker options */}
                {activeTool === 'sticker' && (
                  <div className="space-y-3">
                    {selectedStickerId && (
                      <div className="space-y-3 pb-3 border-b border-white/10">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white/70 text-xs">Size</p>
                            <span className="text-white text-xs">{stickers.find(s => s.id === selectedStickerId)?.size}px</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="120"
                            value={stickers.find(s => s.id === selectedStickerId)?.size || 60}
                            onChange={(e) => updateSticker(selectedStickerId, { size: Number(e.target.value) })}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSticker(selectedStickerId)}
                          className="w-full h-11 sm:h-9 active:scale-95 transition-transform"
                        >
                          <X className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                          Delete Sticker
                        </Button>
                      </div>
                    )}

                    <div>
                      <p className="text-white/70 text-xs mb-3">Choose Sticker</p>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {Object.entries(stickerCategories).map(([category, emojis]) => (
                          <div key={category}>
                            <p className="text-white/50 text-xs mb-2 capitalize">{category}</p>
                            <div className="grid grid-cols-6 gap-2">
                              {emojis.map((emoji, idx) => (
                                <button
                                  key={idx}
                                  className="text-3xl sm:text-2xl p-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                                  onClick={() => addSticker(emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Music options */}
                {activeTool === 'music' && (
                  <div className="space-y-3">
                    <p className="text-white/70 text-xs mb-3">Choose Music</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {musicTracks.map(track => (
                        <button
                          key={track.id}
                          className={`w-full p-3 rounded-lg text-left transition-all active:scale-95 ${selectedMusic === track.id
                            ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 ring-2 ring-white/50'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                          onClick={() => setSelectedMusic(track.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{track.name}</p>
                              <p className="text-white/60 text-xs">{track.artist}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-xs">{track.duration}</span>
                              {selectedMusic === track.id && (
                                <Music className="h-4 w-4 text-white animate-pulse" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedMusic && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMusic(null)}
                        className="w-full h-11 sm:h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 active:scale-95 transition-transform"
                      >
                        <X className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                        Remove Music
                      </Button>
                    )}
                  </div>
                )}

                {/* Filter options */}
                {activeTool === 'filter' && (
                  <div>
                    <p className="text-white/70 text-xs mb-3">Choose Filter</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {filters.map(filter => (
                        <button
                          key={filter.value}
                          className={`p-3 sm:p-2 rounded-lg text-white text-sm sm:text-xs font-medium transition-all active:scale-95 ${selectedFilter === filter.value ? 'bg-white/30 ring-2 ring-white/50' : 'bg-white/10'
                            }`}
                          onClick={() => setSelectedFilter(filter.value)}
                        >
                          {filter.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Share button - Mobile optimized */}
            <div className="p-3 sm:p-4 bg-black/50 backdrop-blur-sm safe-area-bottom border-t border-white/10">
              <Button
                size="lg"
                className="w-full h-14 sm:h-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 text-base sm:text-sm font-semibold shadow-lg active:scale-[0.98] transition-all"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Send className="h-6 w-6 sm:h-5 sm:w-5 mr-2" />
                {isSubmitting ? 'Sharing...' : 'Share to Story'}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
