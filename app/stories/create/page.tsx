"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Maximize2, Type, Smile, Sparkles, MoreHorizontal, X, Search, Music,
  Sticker, Filter, RotateCcw, ZoomIn, Move
} from "lucide-react"
import {
  CountdownSticker,
  PollSticker,
  QuestionSticker,
  SliderSticker,
  LocationSticker,
  MentionSticker,
  HashtagSticker,
  LinkSticker
} from "@/components/stories/AdvancedStickers"
import { extractDominantColor } from "@/lib/color-extractor"

export default function CreateInstagramStoryPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  // Set mobile viewport on mount
  useEffect(() => {
    // Prevent zoom on double tap
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchstart', preventZoom, { passive: false })

    return () => {
      document.removeEventListener('touchstart', preventZoom)
    }
  }, [])

  // Media
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [dominantColor, setDominantColor] = useState<string>('#8b5cf6') // Default purple

  // UI State
  const [activePanel, setActivePanel] = useState<'none' | 'text' | 'stickers' | 'filters' | 'music' | 'menu'>('none')

  // Text elements with touch support
  const [texts, setTexts] = useState<Array<{
    id: string
    content: string
    x: number
    y: number
    fontSize: number
    color: string
    style: 'modern' | 'classic' | 'signature'
    rotation: number
    bold?: boolean
    alignment?: 'left' | 'center' | 'right'
  }>>([])
  const [editingText, setEditingText] = useState('')
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)

  // Text styling states
  const [textStyle, setTextStyle] = useState<'modern' | 'classic' | 'signature'>('modern')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center')
  const [textBackground, setTextBackground] = useState<'none' | 'solid' | 'gradient'>('none')
  const [textBold, setTextBold] = useState(false)
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium')

  // Inline text editing states
  const [isInlineEditing, setIsInlineEditing] = useState(false)
  const [inlineTextPosition, setInlineTextPosition] = useState<{ x: number, y: number } | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showAnimationPicker, setShowAnimationPicker] = useState(false)
  const [textAnimation, setTextAnimation] = useState<'none' | 'fade' | 'slideUp' | 'zoom' | 'bounce'>('none')

  // Touch gesture states
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPinchDistance, setInitialPinchDistance] = useState(0)
  const [initialFontSize, setInitialFontSize] = useState(0)

  // Delete zone
  const [showDeleteZone, setShowDeleteZone] = useState(false)
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false)

  // Stickers
  const [stickers, setStickers] = useState<Array<{
    id: string
    type: string
    data: any
    x: number
    y: number
    size: number
    rotation: number
  }>>([])
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)

  // Image manipulation states
  const [imageScale, setImageScale] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [imageRotation, setImageRotation] = useState(0)
  const [isManipulatingImage, setIsManipulatingImage] = useState(false)
  const [imageInitialPinchDistance, setImageInitialPinchDistance] = useState(0)
  const [imageInitialScale, setImageInitialScale] = useState(1)
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)
  const lastAngleRef = useRef<number>(0)
  const rotationRef = useRef<number>(0)

  // Filters
  const [selectedFilter, setSelectedFilter] = useState('none')
  const filters = [
    { name: 'No effect', value: 'none', filter: '' },
    { name: 'Clarendon', value: 'clarendon', filter: 'contrast(1.2) saturate(1.35)' },
    { name: 'Gingham', value: 'gingham', filter: 'brightness(1.05) hue-rotate(-10deg)' },
    { name: 'Moon', value: 'moon', filter: 'grayscale(1) contrast(1.1)' },
  ]

  // Music API
  const [musicQuery, setMusicQuery] = useState('')
  const [musicResults, setMusicResults] = useState<any[]>([])
  const [selectedMusic, setSelectedMusic] = useState<any>(null)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false)
  const [isPlayingOnStory, setIsPlayingOnStory] = useState(false)

  // Interactive Sticker States
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState<any[]>([])
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [showQuestionSticker, setShowQuestionSticker] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [showHashtagInput, setShowHashtagInput] = useState(false)
  const [hashtagText, setHashtagText] = useState('')
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownName, setCountdownName] = useState('')
  const [countdownDate, setCountdownDate] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [showSlider, setShowSlider] = useState(false)
  const [sliderQuestion, setSliderQuestion] = useState('')
  const [sliderEmoji, setSliderEmoji] = useState('😍')
  const audioRef = useRef<HTMLAudioElement>(null)
  const storyAudioRef = useRef<HTMLAudioElement>(null)

  // Video controls
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [isVideoMuted, setIsVideoMuted] = useState(true) // Video audio muted by default

  // Upload states
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [shareOption, setShareOption] = useState<'your-story' | 'friends' | null>(null)

  // Swipe to change filter states (touch + mouse)
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [swipeStartY, setSwipeStartY] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's image or video
    if (file.type.startsWith('image/')) {
      setMediaType('image')
    } else if (file.type.startsWith('video/')) {
      setMediaType('video')
    }

    const mediaUrl = URL.createObjectURL(file)
    setSelectedMedia(mediaUrl)

    // Extract dominant color from image for sticker theming
    if (file.type.startsWith('image/')) {
      extractDominantColor(mediaUrl).then(color => {
        setDominantColor(color)
      })
    }

    // Reset image manipulation
    setImageScale(1)
    setImagePosition({ x: 0, y: 0 })
  }

  // Image manipulation handlers
  const handleImageTouchStart = (e: React.TouchEvent) => {
    // Don't manipulate if dragging text/stickers
    if (selectedTextId || selectedStickerId) return

    if (e.touches.length === 1) {
      // Single finger - pan image
      setIsManipulatingImage(true)
      const touch = e.touches[0]
      setImageDragStart({ x: touch.clientX, y: touch.clientY })
      if ('vibrate' in navigator) navigator.vibrate(5)
    } else if (e.touches.length === 2) {
      // Two fingers - zoom & rotate image
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      // Initialize distance for zoom
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      setImageInitialPinchDistance(distance)
      setImageInitialScale(imageScale)

      // Initialize angle for rotation
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      )
      lastAngleRef.current = angle
      rotationRef.current = imageRotation

      setIsManipulatingImage(true)
      if ('vibrate' in navigator) navigator.vibrate(10)
    }
  }

  const handleImageTouchMove = (e: React.TouchEvent) => {
    if (!isManipulatingImage) return

    if (e.touches.length === 1) {
      // Pan image
      const touch = e.touches[0]
      const deltaX = touch.clientX - imageDragStart.x
      const deltaY = touch.clientY - imageDragStart.y

      setImagePosition({
        x: imagePosition.x + deltaX,
        y: imagePosition.y + deltaY
      })

      setImageDragStart({ x: touch.clientX, y: touch.clientY })
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      // Calculate distance for zoom
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      const scale = distance / imageInitialPinchDistance
      const newScale = Math.max(0.3, Math.min(5, imageInitialScale * scale))
      setImageScale(newScale)

      // Calculate current angle for rotation (in radians)
      const currentAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      )

      // Calculate angle difference
      let angleDiff = currentAngle - lastAngleRef.current

      // Normalize angle difference to -PI to PI
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

      // Update rotation (convert to degrees)
      const newRotation = rotationRef.current + (angleDiff * 180 / Math.PI)
      rotationRef.current = newRotation
      setImageRotation(newRotation)

      // Update last angle
      lastAngleRef.current = currentAngle
    }
  }

  const handleImageTouchEnd = () => {
    setIsManipulatingImage(false)
  }

  // Text functions
  const addText = () => {
    setActivePanel('text')
  }

  const saveText = () => {
    if (!editingText.trim()) {
      setActivePanel('none')
      return
    }

    const fontSize = textSize === 'small' ? 24 : textSize === 'large' ? 48 : 32

    if (selectedTextId) {
      // Update existing text
      setTexts(texts.map(t =>
        t.id === selectedTextId ? {
          ...t,
          content: editingText,
          color: textColor,
          style: textStyle,
          fontSize,
          bold: textBold,
          alignment: textAlignment
        } : t
      ))
    } else {
      // Add new text
      const newText = {
        id: Date.now().toString(),
        content: editingText,
        x: 50,
        y: 40,
        fontSize,
        color: textColor,
        style: textStyle,
        rotation: 0,
        bold: textBold,
        alignment: textAlignment
      }
      setTexts([...texts, newText])
    }

    setEditingText('')
    setSelectedTextId(null)
    setTextColor('#FFFFFF')
    setTextStyle('modern')
    setTextBold(false)
    setTextSize('medium')
    setTextAlignment('center')
    setTextBackground('none')
    setActivePanel('none')
  }

  const deleteText = (id: string) => {
    setTexts(texts.filter(t => t.id !== id))
    setSelectedTextId(null)
  }

  // Canvas tap handler for inline text
  const handleCanvasTap = (e: React.TouchEvent) => {
    if (!isInlineEditing) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const touch = e.touches[0]
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    const y = ((touch.clientY - rect.top) / rect.height) * 100

    setInlineTextPosition({ x, y })
    setEditingText('')
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  // Touch handlers for text
  const [textTapStart, setTextTapStart] = useState({ x: 0, y: 0, time: 0 })

  const handleTextTouchStart = (e: React.TouchEvent, textId: string) => {
    e.stopPropagation()
    setSelectedTextId(textId)

    if (e.touches.length === 1) {
      // Single finger - could be tap or drag
      const touch = e.touches[0]
      setTextTapStart({ x: touch.clientX, y: touch.clientY, time: Date.now() })
      setDragStart({ x: touch.clientX, y: touch.clientY })
      if ('vibrate' in navigator) navigator.vibrate(10)
    } else if (e.touches.length === 2) {
      // Two fingers - resize
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      const text = texts.find(t => t.id === textId)
      if (text) {
        setInitialPinchDistance(distance)
        setInitialFontSize(text.fontSize)
        if ('vibrate' in navigator) navigator.vibrate(15)
      }
    }
  }

  const handleTextTouchMove = (e: React.TouchEvent) => {
    if (!selectedTextId) return

    const text = texts.find(t => t.id === selectedTextId)
    if (!text) return

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      const distance = Math.hypot(deltaX, deltaY)

      // Only start dragging if moved more than 10px
      if (distance > 10 && !isDragging) {
        setIsDragging(true)
        setShowDeleteZone(true)
      }

      if (isDragging) {
        // Drag
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const percentX = (deltaX / rect.width) * 100
        const percentY = (deltaY / rect.height) * 100

        setTexts(texts.map(t =>
          t.id === selectedTextId
            ? { ...t, x: Math.max(0, Math.min(100, t.x + percentX)), y: Math.max(0, Math.min(100, t.y + percentY)) }
            : t
        ))

        setDragStart({ x: touch.clientX, y: touch.clientY })

        // Check delete zone
        const isInDeleteZone = touch.clientY > window.innerHeight * 0.75
        setIsOverDeleteZone(isInDeleteZone)
        if (isInDeleteZone && 'vibrate' in navigator) navigator.vibrate(5)
      }
    } else if (e.touches.length === 2) {
      // Pinch to resize
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      const scale = distance / initialPinchDistance
      const newSize = Math.max(16, Math.min(72, initialFontSize * scale))

      setTexts(texts.map(t =>
        t.id === selectedTextId ? { ...t, fontSize: newSize } : t
      ))
    }
  }

  const handleTextTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - textTapStart.x
    const deltaY = touch.clientY - textTapStart.y
    const distance = Math.hypot(deltaX, deltaY)
    const timeDiff = Date.now() - textTapStart.time

    // Detect tap: moved less than 10px and took less than 300ms
    const isTap = distance < 10 && timeDiff < 300

    if (isTap && selectedTextId && !isOverDeleteZone) {
      // Tap detected - open editor
      const text = texts.find(t => t.id === selectedTextId)
      if (text) {
        setEditingText(text.content)
        setTextColor(text.color)
        setTextStyle(text.style)
        setTextBold(text.bold || false)
        setTextAlignment(text.alignment || 'center')
        setTextSize(text.fontSize <= 24 ? 'small' : text.fontSize >= 48 ? 'large' : 'medium')
        setActivePanel('text')
      }
    } else if (isOverDeleteZone && selectedTextId) {
      // Delete text
      deleteText(selectedTextId)
      if ('vibrate' in navigator) navigator.vibrate(50)
    }

    setIsDragging(false)
    setShowDeleteZone(false)
    setIsOverDeleteZone(false)
  }

  // Touch handlers for stickers
  const handleStickerTouchStart = (e: React.TouchEvent, stickerId: string) => {
    e.stopPropagation()
    setSelectedStickerId(stickerId)
    setSelectedTextId(null) // Deselect text

    if (e.touches.length === 1) {
      // Single finger - drag
      setIsDragging(true)
      setShowDeleteZone(true)
      const touch = e.touches[0]
      setDragStart({ x: touch.clientX, y: touch.clientY })
      if ('vibrate' in navigator) navigator.vibrate(10)
    } else if (e.touches.length === 2) {
      // Two fingers - resize AND rotate
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      // Calculate distance for resize
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      // Calculate angle for rotation
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * (180 / Math.PI)

      const sticker = stickers.find(s => s.id === stickerId)
      if (sticker) {
        setInitialPinchDistance(distance)
        setInitialFontSize(sticker.size)
        lastAngleRef.current = angle
        rotationRef.current = sticker.rotation
        if ('vibrate' in navigator) navigator.vibrate(15)
      }
    }
  }

  const handleStickerTouchMove = (e: React.TouchEvent) => {
    if (!selectedStickerId) return

    const sticker = stickers.find(s => s.id === selectedStickerId)
    if (!sticker) return

    if (e.touches.length === 1 && isDragging) {
      // Single finger - drag
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const percentX = (deltaX / rect.width) * 100
      const percentY = (deltaY / rect.height) * 100

      // Use requestAnimationFrame for smooth dragging
      requestAnimationFrame(() => {
        setStickers(prev => prev.map(s =>
          s.id === selectedStickerId
            ? { ...s, x: Math.max(0, Math.min(100, s.x + percentX)), y: Math.max(0, Math.min(100, s.y + percentY)) }
            : s
        ))
      })

      setDragStart({ x: touch.clientX, y: touch.clientY })

      // Check delete zone
      const isInDeleteZone = touch.clientY > window.innerHeight * 0.75
      setIsOverDeleteZone(isInDeleteZone)
      if (isInDeleteZone && 'vibrate' in navigator) navigator.vibrate(5)

    } else if (e.touches.length === 2) {
      // Two fingers - resize AND rotate simultaneously
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      // Calculate new distance for resize
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      // Calculate new angle for rotation
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * (180 / Math.PI)

      // Calculate scale for resize
      const scale = distance / initialPinchDistance
      const newSize = Math.max(30, Math.min(150, initialFontSize * scale))

      // Calculate rotation delta
      const angleDelta = angle - lastAngleRef.current
      const newRotation = rotationRef.current + angleDelta

      // Use requestAnimationFrame for smooth transformation
      requestAnimationFrame(() => {
        setStickers(prev => prev.map(s =>
          s.id === selectedStickerId
            ? { ...s, size: newSize, rotation: newRotation }
            : s
        ))
      })
    }
  }

  const handleStickerTouchEnd = () => {
    if (isOverDeleteZone && selectedStickerId) {
      const deletedSticker = stickers.find(s => s.id === selectedStickerId)
      const remainingStickers = stickers.filter(s => s.id !== selectedStickerId)

      // If deleting a music sticker, check if any music stickers remain
      if (deletedSticker?.type === 'music') {
        const hasMusicStickers = remainingStickers.some(s => s.type === 'music')

        // Only stop music if no music stickers remain
        if (!hasMusicStickers && storyAudioRef.current) {
          storyAudioRef.current.pause()
          storyAudioRef.current.src = ''
          setIsPlayingOnStory(false)
          setSelectedMusic(null)
        }
      }

      setStickers(remainingStickers)
      setSelectedStickerId(null)
      if ('vibrate' in navigator) navigator.vibrate(50)
    }

    setIsDragging(false)
    setShowDeleteZone(false)
    setIsOverDeleteZone(false)
  }

  // Music sticker style state
  const [musicStickerStyle, setMusicStickerStyle] = useState<'default' | 'compact' | 'album' | 'wave'>('default')
  const [showMusicSticker, setShowMusicSticker] = useState(true)

  // Sticker functions - Ultra-optimized for instant appearance
  const addSticker = (type: string, data: any) => {
    // Create sticker object immediately with dynamic color
    const newSticker = {
      id: `${Date.now()}-${Math.random()}`, // Unique ID
      type,
      data: type === 'music'
        ? { ...data, style: musicStickerStyle, color: dominantColor }
        : { ...data, color: dominantColor }, // Add dominant color to all stickers
      x: 50,
      y: type === 'music' ? 30 : type === 'poll' || type === 'question' || type === 'countdown' || type === 'slider' ? 40 : 50,
      size: type === 'poll' || type === 'question' || type === 'countdown' || type === 'slider' ? 70 : 60,
      rotation: 0
    }

    // INSTANT update - no delay, no transition
    // This happens synchronously before any re-render
    setStickers(prev => [...prev, newSticker])
    setSelectedStickerId(newSticker.id)
    setActivePanel('none')

    // Haptic feedback (non-blocking)
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }
  }

  // Interactive Sticker Functions - Optimized for instant appearance
  const addLocationSticker = (location: string) => {
    // Close modal immediately
    setShowLocationPicker(false)
    // Add sticker instantly (no delay)
    requestAnimationFrame(() => {
      addSticker('location', { location })
      setLocationQuery('')
    })
  }

  const addMentionSticker = (username: string) => {
    // Close modal immediately
    setShowMentionPicker(false)
    // Add sticker instantly
    requestAnimationFrame(() => {
      addSticker('mention', { username })
      setMentionQuery('')
    })
  }

  const addPollSticker = () => {
    if (pollQuestion && pollOptions[0] && pollOptions[1]) {
      // Close modal immediately
      setShowPollCreator(false)
      // Add sticker instantly
      requestAnimationFrame(() => {
        addSticker('poll', { question: pollQuestion, options: pollOptions })
        setPollQuestion('')
        setPollOptions(['', ''])
      })
    }
  }

  const addQuestionSticker = () => {
    if (questionText) {
      // Close modal immediately
      setShowQuestionSticker(false)
      // Add sticker instantly
      requestAnimationFrame(() => {
        addSticker('question', { question: questionText })
        setQuestionText('')
      })
    }
  }

  const addHashtagSticker = () => {
    if (hashtagText) {
      // Close modal immediately
      setShowHashtagInput(false)
      // Add sticker instantly
      requestAnimationFrame(() => {
        addSticker('hashtag', { hashtag: hashtagText.startsWith('#') ? hashtagText : `#${hashtagText}` })
        setHashtagText('')
      })
    }
  }

  const addCountdownSticker = () => {
    if (countdownName && countdownDate) {
      // Close modal immediately
      setShowCountdown(false)
      // Add sticker instantly
      requestAnimationFrame(() => {
        addSticker('countdown', { name: countdownName, endDate: countdownDate })
        setCountdownName('')
        setCountdownDate('')
      })
    }
  }

  const addLinkSticker = () => {
    if (linkUrl) {
      // Close modal immediately
      setShowLinkInput(false)
      // Add sticker instantly
      requestAnimationFrame(() => {
        addSticker('link', { url: linkUrl, text: linkText || 'See more' })
        setLinkUrl('')
        setLinkText('')
      })
    }
  }

  const addSliderSticker = () => {
    if (sliderQuestion) {
      // Close modal immediately
      setShowSlider(false)
      // Add sticker instantly
      requestAnimationFrame(() => {
        addSticker('slider', { question: sliderQuestion, emoji: sliderEmoji })
        setSliderQuestion('')
        setSliderEmoji('😍')
      })
    }
  }

  // Search users for mentions
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setMentionResults([])
      return
    }
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setMentionResults(data.users || [])
    } catch (error) {
      console.error('User search error:', error)
      setMentionResults([])
    }
  }

  // Music API integration (SoundCloud via public API)
  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      setMusicResults([])
      return
    }

    try {
      // Using SoundCloud public search (no API key needed for basic search)
      // Alternative: Use iTunes as fallback
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`
      )
      const data = await response.json()

      // Format results for display
      const formattedResults = data.results?.map((track: any) => ({
        id: track.trackId,
        title: track.trackName,
        artist: track.artistName,
        artwork: track.artworkUrl100?.replace('100x100', '300x300') || track.artworkUrl100,
        duration: track.trackTimeMillis,
        previewUrl: track.previewUrl
      })) || []

      setMusicResults(formattedResults)
    } catch (error) {
      console.error('Music search error:', error)
      setMusicResults([])
    }
  }

  // Sticker API integration (Stipop)
  const [stickerPacks, setStickerPacks] = useState<any[]>([])
  const [stickerQuery, setStickerQuery] = useState('')
  const [loadingStickers, setLoadingStickers] = useState(false)

  const searchStickers = async (query: string) => {
    setLoadingStickers(true)
    try {
      let allStickers: any[] = []

      // 1. Tenor API (Google) - PRIMARY - Most reliable
      try {
        const tenorKey = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'
        const tenorUrl = query.trim()
          ? `https://tenor.googleapis.com/v2/search?key=${tenorKey}&q=${encodeURIComponent(query)}&media_filter=sticker&limit=30&contentfilter=high`
          : `https://tenor.googleapis.com/v2/featured?key=${tenorKey}&media_filter=sticker&limit=30&contentfilter=high`

        const tenorResponse = await fetch(tenorUrl)
        const tenorData = await tenorResponse.json()
        const tenorStickers = (tenorData.results || []).map((sticker: any) => {
          // Tenor API structure: media_formats contains different formats
          const gifUrl = sticker.media_formats?.gif?.url ||
            sticker.media_formats?.mediumgif?.url ||
            sticker.media_formats?.tinygif?.url
          const previewUrl = sticker.media_formats?.tinygif?.url ||
            sticker.media_formats?.nanogif?.url ||
            gifUrl

          return {
            id: sticker.id,
            images: {
              fixed_height: {
                url: gifUrl,
                width: sticker.media_formats?.gif?.dims?.[0] || 200,
                height: sticker.media_formats?.gif?.dims?.[1] || 200,
              },
              fixed_height_small: {
                url: previewUrl,
              }
            },
            title: sticker.content_description || 'Sticker',
            source: 'tenor'
          }
        }).filter((s: any) => s.images.fixed_height.url) // Only include stickers with valid URLs
        allStickers = [...allStickers, ...tenorStickers]
      } catch (error) {
        console.error('Tenor error:', error)
      }

      // 2. Tenor GIFs - SECONDARY - Additional variety
      try {
        const tenorKey = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'
        const gifUrl = query.trim()
          ? `https://tenor.googleapis.com/v2/search?key=${tenorKey}&q=${encodeURIComponent(query)}&limit=18&contentfilter=high`
          : `https://tenor.googleapis.com/v2/featured?key=${tenorKey}&limit=18&contentfilter=high`

        const gifResponse = await fetch(gifUrl)
        const gifData = await gifResponse.json()
        const gifStickers = (gifData.results || []).map((gif: any) => {
          const gifUrl = gif.media_formats?.gif?.url ||
            gif.media_formats?.mediumgif?.url ||
            gif.media_formats?.tinygif?.url
          const previewUrl = gif.media_formats?.tinygif?.url ||
            gif.media_formats?.nanogif?.url ||
            gifUrl

          return {
            id: gif.id,
            images: {
              fixed_height: {
                url: gifUrl,
                width: gif.media_formats?.gif?.dims?.[0] || 200,
                height: gif.media_formats?.gif?.dims?.[1] || 200,
              },
              fixed_height_small: {
                url: previewUrl,
              }
            },
            title: gif.content_description || 'GIF',
            source: 'tenor-gif'
          }
        }).filter((g: any) => g.images.fixed_height.url) // Only include GIFs with valid URLs
        allStickers = [...allStickers, ...gifStickers]
      } catch (error) {
        console.error('Tenor GIF error:', error)
      }

      // Limit results
      setStickerPacks(allStickers.slice(0, 48))

    } catch (error) {
      console.error('Sticker search error:', error)
      setStickerPacks([])
    } finally {
      setLoadingStickers(false)
    }
  }

  // Load trending stickers on mount
  useEffect(() => {
    searchStickers('')
  }, [])

  // Play music preview
  const playMusicPreview = (previewUrl: string) => {
    if (!audioRef.current) return

    if (isPlayingPreview && audioRef.current.src === previewUrl) {
      // Pause if already playing this track
      audioRef.current.pause()
      setIsPlayingPreview(false)
    } else {
      // Play new track
      audioRef.current.src = previewUrl
      audioRef.current.play()
        .then(() => setIsPlayingPreview(true))
        .catch(err => console.error('Audio play error:', err))
    }
  }

  // Swipe to change filter
  const handleFilterSwipe = (direction: 'left' | 'right') => {
    const currentIndex = filters.findIndex(f => f.value === selectedFilter)
    let newIndex: number

    if (direction === 'left') {
      // Swipe left = next filter
      newIndex = currentIndex + 1 >= filters.length ? 0 : currentIndex + 1
    } else {
      // Swipe right = previous filter
      newIndex = currentIndex - 1 < 0 ? filters.length - 1 : currentIndex - 1
    }

    setSelectedFilter(filters[newIndex].value)

    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  const handleCanvasSwipeStart = (e: React.TouchEvent) => {
    // Only detect swipe when not dragging text/stickers and not manipulating image
    if (selectedTextId || selectedStickerId || isManipulatingImage) return

    const touch = e.touches[0]
    setSwipeStartX(touch.clientX)
    setSwipeStartY(touch.clientY)
    setIsSwiping(false)
  }

  const handleCanvasSwipeMove = (e: React.TouchEvent) => {
    if (selectedTextId || selectedStickerId || isManipulatingImage) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeStartX
    const deltaY = touch.clientY - swipeStartY

    // Detect horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      setIsSwiping(true)
    }
  }

  const handleCanvasSwipeEnd = (e: React.TouchEvent) => {
    if (!isSwiping || selectedTextId || selectedStickerId || isManipulatingImage) {
      setIsSwiping(false)
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - swipeStartX
    const deltaY = touch.clientY - swipeStartY

    // Horizontal swipe detected
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
      if (deltaX > 0) {
        // Swiped right
        handleFilterSwipe('right')
      } else {
        // Swiped left
        handleFilterSwipe('left')
      }
    }

    setIsSwiping(false)
  }

  // Mouse handlers for desktop
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only detect swipe when not dragging text/stickers
    if (selectedTextId || selectedStickerId) return

    setIsMouseDown(true)
    setSwipeStartX(e.clientX)
    setSwipeStartY(e.clientY)
    setIsSwiping(false)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || selectedTextId || selectedStickerId) return

    const deltaX = e.clientX - swipeStartX
    const deltaY = e.clientY - swipeStartY

    // Detect horizontal drag (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      setIsSwiping(true)
    }
  }

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown) return

    if (isSwiping && !selectedTextId && !selectedStickerId) {
      const deltaX = e.clientX - swipeStartX
      const deltaY = e.clientY - swipeStartY

      // Horizontal drag detected
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
        if (deltaX > 0) {
          // Dragged right
          handleFilterSwipe('right')
        } else {
          // Dragged left
          handleFilterSwipe('left')
        }
      }
    }

    setIsMouseDown(false)
    setIsSwiping(false)
  }

  const handleCanvasMouseLeave = () => {
    setIsMouseDown(false)
    setIsSwiping(false)
  }

  // Upload story function
  const uploadStory = async (shareType: 'your-story' | 'friends') => {
    if (!selectedMedia) {
      alert('Please select a photo or video first')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setShareOption(shareType)

    try {
      // Step 1: Upload media to Cloudinary (20%)
      setUploadProgress(20)
      const mediaBlob = await fetch(selectedMedia).then(r => r.blob())
      const formData = new FormData()
      formData.append('file', mediaBlob)
      formData.append('upload_preset', 'profilePicsUnsigned') // Use existing preset
      formData.append('folder', 'stories')

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dcm470yhl/${mediaType === 'video' ? 'video' : 'image'}/upload`
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload media')
      }

      const uploadData = await uploadResponse.json()
      const mediaUrl = uploadData.secure_url

      // Step 2: Prepare story data (50%)
      setUploadProgress(50)

      // Prepare stickers data (filter out music stickers for API)
      const stickersData = stickers.map(sticker => ({
        id: sticker.id,
        type: sticker.type,
        data: sticker.data,
        x: sticker.x,
        y: sticker.y,
        size: sticker.size,
        rotation: sticker.rotation
      }))

      // Step 3: Create story via API (80%)
      setUploadProgress(80)
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]

      const storyData = {
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption.trim() || null,
        texts: texts,
        stickers: stickersData,
        filter: selectedFilter,
        music: selectedMusic ? {
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          artwork: selectedMusic.artwork,
          previewUrl: selectedMusic.previewUrl
        } : null,
        share_type: shareType // 'your-story' or 'friends'
      }

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(storyData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create story')
      }

      const createdStory = await response.json()

      // Step 4: Notify mentioned users (90%)
      setUploadProgress(90)
      const mentionStickers = stickersData.filter(s => s.type === 'mention')
      if (mentionStickers.length > 0) {
        const mentionedUsernames = mentionStickers.map(s => s.data.username)
        try {
          await fetch(`/api/stories/${createdStory.id}/mentions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mentionedUsernames })
          })
        } catch (error) {
          console.error('Failed to notify mentions:', error)
          // Don't fail the whole upload if mentions fail
        }
      }

      // Step 5: Success! (100%)
      setUploadProgress(100)

      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate([50, 100, 50])

      // Show success message
      setTimeout(() => {
        alert(`Story shared to ${shareType === 'your-story' ? 'Your Story' : 'Friends'}!`)
        // Navigate to stories page
        startTransition(() => {
          router.push('/stories')
        })
      }, 500)

    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload story. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
      setShareOption(null)
    }
  }

  // Stop music when panel closes
  useEffect(() => {
    if (activePanel !== 'music' && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingPreview(false)
    }
  }, [activePanel])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (musicQuery) searchMusic(musicQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [musicQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchStickers(stickerQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [stickerQuery])

  // Prevent scroll when dragging
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) e.preventDefault()
    }
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => document.removeEventListener('touchmove', handleTouchMove)
  }, [isDragging])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden" style={{
      width: '100vw',
      height: '100dvh', // Dynamic viewport height for mobile
      touchAction: 'none',
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none'
    }}>
      {!selectedMedia ? (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
          <div className="text-center mb-4">
            <h2 className="text-white text-2xl font-bold mb-2">Create Story</h2>
            <p className="text-gray-400 text-sm">Share a photo or video</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-lg font-bold active:scale-95 transition-all shadow-2xl flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose Photo or Video
          </button>

          <div className="flex gap-4 text-gray-500 text-xs">
            <span>📷 Photos</span>
            <span>•</span>
            <span>🎥 Videos</span>
            <span>•</span>
            <span>Max 60s</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleMediaSelect}
          />
        </div>
      ) : (
        <>
          {/* Story Background Music Audio */}
          <audio ref={storyAudioRef} loop />

          {/* Top Bar - Image 1 & 6 */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              {/* Music Play/Pause Control */}
              {selectedMusic && (
                <button
                  onClick={() => {
                    if (storyAudioRef.current) {
                      if (isPlayingOnStory) {
                        storyAudioRef.current.pause()
                        setIsPlayingOnStory(false)
                      } else {
                        storyAudioRef.current.play()
                        setIsPlayingOnStory(true)
                      }
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform bg-purple-500 rounded-full"
                  title={isPlayingOnStory ? "Pause Music" : "Play Music"}
                >
                  {isPlayingOnStory ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Video Mute/Unmute Control - Only show for videos */}
              {mediaType === 'video' && (
                <button
                  onClick={() => {
                    setIsVideoMuted(!isVideoMuted)
                    if (videoRef.current) {
                      videoRef.current.muted = !isVideoMuted
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title={isVideoMuted ? "Unmute Video" : "Mute Video"}
                >
                  {isVideoMuted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}

              {/* Reset Image Position, Scale & Rotation - Advanced Icon */}
              <button
                onClick={() => {
                  setImageScale(1)
                  setImagePosition({ x: 0, y: 0 })
                  setImageRotation(0)
                  rotationRef.current = 0
                }}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform bg-black/30 rounded-full"
                title="Reset Image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Text Tool - Advanced Typography Icon */}
              <button
                onClick={() => {
                  // Enable inline editing mode
                  setIsInlineEditing(true)
                  setActivePanel('none')
                }}
                className={`w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform ${isInlineEditing ? 'bg-white/20 rounded-full' : ''
                  }`}
                title="Add Text"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.6 3.32L10.4 3.32C10.72 3.32 11 3.6 11 3.92L11 4.68L13 4.68L13 3.92C13 3.6 13.28 3.32 13.6 3.32L14.4 3.32C14.72 3.32 15 3.6 15 3.92L15 4.68L17.4 4.68C18.28 4.68 19 5.4 19 6.28L19 18.4C19 19.28 18.28 20 17.4 20L6.6 20C5.72 20 5 19.28 5 18.4L5 6.28C5 5.4 5.72 4.68 6.6 4.68L9 4.68L9 3.92C9 3.6 9.28 3.32 9.6 3.32ZM7 7.68L7 17L17 17L17 7.68L7 7.68ZM9.5 9.5L14.5 9.5L14.5 11L13 11L13 15L11 15L11 11L9.5 11L9.5 9.5Z" />
                </svg>
              </button>

              {/* Stickers - Advanced Emoji Icon */}
              <button
                onClick={() => setActivePanel(activePanel === 'stickers' ? 'none' : 'stickers')}
                className={`w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform ${activePanel === 'stickers' ? 'bg-white/20 rounded-full' : ''
                  }`}
                title="Stickers"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <circle cx="9" cy="9" r="1" fill="currentColor" />
                  <circle cx="15" cy="9" r="1" fill="currentColor" />
                </svg>
              </button>

              {/* Filters - Advanced Magic Wand Icon */}
              <button
                onClick={() => setActivePanel(activePanel === 'filters' ? 'none' : 'filters')}
                className={`w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform ${activePanel === 'filters' ? 'bg-white/20 rounded-full' : ''
                  }`}
                title="Filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>

              {/* Music */}
              <button
                onClick={() => setActivePanel(activePanel === 'music' ? 'none' : 'music')}
                className={`w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform ${activePanel === 'music' ? 'bg-white/20 rounded-full' : ''
                  }`}
                title="Music"
              >
                <Music className="w-5 h-5" />
              </button>

              {/* Menu */}
              <button
                onClick={() => setActivePanel(activePanel === 'menu' ? 'none' : 'menu')}
                className={`w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform ${activePanel === 'menu' ? 'bg-white/20 rounded-full' : ''
                  }`}
                title="More Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas - Image/Video with overlays */}
          <div
            ref={canvasRef}
            className="relative w-full h-full"
            style={{ touchAction: isInlineEditing ? 'auto' : 'none' }}
            onTouchStart={(e) => {
              if (isInlineEditing && !inlineTextPosition) {
                handleCanvasTap(e)
              }
              handleCanvasSwipeStart(e)
            }}
            onTouchMove={(e) => {
              if (!isInlineEditing) {
                handleTextTouchMove(e)
                handleStickerTouchMove(e)
              }
              handleCanvasSwipeMove(e)
            }}
            onTouchEnd={(e) => {
              if (!isInlineEditing) {
                handleTextTouchEnd(e)
                handleStickerTouchEnd()
              }
              handleCanvasSwipeEnd(e)
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
          >
            {/* Background Media - Full Screen with Pinch Zoom & Pan */}
            {mediaType === 'image' ? (
              <img
                ref={imageRef}
                src={selectedMedia}
                alt="Story"
                className="absolute inset-0 w-full h-full object-cover cursor-move"
                style={{
                  filter: filters.find(f => f.value === selectedFilter)?.filter || '',
                  touchAction: 'none',
                  userSelect: 'none',
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale}) rotate(${imageRotation}deg)`,
                  transformOrigin: 'center center',
                  transition: isManipulatingImage ? 'none' : 'transform 0.2s ease-out',
                  objectFit: 'contain' // Show full image without cropping
                }}
                onTouchStart={handleImageTouchStart}
                onTouchMove={handleImageTouchMove}
                onTouchEnd={handleImageTouchEnd}
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={selectedMedia}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: filters.find(f => f.value === selectedFilter)?.filter || '',
                    touchAction: 'none',
                    userSelect: 'none'
                  }}
                  autoPlay
                  loop
                  muted={isVideoMuted}
                  playsInline
                  onClick={() => {
                    if (videoRef.current) {
                      if (isVideoPlaying) {
                        videoRef.current.pause()
                        setIsVideoPlaying(false)
                      } else {
                        videoRef.current.play()
                        setIsVideoPlaying(true)
                      }
                    }
                  }}
                />
                {/* Video Play/Pause Indicator */}
                {!isVideoPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Text Overlays - Draggable & Resizable - Mobile Optimized */}
            {texts.map(text => (
              <div
                key={text.id}
                className="absolute cursor-move select-none"
                style={{
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                  transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                  color: text.color,
                  fontSize: `${text.fontSize}px`,
                  fontWeight: text.bold ? '900' : (text.style === 'modern' ? '700' : text.style === 'classic' ? '600' : '400'),
                  fontFamily: text.style === 'signature' ? 'cursive' : text.style === 'classic' ? 'serif' : 'system-ui',
                  textAlign: text.alignment || 'center',
                  textShadow: '3px 3px 10px rgba(0,0,0,0.9), -1px -1px 0 rgba(0,0,0,0.5)',
                  zIndex: selectedTextId === text.id ? 30 : 20,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  minWidth: '60px',
                  maxWidth: '90vw',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none'
                }}
                onTouchStart={(e) => handleTextTouchStart(e, text.id)}
                onTouchEnd={(e) => handleTextTouchEnd(e)}
              >
                {text.content}
              </div>
            ))}

            {/* Inline Text Editor - Instagram Style */}
            {isInlineEditing && inlineTextPosition && (
              <div
                className="absolute"
                style={{
                  left: `${inlineTextPosition.x}%`,
                  top: `${inlineTextPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 100
                }}
              >
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  placeholder="Tap to type..."
                  className="bg-transparent border-none outline-none text-center"
                  autoFocus
                  style={{
                    color: textColor,
                    caretColor: textColor,
                    fontSize: textSize === 'small' ? '24px' : textSize === 'large' ? '48px' : '32px',
                    fontWeight: textBold ? '900' : (textStyle === 'modern' ? '700' : textStyle === 'classic' ? '600' : '400'),
                    fontFamily: textStyle === 'signature' ? 'cursive' : textStyle === 'classic' ? 'serif' : 'system-ui',
                    textAlign: textAlignment,
                    textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                    minWidth: '100px',
                    maxWidth: '80vw',
                    backgroundColor: textBackground === 'solid' ? 'rgba(0,0,0,0.7)' : textBackground === 'gradient' ? 'transparent' : 'transparent',
                    backgroundImage: textBackground === 'gradient' ? 'linear-gradient(90deg, rgba(138,43,226,0.7), rgba(255,20,147,0.7))' : 'none',
                    padding: textBackground !== 'none' ? '8px 16px' : '4px 8px',
                    borderRadius: textBackground !== 'none' ? '8px' : '0'
                  }}
                  onBlur={() => {
                    if (editingText.trim()) {
                      saveText()
                    }
                    setIsInlineEditing(false)
                    setInlineTextPosition(null)
                  }}
                />
              </div>
            )}

            {/* Sticker Overlays - FULLY TOUCHABLE - Mobile Optimized */}
            {stickers.map(sticker => (
              <div
                key={sticker.id}
                className="absolute select-none cursor-move"
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.size / 60})`,
                  zIndex: selectedStickerId === sticker.id ? 30 : 20,
                  filter: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation', // Allow pinch/zoom gestures
                  border: 'none',
                  padding: '8px',
                  borderRadius: '12px',
                  willChange: 'transform, filter',
                  transition: 'none',
                  opacity: 1,
                  pointerEvents: 'auto',
                }}
                onTouchStart={(e) => handleStickerTouchStart(e, sticker.id)}
                onTouchMove={handleStickerTouchMove}
                onTouchEnd={handleStickerTouchEnd}
                onClick={() => setSelectedStickerId(sticker.id)}
              >
                {sticker.type === 'emoji' && (
                  <span className="text-5xl">{sticker.data.emoji}</span>
                )}
                {sticker.type === 'gif' && (
                  <img
                    src={sticker.data.url}
                    alt="Sticker"
                    className="max-w-[150px] max-h-[150px] rounded-lg"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                )}
                {sticker.type === 'music' && (
                  <>
                    {/* Instagram Style 1: Default - Gradient with dynamic color */}
                    {(!sticker.data.style || sticker.data.style === 'default') && (
                      <div
                        className="rounded-2xl p-4 flex items-center gap-3 min-w-[280px] max-w-[340px]"
                        style={{
                          background: `linear-gradient(135deg, ${sticker.data.color || dominantColor}ee, ${sticker.data.color || dominantColor}dd)`
                        }}
                      >
                        {sticker.data.artwork && (
                          <img
                            src={sticker.data.artwork}
                            alt="Album"
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Music className="w-4 h-4 text-white" />
                            <span className="text-white/80 text-xs font-medium">Now Playing</span>
                          </div>
                          <p className="text-white font-bold text-base truncate">
                            {sticker.data.title}
                          </p>
                          <p className="text-white/90 text-sm truncate">
                            {sticker.data.artist}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Instagram Style 2: Compact - Small pill */}
                    {sticker.data.style === 'compact' && (
                      <div className="bg-white/95 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-500" />
                        <div className="flex flex-col">
                          <span className="text-black font-bold text-sm truncate max-w-[180px]">
                            {sticker.data.title}
                          </span>
                          <span className="text-gray-600 text-xs truncate max-w-[180px]">
                            {sticker.data.artist}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Instagram Style 3: Album Art Focus */}
                    {sticker.data.style === 'album' && sticker.data.artwork && (
                      <div className="relative">
                        <img
                          src={sticker.data.artwork}
                          alt="Album"
                          className="w-32 h-32 rounded-2xl object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent rounded-b-2xl p-3">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-white" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-xs truncate">
                                {sticker.data.title}
                              </p>
                              <p className="text-white/80 text-xs truncate">
                                {sticker.data.artist}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instagram Style 4: Wave Animation with dynamic color */}
                    {sticker.data.style === 'wave' && (
                      <div
                        className="rounded-2xl p-4 min-w-[260px] max-w-[300px]"
                        style={{
                          background: `linear-gradient(90deg, ${sticker.data.color || dominantColor}ee, ${sticker.data.color || dominantColor}dd)`
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">
                              {sticker.data.title}
                            </p>
                            <p className="text-white/90 text-xs truncate">
                              {sticker.data.artist}
                            </p>
                          </div>
                        </div>
                        {/* Animated wave bars */}
                        <div className="flex items-center justify-center gap-1 h-8">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-white rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 100 + 20}%`,
                                animationDelay: `${i * 0.1}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ADVANCED INTERACTIVE STICKERS */}
                {sticker.type === 'location' && <LocationSticker data={sticker.data} />}
                {sticker.type === 'mention' && <MentionSticker data={sticker.data} />}
                {sticker.type === 'poll' && <PollSticker data={sticker.data} />}
                {sticker.type === 'question' && <QuestionSticker data={sticker.data} />}
                {sticker.type === 'hashtag' && <HashtagSticker data={sticker.data} />}
                {sticker.type === 'countdown' && <CountdownSticker data={sticker.data} />}
                {sticker.type === 'link' && <LinkSticker data={sticker.data} />}
                {sticker.type === 'slider' && <SliderSticker data={sticker.data} />}

                {/* Add Yours Sticker */}
                {sticker.type === 'addyours' && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎨</span>
                      <span className="text-white font-bold">{sticker.data.text}</span>
                    </div>
                  </div>
                )}

                {/* Frame Sticker */}
                {sticker.type === 'frame' && (
                  <div className="border-4 border-white rounded-2xl p-4 bg-white/20 backdrop-blur-sm">
                    <span className="text-4xl">🖼️</span>
                  </div>
                )}

                {/* Cutout Sticker */}
                {sticker.type === 'cutout' && (
                  <span className="text-5xl">{sticker.data.emoji}</span>
                )}

                {/* Avatar Sticker */}
                {sticker.type === 'avatar' && (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-3xl">{sticker.data.emoji}</span>
                  </div>
                )}

                {/* Template Sticker */}
                {sticker.type === 'template' && (
                  <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      <span className="text-white font-bold">{sticker.data.text}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Image Manipulation Instructions */}
            {!texts.length && !stickers.length && !activePanel && (
              <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none animate-pulse">
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-2">
                  <Move className="w-5 h-5 text-white" />
                  <span className="text-white text-sm font-medium">1 finger: Drag to move</span>
                </div>
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-2">
                  <ZoomIn className="w-5 h-5 text-white" />
                  <span className="text-white text-sm font-medium">2 fingers: Zoom & Rotate</span>
                </div>
              </div>
            )}
          </div>

          {/* Filter Name Indicator - Shows when swiping */}
          {isSwiping && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl">
                <p className="text-white text-2xl font-bold text-center">
                  {filters.find(f => f.value === selectedFilter)?.name || 'No effect'}
                </p>
                <p className="text-white/60 text-sm text-center mt-1">
                  Swipe to change filter
                </p>
              </div>
            </div>
          )}

          {/* Delete Zone */}
          {showDeleteZone && (
            <div className={`absolute bottom-0 left-0 right-0 h-40 z-50 flex items-center justify-center transition-all duration-200 ${isOverDeleteZone ? 'bg-red-500/90' : 'bg-black/60'
              }`}>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${isOverDeleteZone ? 'bg-white scale-110' : 'bg-white/30'
                  }`}>
                  <svg className={`w-10 h-10 ${isOverDeleteZone ? 'text-red-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <p className="text-white text-base mt-3 font-medium">
                  {isOverDeleteZone ? 'Release to delete' : 'Drag here to delete'}
                </p>
              </div>
            </div>
          )}

          {/* Inline Text Editing Toolbar - Instagram Style */}
          {isInlineEditing && (
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md p-4 space-y-3">
              {/* Quick Actions */}
              <div className="flex items-center justify-around">
                {/* Color */}
                <button
                  onClick={() => {
                    const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500']
                    const currentIndex = colors.indexOf(textColor)
                    const nextIndex = (currentIndex + 1) % colors.length
                    setTextColor(colors[nextIndex])
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white/30" style={{ backgroundColor: textColor }} />
                  <span className="text-white text-xs">Color</span>
                </button>

                {/* Style */}
                <button
                  onClick={() => setTextStyle(textStyle === 'modern' ? 'classic' : textStyle === 'classic' ? 'signature' : 'modern')}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs">
                    {textStyle === 'modern' ? 'Aa' : textStyle === 'classic' ? 'Aa' : 'Aa'}
                  </div>
                  <span className="text-white text-xs capitalize">{textStyle}</span>
                </button>

                {/* Size */}
                <button
                  onClick={() => setTextSize(textSize === 'small' ? 'medium' : textSize === 'medium' ? 'large' : 'small')}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                    <span style={{ fontSize: textSize === 'small' ? '14px' : textSize === 'large' ? '24px' : '18px' }}>Aa</span>
                  </div>
                  <span className="text-white text-xs capitalize">{textSize}</span>
                </button>

                {/* Bold */}
                <button
                  onClick={() => setTextBold(!textBold)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${textBold ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}>
                    <span className="font-bold">B</span>
                  </div>
                  <span className="text-white text-xs">Bold</span>
                </button>

                {/* Done */}
                <button
                  onClick={() => {
                    if (editingText.trim()) {
                      saveText()
                    }
                    setIsInlineEditing(false)
                    setInlineTextPosition(null)
                  }}
                  className="px-6 py-2 bg-purple-500 text-white rounded-full font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Text Editor Panel - Image 2 & 5 */}
          {activePanel === 'text' && (
            <div className="absolute inset-0 z-50 bg-black/95 flex flex-col">
              <div className="flex justify-end p-4">
                <button
                  onClick={saveText}
                  className="text-white text-lg font-semibold active:scale-95 transition-transform"
                >
                  Done
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center px-6">
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  placeholder="Type something..."
                  className="w-full bg-transparent border-none outline-none"
                  autoFocus
                  style={{
                    color: textColor,
                    caretColor: textColor,
                    fontSize: textSize === 'small' ? '24px' : textSize === 'large' ? '48px' : '32px',
                    fontWeight: textBold ? '900' : (textStyle === 'modern' ? '700' : textStyle === 'classic' ? '600' : '400'),
                    fontFamily: textStyle === 'signature' ? 'cursive' : textStyle === 'classic' ? 'serif' : 'system-ui',
                    textAlign: textAlignment,
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                    backgroundColor: textBackground === 'solid' ? 'rgba(0,0,0,0.7)' : textBackground === 'gradient' ? 'transparent' : 'transparent',
                    backgroundImage: textBackground === 'gradient' ? 'linear-gradient(90deg, rgba(138,43,226,0.7), rgba(255,20,147,0.7))' : 'none',
                    padding: textBackground !== 'none' ? '8px 16px' : '0',
                    borderRadius: textBackground !== 'none' ? '8px' : '0'
                  }}
                />
              </div>

              <div className="p-6 space-y-4">
                {/* Text Style Selector */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setTextStyle('modern')}
                    className={`px-6 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform ${textStyle === 'modern' ? 'bg-white text-black' : 'bg-white/20 text-white'
                      }`}
                  >
                    Modern
                  </button>
                  <button
                    onClick={() => setTextStyle('classic')}
                    className={`px-6 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform ${textStyle === 'classic' ? 'bg-white text-black' : 'bg-white/20 text-white'
                      }`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => setTextStyle('signature')}
                    className={`px-6 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform ${textStyle === 'signature' ? 'bg-white text-black' : 'bg-white/20 text-white'
                      }`}
                  >
                    Signature
                  </button>
                </div>

                {/* Text Tools */}
                <div className="flex items-center justify-around py-4 bg-gray-800 rounded-2xl">
                  {/* Alignment */}
                  <button
                    onClick={() => setTextAlignment(textAlignment === 'left' ? 'center' : textAlignment === 'center' ? 'right' : 'left')}
                    className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>

                  {/* Color Picker - Cycle through colors */}
                  <button
                    onClick={() => {
                      const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#000000']
                      const currentIndex = colors.indexOf(textColor)
                      const nextIndex = (currentIndex + 1) % colors.length
                      setTextColor(colors[nextIndex])
                    }}
                    className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white/30"
                      style={{ backgroundColor: textColor }}
                    ></div>
                  </button>

                  {/* Background Toggle */}
                  <button
                    onClick={() => setTextBackground(textBackground === 'none' ? 'solid' : textBackground === 'solid' ? 'gradient' : 'none')}
                    className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs ${textBackground === 'none' ? 'bg-gray-700' : textBackground === 'solid' ? 'bg-black' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}>
                      A/A
                    </div>
                  </button>

                  {/* Bold Toggle */}
                  <button
                    onClick={() => setTextBold(!textBold)}
                    className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${textBold ? 'bg-white text-black' : 'bg-gray-700'
                      }`}>
                      <span className="font-bold">B</span>
                    </div>
                  </button>

                  {/* Size Toggle */}
                  <button
                    onClick={() => setTextSize(textSize === 'small' ? 'medium' : textSize === 'medium' ? 'large' : 'small')}
                    className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${textSize === 'large' ? 'bg-white text-black' : textSize === 'medium' ? 'bg-gray-600' : 'bg-gray-700'
                      }`}>
                      Aa
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-around py-2">
                  <button className="flex items-center gap-2 text-white active:scale-95 transition-transform">
                    <span>@</span>
                    <span className="text-sm">Mention</span>
                  </button>
                  <button className="flex items-center gap-2 text-white active:scale-95 transition-transform">
                    <span>📍</span>
                    <span className="text-sm">Location</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stickers Panel - Instagram Style */}
          {activePanel === 'stickers' && (
            <div className="absolute inset-x-0 bottom-0 z-50 bg-[#1a1a1a] rounded-t-3xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-700 rounded-full"></div>
              </div>

              <div className="p-4 space-y-3">
                {/* Search Bar - Instagram Style */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={stickerQuery}
                    onChange={(e) => setStickerQuery(e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white pl-12 pr-4 py-3 rounded-xl border-none outline-none placeholder-gray-500"
                  />
                </div>

                {/* Sticker Categories - Professional SVG Icons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">LOCATION</span>
                  </button>
                  <button
                    onClick={() => setShowMentionPicker(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">MENTION</span>
                  </button>
                  <button
                    onClick={() => setActivePanel('music')}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">MUSIC</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">PHOTO</span>
                  </button>
                  <button
                    onClick={() => setStickerQuery('gif')}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">GIF</span>
                  </button>
                  <button
                    onClick={() => addSticker('addyours', { text: 'Add yours' })}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">ADD YOURS</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addSticker('frame', { style: 'polaroid' })}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">FRAMES</span>
                  </button>
                  <button
                    onClick={() => setShowQuestionSticker(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">QUESTIONS</span>
                  </button>
                  <button
                    onClick={() => addSticker('cutout', { emoji: '✂️' })}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">CUTOUTS</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addSticker('avatar', { emoji: '👤' })}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">AVATAR</span>
                  </button>
                  <button
                    onClick={() => addSticker('template', { text: 'Add yours' })}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">ADD YOURS TEMPLATES</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setShowPollCreator(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">POLL</span>
                  </button>
                  <button
                    onClick={() => addSticker('emoji', { emoji: '😀' })}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">EMOJI</span>
                  </button>
                  <button
                    onClick={() => setShowSlider(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.5 2a3.5 3.5 0 101.665 6.58L8.585 10l-1.42 1.42a3.5 3.5 0 101.414 1.414l8.128-8.127a1 1 0 00-1.414-1.414L10 8.586 8.58 7.165A3.5 3.5 0 005.5 2zM4 5.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">SLIDER</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setShowHashtagInput(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">HASHTAG</span>
                  </button>
                  <button
                    onClick={() => setShowCountdown(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">COUNTDOWN</span>
                  </button>
                  <button
                    onClick={() => setShowLinkInput(true)}
                    className="bg-white rounded-full px-3 py-2.5 flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold text-black">LINK</span>
                  </button>
                </div>

                {/* Animated Stickers from Multiple APIs */}
                <div className="pt-4 border-t border-gray-800">
                  {loadingStickers ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent mb-3"></div>
                      <span className="text-white/60 text-sm">Loading stickers...</span>
                    </div>
                  ) : stickerPacks.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                          {stickerQuery ? `"${stickerQuery}"` : 'Trending Stickers'}
                        </p>
                        <span className="text-white/50 text-xs">{stickerPacks.length} results</span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {stickerPacks.map((sticker, idx) => (
                          <button
                            key={`${sticker.source}-${sticker.id}-${idx}`}
                            onClick={() => addSticker('gif', {
                              url: sticker.images.fixed_height.url,
                              width: sticker.images.fixed_height.width || 200,
                              height: sticker.images.fixed_height.height || 200,
                              source: sticker.source
                            })}
                            className="aspect-square bg-[#262626] rounded-xl overflow-hidden active:scale-95 transition-all hover:bg-[#3a3a3a] hover:shadow-lg"
                          >
                            <img
                              src={sticker.images.fixed_height_small?.url || sticker.images.fixed_height.url}
                              alt={sticker.title || 'Sticker'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                // Fallback to main URL if preview fails
                                const target = e.target as HTMLImageElement
                                if (target.src !== sticker.images.fixed_height.url) {
                                  target.src = sticker.images.fixed_height.url
                                }
                              }}
                            />
                          </button>
                        ))}
                      </div>

                      {/* API Attribution */}
                      <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-800">
                        <span className="text-xs text-gray-600">Powered by</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">Tenor</span>
                          <span className="text-gray-700">•</span>
                          <span className="text-xs text-gray-400 font-medium">Google</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <div className="text-5xl mb-3">🔍</div>
                      <p className="text-white/70 text-sm font-medium mb-1">
                        {stickerQuery ? 'No stickers found' : 'Search for stickers & GIFs'}
                      </p>
                      <p className="text-white/40 text-xs">
                        Try "love", "party", "happy", "celebrate"
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Emoji Stickers */}
                <div className="pt-4">
                  <p className="text-white text-sm font-semibold mb-3">Quick Emojis</p>
                  <div className="grid grid-cols-8 gap-2">
                    {['⏰', '🌡️', '❤️', '🎉', '🎊', '✨', '💯', '🔥', '😀', '😂', '🥰', '😍', '🤩', '😎', '🔥', '⭐'].map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => addSticker('emoji', { emoji })}
                        className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center text-3xl active:scale-95 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pb-6"></div>
              </div>
            </div>
          )}

          {/* Filters Panel - Image 3 */}
          {activePanel === 'filters' && (
            <div className="absolute inset-x-0 bottom-32 z-50 px-6 py-4 bg-gradient-to-t from-black/90 via-black/80 to-transparent">
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setActivePanel('none')}
                  className="text-white text-lg font-semibold active:scale-95 transition-transform bg-white/10 px-6 py-2 rounded-full"
                >
                  Done
                </button>
              </div>

              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                {filters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className="flex-shrink-0 flex flex-col items-center gap-3 active:scale-95 transition-transform"
                  >
                    <div className={`w-24 h-24 rounded-2xl border-[3px] overflow-hidden ${selectedFilter === filter.value ? 'border-white shadow-lg shadow-white/50' : 'border-white/40'
                      }`}>
                      <img
                        src={selectedMedia}
                        alt={filter.name}
                        className="w-full h-full object-cover"
                        style={{ filter: filter.filter }}
                      />
                    </div>
                    <span className={`text-sm font-semibold ${selectedFilter === filter.value ? 'text-white' : 'text-white/70'}`}>
                      {filter.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Music Panel - Image 6 */}
          {activePanel === 'music' && (
            <div className="absolute inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl max-h-[85vh] overflow-y-auto">
              {/* Hidden Audio Player */}
              <audio ref={audioRef} onEnded={() => setIsPlayingPreview(false)} />

              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg">Add Music</h3>
                  {selectedMusic && (
                    <button
                      onClick={() => {
                        // Remove music
                        setSelectedMusic(null)
                        // Stop audio
                        if (storyAudioRef.current) {
                          storyAudioRef.current.pause()
                          storyAudioRef.current.src = ''
                        }
                        setIsPlayingOnStory(false)
                        // Remove all music stickers
                        setStickers(prev => prev.filter(s => s.type !== 'music'))
                        // Unmute video when music is removed (optional - user can control)
                        // if (mediaType === 'video' && videoRef.current) {
                        //   setIsVideoMuted(false)
                        //   videoRef.current.muted = false
                        // }
                        if ('vibrate' in navigator) navigator.vibrate(20)
                      }}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full active:scale-95 transition-transform"
                    >
                      Remove Music
                    </button>
                  )}
                </div>

                {selectedMusic && (
                  <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                    {selectedMusic.artwork && (
                      <img
                        src={selectedMusic.artwork}
                        alt={selectedMusic.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{selectedMusic.title}</p>
                      <p className="text-gray-400 text-xs truncate">{selectedMusic.artist}</p>
                    </div>
                    <Music className="w-5 h-5 text-purple-500" />
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search music"
                    value={musicQuery}
                    onChange={(e) => setMusicQuery(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-xl border-none outline-none"
                  />
                </div>

                {/* Show Music Sticker Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-white font-medium text-sm">Show Music Sticker</p>
                    <p className="text-white/60 text-xs">Display visual sticker on story</p>
                  </div>
                  <button
                    onClick={() => setShowMusicSticker(!showMusicSticker)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${showMusicSticker ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${showMusicSticker ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>

                {/* Music Sticker Style Selector */}
                {showMusicSticker && (
                  <div>
                    <p className="text-white/70 text-xs font-medium mb-2">Sticker Style</p>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setMusicStickerStyle('default')}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${musicStickerStyle === 'default'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800 text-white/70'
                          }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg"></div>
                        <span className="text-xs font-medium">Default</span>
                      </button>
                      <button
                        onClick={() => setMusicStickerStyle('compact')}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${musicStickerStyle === 'compact'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800 text-white/70'
                          }`}
                      >
                        <div className="w-8 h-4 bg-white rounded-full"></div>
                        <span className="text-xs font-medium">Compact</span>
                      </button>
                      <button
                        onClick={() => setMusicStickerStyle('album')}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${musicStickerStyle === 'album'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800 text-white/70'
                          }`}
                      >
                        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                        <span className="text-xs font-medium">Album</span>
                      </button>
                      <button
                        onClick={() => setMusicStickerStyle('wave')}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${musicStickerStyle === 'wave'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800 text-white/70'
                          }`}
                      >
                        <div className="flex items-end gap-0.5 h-8">
                          <div className="w-1 h-2 bg-blue-400 rounded-full"></div>
                          <div className="w-1 h-4 bg-blue-400 rounded-full"></div>
                          <div className="w-1 h-3 bg-blue-400 rounded-full"></div>
                          <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium">Wave</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 overflow-x-auto">
                  <button className="px-5 py-2 bg-white text-black rounded-full text-sm font-semibold active:scale-95 transition-transform flex-shrink-0">
                    For you
                  </button>
                  <button className="px-5 py-2 bg-gray-800 text-white rounded-full text-sm font-medium active:scale-95 transition-transform flex-shrink-0">
                    Trending
                  </button>
                  <button className="px-5 py-2 bg-gray-800 text-white rounded-full text-sm font-medium active:scale-95 transition-transform flex-shrink-0">
                    Saved
                  </button>
                </div>

                {musicResults.length > 0 ? (
                  <div className="space-y-2">
                    {musicResults.map((track, idx) => {
                      const isCurrentlyPlaying = isPlayingPreview && audioRef.current?.src === track.previewUrl

                      return (
                        <div
                          key={track.id || idx}
                          className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
                        >
                          <img
                            src={track.artwork}
                            alt={track.title}
                            className="w-14 h-14 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E🎵%3C/text%3E%3C/svg%3E'
                            }}
                          />
                          <div
                            className="flex-1 text-left cursor-pointer"
                            onClick={() => {
                              setSelectedMusic(track)

                              // Only add sticker if toggle is ON
                              if (showMusicSticker) {
                                addSticker('music', {
                                  title: track.title,
                                  artist: track.artist,
                                  artwork: track.artwork,
                                  previewUrl: track.previewUrl
                                })
                              }

                              // Always start playing music on story
                              if (storyAudioRef.current && track.previewUrl) {
                                storyAudioRef.current.src = track.previewUrl
                                storyAudioRef.current.loop = true
                                storyAudioRef.current.play()
                                  .then(() => setIsPlayingOnStory(true))
                                  .catch(err => console.error('Story audio play error:', err))
                              }

                              // Auto-mute video when music is added
                              if (mediaType === 'video' && videoRef.current) {
                                setIsVideoMuted(true)
                                videoRef.current.muted = true
                              }

                              // Close panel and stop preview audio
                              setActivePanel('none')
                              if (audioRef.current) {
                                audioRef.current.pause()
                                setIsPlayingPreview(false)
                              }
                              // Show success feedback
                              if ('vibrate' in navigator) navigator.vibrate(20)
                            }}
                          >
                            <p className="text-white font-medium text-sm line-clamp-1">{track.title}</p>
                            <p className="text-gray-400 text-xs line-clamp-1">
                              🎵 {track.artist} • {Math.floor(track.duration / 60000)}:{String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}
                            </p>
                          </div>

                          {/* Play/Pause Button */}
                          {track.previewUrl ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                playMusicPreview(track.previewUrl)
                              }}
                              className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center active:scale-95 transition-transform"
                            >
                              {isCurrentlyPlaying ? (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center">
                              <Music className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {musicQuery ? 'Search for music...' : 'Type to search music'}
                  </div>
                )}

                <div className="pb-6"></div>
              </div>
            </div>
          )}

          {/* Menu Panel - Image 2 (3 dots dropdown) */}
          {activePanel === 'menu' && (
            <div className="absolute top-16 right-4 z-50 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl min-w-[240px]">
              <button className="w-full text-left px-5 py-4 text-white hover:bg-gray-700 active:bg-gray-700 flex items-center gap-3 transition-colors">
                <span className="text-xl">✏️</span>
                <span className="font-medium">Draw</span>
              </button>
              <button className="w-full text-left px-5 py-4 text-white hover:bg-gray-700 active:bg-gray-700 flex items-center gap-3 transition-colors">
                <span className="text-xl">📷</span>
                <span className="font-medium">Label AI</span>
              </button>
              <button className="w-full text-left px-5 py-4 text-white hover:bg-gray-700 active:bg-gray-700 flex items-center gap-3 transition-colors">
                <span className="text-xl">🚫</span>
                <span className="font-medium">Turn off commenting</span>
              </button>
              <button className="w-full text-left px-5 py-4 text-white hover:bg-gray-700 active:bg-gray-700 flex items-center gap-3 transition-colors">
                <span className="text-xl">⬇️</span>
                <span className="font-medium">Save</span>
              </button>
            </div>
          )}

          {/* Interactive Sticker Modals */}

          {/* Location Picker */}
          {showLocationPicker && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Add Location</h3>
                  <button onClick={() => setShowLocationPicker(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search location..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                />
                <div className="space-y-2">
                  {['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Miami, FL'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => addLocationSticker(loc)}
                      className="w-full text-left px-4 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a]"
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mention Picker */}
          {showMentionPicker && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Mention Someone</h3>
                  <button onClick={() => setShowMentionPicker(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={mentionQuery}
                  onChange={(e) => {
                    setMentionQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                />
                <div className="space-y-2">
                  {mentionResults.length > 0 ? (
                    mentionResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addMentionSticker(user.username)}
                        className="w-full text-left px-4 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        <span>@{user.username}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Search for users to mention</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Poll Creator */}
          {showPollCreator && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Create Poll</h3>
                  <button onClick={() => setShowPollCreator(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-3"
                />
                <input
                  type="text"
                  placeholder="Option 1"
                  value={pollOptions[0]}
                  onChange={(e) => setPollOptions([e.target.value, pollOptions[1]])}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-2"
                />
                <input
                  type="text"
                  placeholder="Option 2"
                  value={pollOptions[1]}
                  onChange={(e) => setPollOptions([pollOptions[0], e.target.value])}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                />
                <button
                  onClick={addPollSticker}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold"
                >
                  Add Poll
                </button>
              </div>
            </div>
          )}

          {/* Question Sticker */}
          {showQuestionSticker && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Ask a Question</h3>
                  <button onClick={() => setShowQuestionSticker(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                />
                <button
                  onClick={addQuestionSticker}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold"
                >
                  Add Question
                </button>
              </div>
            </div>
          )}

          {/* Hashtag Input */}
          {showHashtagInput && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Add Hashtag</h3>
                  <button onClick={() => setShowHashtagInput(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="#hashtag"
                  value={hashtagText}
                  onChange={(e) => setHashtagText(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                />
                <button
                  onClick={addHashtagSticker}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold"
                >
                  Add Hashtag
                </button>
              </div>
            </div>
          )}

          {/* Countdown Creator */}
          {showCountdown && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Create Countdown</h3>
                  <button onClick={() => setShowCountdown(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Countdown name..."
                  value={countdownName}
                  onChange={(e) => setCountdownName(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-3"
                />
                <input
                  type="datetime-local"
                  value={countdownDate}
                  onChange={(e) => setCountdownDate(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                />
                <button
                  onClick={addCountdownSticker}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold"
                >
                  Add Countdown
                </button>
              </div>
            </div>
          )}

          {/* Link Input */}
          {showLinkInput && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Add Link</h3>
                  <button onClick={() => setShowLinkInput(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-3"
                />
                <input
                  type="text"
                  placeholder="Link text (optional)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-4"
                />
                <button
                  onClick={addLinkSticker}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold"
                >
                  Add Link
                </button>
              </div>
            </div>
          )}

          {/* Slider Creator */}
          {showSlider && (
            <div className="absolute inset-0 z-[60] bg-black/80 flex items-end">
              <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">Create Slider</h3>
                  <button onClick={() => setShowSlider(false)} className="text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={sliderQuestion}
                  onChange={(e) => setSliderQuestion(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl mb-3"
                />
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-white">Emoji:</span>
                  <input
                    type="text"
                    value={sliderEmoji}
                    onChange={(e) => setSliderEmoji(e.target.value)}
                    className="w-20 bg-[#2a2a2a] text-white px-4 py-3 rounded-xl text-center"
                    maxLength={2}
                  />
                </div>
                <button
                  onClick={addSliderSticker}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold"
                >
                  Add Slider
                </button>
              </div>
            </div>
          )}

          {/* Bottom Bar */}
          <div className="absolute inset-x-0 bottom-0 z-40 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <input
              type="text"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
              className="w-full bg-transparent text-white px-4 py-2 mb-4 border-none outline-none placeholder-gray-400 disabled:opacity-50"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => uploadStory('your-story')}
                disabled={isUploading || !selectedMedia}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 rounded-full px-6 py-3 text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isUploading && shareOption === 'your-story' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">{uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Your story</span>
                  </>
                )}
              </button>
              <button
                onClick={() => uploadStory('friends')}
                disabled={isUploading || !selectedMedia}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:opacity-50 rounded-full px-6 py-3 text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isUploading && shareOption === 'friends' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">{uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">Friends</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
