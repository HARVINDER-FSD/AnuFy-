"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Maximize2, Type, Smile, Sparkles, MoreHorizontal, X, Search, Music } from "lucide-react"

export default function CreateInstagramStoryPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Media
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
  
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
  }>>([])
  const [editingText, setEditingText] = useState('')
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  
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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedMedia(URL.createObjectURL(file))
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
    
    if (selectedTextId) {
      // Update existing text
      setTexts(texts.map(t => 
        t.id === selectedTextId ? { ...t, content: editingText } : t
      ))
    } else {
      // Add new text
      const newText = {
        id: Date.now().toString(),
        content: editingText,
        x: 50,
        y: 40,
        fontSize: 32,
        color: '#FFFFFF',
        style: 'modern' as const,
        rotation: 0
      }
      setTexts([...texts, newText])
    }
    
    setEditingText('')
    setSelectedTextId(null)
    setActivePanel('none')
  }

  const deleteText = (id: string) => {
    setTexts(texts.filter(t => t.id !== id))
    setSelectedTextId(null)
  }

  // Touch handlers for text
  const handleTextTouchStart = (e: React.TouchEvent, textId: string) => {
    e.stopPropagation()
    setSelectedTextId(textId)
    
    if (e.touches.length === 1) {
      // Single finger - drag
      setIsDragging(true)
      setShowDeleteZone(true)
      const touch = e.touches[0]
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
    
    if (e.touches.length === 1 && isDragging) {
      // Drag
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y

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

  const handleTextTouchEnd = () => {
    if (isOverDeleteZone && selectedTextId) {
      deleteText(selectedTextId)
      if ('vibrate' in navigator) navigator.vibrate(50)
    }
    
    setIsDragging(false)
    setShowDeleteZone(false)
    setIsOverDeleteZone(false)
  }

  // Sticker functions
  const addSticker = (type: string, data: any) => {
    const newSticker = {
      id: Date.now().toString(),
      type,
      data,
      x: 50,
      y: 50,
      size: 60,
      rotation: 0
    }
    setStickers([...stickers, newSticker])
    setActivePanel('none')
  }

  // Music API integration (iTunes)
  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      setMusicResults([])
      return
    }
    
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`
      )
      const data = await response.json()
      setMusicResults(data.results || [])
    } catch (error) {
      console.error('Music search error:', error)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (musicQuery) searchMusic(musicQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [musicQuery])

  // Prevent scroll when dragging
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) e.preventDefault()
    }
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => document.removeEventListener('touchmove', handleTouchMove)
  }, [isDragging])

  return (
    <div className="fixed inset-0 bg-black">
      {!selectedMedia ? (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-lg font-semibold active:scale-95 transition-transform"
          >
            Select Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleMediaSelect}
          />
        </div>
      ) : (
        <>
          {/* Top Bar - Image 1 & 6 */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button 
                onClick={addText}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Type className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActivePanel('stickers')}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActivePanel('filters')}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActivePanel('music')}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Music className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActivePanel('menu')}
                className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas - Image with overlays */}
          <div 
            ref={canvasRef}
            className="relative w-full h-full"
            onTouchMove={handleTextTouchMove}
            onTouchEnd={handleTextTouchEnd}
          >
            {/* Background Image */}
            <img 
              src={selectedMedia} 
              alt="Story" 
              className="w-full h-full object-cover" 
              style={{
                filter: filters.find(f => f.value === selectedFilter)?.filter || ''
              }}
            />

            {/* Text Overlays - Draggable & Resizable */}
            {texts.map(text => (
              <div
                key={text.id}
                className="absolute cursor-move select-none touch-none"
                style={{
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                  transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                  color: text.color,
                  fontSize: `${text.fontSize}px`,
                  fontWeight: text.style === 'modern' ? '700' : text.style === 'classic' ? '600' : '400',
                  fontFamily: text.style === 'signature' ? 'cursive' : 'system-ui',
                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                  zIndex: selectedTextId === text.id ? 30 : 20,
                  padding: '12px',
                  border: selectedTextId === text.id ? '2px dashed rgba(255,255,255,0.8)' : 'none',
                  borderRadius: '8px'
                }}
                onTouchStart={(e) => handleTextTouchStart(e, text.id)}
              >
                {text.content}
              </div>
            ))}

            {/* Sticker Overlays */}
            {stickers.map(sticker => (
              <div
                key={sticker.id}
                className="absolute select-none touch-none"
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                  fontSize: `${sticker.size}px`,
                  zIndex: 20
                }}
              >
                {sticker.type === 'emoji' && sticker.data.emoji}
                {sticker.type === 'music' && (
                  <div className="bg-white/95 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                    <Music className="w-4 h-4" />
                    <span className="text-sm font-medium">{sticker.data.title}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Delete Zone */}
          {showDeleteZone && (
            <div className={`absolute bottom-0 left-0 right-0 h-40 z-50 flex items-center justify-center transition-all duration-200 ${
              isOverDeleteZone ? 'bg-red-500/90' : 'bg-black/60'
            }`}>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
                  isOverDeleteZone ? 'bg-white scale-110' : 'bg-white/30'
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
                  className="w-full bg-transparent text-white text-3xl text-center border-none outline-none font-bold"
                  autoFocus
                  style={{ caretColor: 'white' }}
                />
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-center gap-3">
                  <button className="px-6 py-2 bg-white text-black rounded-full text-sm font-medium active:scale-95 transition-transform">
                    Modern
                  </button>
                  <button className="px-6 py-2 bg-white/20 text-white rounded-full text-sm font-medium active:scale-95 transition-transform">
                    Classic
                  </button>
                  <button className="px-6 py-2 bg-white/20 text-white rounded-full text-sm font-medium active:scale-95 transition-transform">
                    Signature
                  </button>
                </div>

                <div className="flex items-center justify-around py-4 bg-gray-800 rounded-2xl">
                  <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <Type className="w-5 h-5 text-white" />
                    </div>
                  </button>
                  <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded-full"></div>
                  </button>
                  <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs">
                      A/A
                    </div>
                  </button>
                  <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                      ✨
                    </div>
                  </button>
                  <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                      ☰
                    </div>
                  </button>
                  <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
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

          {/* Stickers Panel - Image 4 */}
          {activePanel === 'stickers' && (
            <div className="absolute inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
              </div>

              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-xl border-none outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => addSticker('emoji', { emoji: '📍' })}
                    className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>📍</span>
                    <span className="text-xs font-semibold">LOCATION</span>
                  </button>
                  <button 
                    onClick={() => addSticker('emoji', { emoji: '@' })}
                    className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>📧</span>
                    <span className="text-xs font-semibold">MENTION</span>
                  </button>
                  <button 
                    onClick={() => setActivePanel('music')}
                    className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>🎵</span>
                    <span className="text-xs font-semibold">MUSIC</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => addSticker('emoji', { emoji: '📷' })}
                    className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>📷</span>
                    <span className="text-xs font-semibold">PHOTO</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>🎬</span>
                    <span className="text-xs font-semibold">GIF</span>
                  </button>
                  <button 
                    onClick={() => addSticker('emoji', { emoji: '➕' })}
                    className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>🎨</span>
                    <span className="text-xs font-semibold">ADD YOURS</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>🖼️</span>
                    <span className="text-xs font-semibold">FRAMES</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>❓</span>
                    <span className="text-xs font-semibold">QUESTIONS</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>✂️</span>
                    <span className="text-xs font-semibold">CUTOUTS</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>👤</span>
                    <span className="text-xs font-semibold">AVATAR</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>📋</span>
                    <span className="text-xs font-semibold">ADD YOURS TEMPLATES</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => addSticker('emoji', { emoji: '📊' })}
                    className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <span>📊</span>
                    <span className="text-xs font-semibold">POLL</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>😀</span>
                    <span className="text-xs font-semibold">EMOJI</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>🎨</span>
                    <span className="text-xs font-semibold">SLIDER</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>#️⃣</span>
                    <span className="text-xs font-semibold">HASHTAG</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>⏰</span>
                    <span className="text-xs font-semibold">COUNTDOWN</span>
                  </button>
                  <button className="bg-white rounded-full px-4 py-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span>🔗</span>
                    <span className="text-xs font-semibold">LINK</span>
                  </button>
                </div>

                {/* Popular Stickers */}
                <div className="grid grid-cols-4 gap-3 pt-4">
                  {['⏰', '🌡️', '❤️', '🎉', '🎊', '✨', '💯', '🔥'].map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => addSticker('emoji', { emoji })}
                      className="aspect-square bg-gray-800 rounded-2xl flex items-center justify-center text-4xl active:scale-95 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="pb-6"></div>
              </div>
            </div>
          )}

          {/* Filters Panel - Image 3 */}
          {activePanel === 'filters' && (
            <div className="absolute inset-x-0 bottom-0 z-50 p-6">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={() => setActivePanel('none')}
                  className="text-white text-lg font-semibold active:scale-95 transition-transform"
                >
                  Done
                </button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {filters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className="flex-shrink-0 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className={`w-20 h-20 rounded-full border-4 overflow-hidden ${
                      selectedFilter === filter.value ? 'border-white' : 'border-white/30'
                    }`}>
                      <img 
                        src={selectedMedia} 
                        alt={filter.name}
                        className="w-full h-full object-cover"
                        style={{ filter: filter.filter }}
                      />
                    </div>
                    <span className="text-white text-xs font-medium">{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Music Panel - Image 6 */}
          {activePanel === 'music' && (
            <div className="absolute inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
              </div>

              <div className="p-4 space-y-4">
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

                <div className="flex gap-2">
                  <button className="px-5 py-2 bg-white text-black rounded-full text-sm font-semibold active:scale-95 transition-transform">
                    For you
                  </button>
                  <button className="px-5 py-2 bg-gray-800 text-white rounded-full text-sm font-medium active:scale-95 transition-transform">
                    Trending
                  </button>
                  <button className="px-5 py-2 bg-gray-800 text-white rounded-full text-sm font-medium active:scale-95 transition-transform">
                    Saved
                  </button>
                  <button className="px-5 py-2 bg-gray-800 text-white rounded-full text-sm font-medium active:scale-95 transition-transform">
                    Original audio
                  </button>
                </div>

                {musicResults.length > 0 ? (
                  <div className="space-y-2">
                    {musicResults.map((track, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedMusic(track)
                          addSticker('music', {
                            title: track.trackName,
                            artist: track.artistName,
                            artwork: track.artworkUrl100
                          })
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-xl active:scale-98 transition-transform"
                      >
                        <img 
                          src={track.artworkUrl100} 
                          alt={track.trackName}
                          className="w-14 h-14 rounded-lg"
                        />
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium text-sm line-clamp-1">{track.trackName}</p>
                          <p className="text-gray-400 text-xs line-clamp-1">
                            🎵 {track.artistName} • {Math.floor(track.trackTimeMillis / 60000)}:{String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        </div>
                      </button>
                    ))}
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

          {/* Bottom Bar */}
          <div className="absolute inset-x-0 bottom-0 z-40 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <input
              type="text"
              placeholder="Add a caption..."
              className="w-full bg-transparent text-white px-4 py-2 mb-4 border-none outline-none placeholder-gray-400"
            />
            <div className="flex items-center gap-3">
              <button className="flex-1 bg-gray-800 rounded-full px-6 py-3 text-white flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                <span className="font-medium">Your story</span>
              </button>
              <button className="flex-1 bg-gray-800 rounded-full px-6 py-3 text-white flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <div className="w-7 h-7 rounded-full bg-green-500"></div>
                <span className="font-medium">Close Friends</span>
              </button>
              <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black text-xl font-bold active:scale-95 transition-transform">
                →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
