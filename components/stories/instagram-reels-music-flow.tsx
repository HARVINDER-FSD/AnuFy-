"use client"

import { useState, useRef, useEffect } from 'react'
import { X, Search, Play, Pause, Check, Bookmark, ChevronRight } from 'lucide-react'

interface Song {
    id: string
    title: string
    artist: string
    duration: number // Duration in seconds
    durationFormatted: string
    artwork: string
    previewUrl: string
    fullSongUrl?: string | null
    spotifyUri?: string
    source: 'itunes' | 'spotify' | 'deezer'
}

interface InstagramReelsMusicFlowProps {
    onSelectMusic: (song: Song, trimStart: number, trimEnd: number) => void
    onClose: () => void
    storyMedia?: string // The actual story photo/video URL
    storyMediaType?: 'image' | 'video'
}

export function InstagramReelsMusicFlow({ onSelectMusic, onClose, storyMedia, storyMediaType = 'image' }: InstagramReelsMusicFlowProps) {
    const [step, setStep] = useState<'search' | 'trim'>('search')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Song[]>([])
    const [selectedSong, setSelectedSong] = useState<Song | null>(null)
    const [isSearching, setIsSearching] = useState(false)

    // Trimmer state
    const [trimStart, setTrimStart] = useState(0)
    const [trimEnd, setTrimEnd] = useState(15)
    const [currentTime, setCurrentTime] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const audioRef = useRef<HTMLAudioElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Auto-focus search on mount
    useEffect(() => {
        searchInputRef.current?.focus()
    }, [])

    // Search music using our API
    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const response = await fetch(
                `/api/music/search?q=${encodeURIComponent(query)}`
            )
            const data = await response.json()

            if (data.songs) {
                setSearchResults(data.songs)
            } else {
                setSearchResults([])
            }
        } catch (error) {
            console.error('Search error:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Select song and go to trim screen
    const handleSelectSong = (song: Song) => {
        console.log('Selected song:', song)
        setSelectedSong(song)
        setStep('trim')
        setTrimStart(0)
        // Set trim end based on song duration (max 60s for stories/reels)
        setTrimEnd(Math.min(15, song.duration))
        if ('vibrate' in navigator) navigator.vibrate(10)
    }

    // Debug: Log when audio source changes
    useEffect(() => {
        if (selectedSong && audioRef.current) {
            console.log('Audio element src:', audioRef.current.src)
            console.log('Preview URL:', selectedSong.previewUrl)
        }
    }, [selectedSong])

    // Toggle playback with error handling
    const togglePlayback = async () => {
        if (!audioRef.current || !selectedSong) {
            console.log('No audio ref or song')
            return
        }

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            try {
                console.log('Attempting to play:', selectedSong.previewUrl)
                audioRef.current.currentTime = trimStart
                const playPromise = audioRef.current.play()

                if (playPromise !== undefined) {
                    await playPromise
                    setIsPlaying(true)
                    console.log('Playback started successfully')
                }
            } catch (error) {
                console.error('Playback error:', error)
                // Show user-friendly error
                alert('Could not play audio. The preview URL may be unavailable.')
                setIsPlaying(false)
            }
        }
        if ('vibrate' in navigator) navigator.vibrate(10)
    }

    // Update playback position
    useEffect(() => {
        if (!audioRef.current || !isPlaying) return

        const updateTime = () => {
            if (audioRef.current) {
                const time = audioRef.current.currentTime
                setCurrentTime(time)

                // Loop within trim range
                if (time >= trimEnd) {
                    audioRef.current.currentTime = trimStart
                }
            }
        }

        const interval = setInterval(updateTime, 100)
        return () => clearInterval(interval)
    }, [isPlaying, trimStart, trimEnd])

    // Handle timeline drag for the trim window (moves both start and end together)
    const handleTimelineDrag = (clientX: number) => {
        if (!timelineRef.current || !selectedSong) return

        const rect = timelineRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const percentage = x / rect.width
        const maxDuration = Math.min(selectedSong.duration, 60) // Max 60s for timeline
        const time = percentage * maxDuration
        const duration = trimEnd - trimStart

        // Move the entire trim window
        const newStart = Math.max(0, Math.min(time, maxDuration - duration))
        const newEnd = newStart + duration

        setTrimStart(newStart)
        setTrimEnd(newEnd)

        // Update audio position if playing
        if (audioRef.current && isPlaying) {
            audioRef.current.currentTime = newStart
        }
    }

    // Handle dragging the start handle
    const handleStartHandleDrag = (clientX: number) => {
        if (!timelineRef.current || !selectedSong) return

        const rect = timelineRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const percentage = x / rect.width
        const maxDuration = Math.min(selectedSong.duration, 60)
        const time = percentage * maxDuration

        // Ensure start is before end (minimum 3 seconds)
        const newStart = Math.max(0, Math.min(time, trimEnd - 3))
        setTrimStart(newStart)

        if (audioRef.current) {
            audioRef.current.currentTime = newStart
        }
    }

    // Handle dragging the end handle
    const handleEndHandleDrag = (clientX: number) => {
        if (!timelineRef.current || !selectedSong) return

        const rect = timelineRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const percentage = x / rect.width
        const maxDuration = Math.min(selectedSong.duration, 60)
        const time = percentage * maxDuration

        // Ensure end is after start (minimum 3 seconds)
        const newEnd = Math.min(maxDuration, Math.max(time, trimStart + 3))
        setTrimEnd(newEnd)
    }

    const handleTouchStart = (e: React.TouchEvent, handle: 'start' | 'end' | 'window') => {
        e.stopPropagation()
        setIsDragging(true)

        if (handle === 'start') {
            handleStartHandleDrag(e.touches[0].clientX)
        } else if (handle === 'end') {
            handleEndHandleDrag(e.touches[0].clientX)
        } else {
            handleTimelineDrag(e.touches[0].clientX)
        }

        if ('vibrate' in navigator) navigator.vibrate(10)
    }

    const handleTouchMove = (e: React.TouchEvent, handle: 'start' | 'end' | 'window') => {
        if (!isDragging) return

        // Try to prevent default, but don't worry if it fails (passive listener)
        try {
            e.preventDefault()
        } catch (err) {
            // Ignore - passive event listener
        }

        if (handle === 'start') {
            handleStartHandleDrag(e.touches[0].clientX)
        } else if (handle === 'end') {
            handleEndHandleDrag(e.touches[0].clientX)
        } else {
            handleTimelineDrag(e.touches[0].clientX)
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        if ('vibrate' in navigator) navigator.vibrate(10)
    }

    // Done - save selection
    const handleDone = () => {
        if (selectedSong) {
            onSelectMusic(selectedSong, trimStart, trimEnd)
            if ('vibrate' in navigator) navigator.vibrate(20)
        }
    }

    if (step === 'search') {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 bg-gray-900">
                    <button onClick={onClose} className="p-2 active:scale-90 transition-transform">
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search music"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2.5 rounded-lg border-none outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('')
                                    setSearchResults([])
                                    searchInputRef.current?.focus()
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto">
                    {isSearching ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="divide-y divide-gray-800">
                            {searchResults.map((song) => (
                                <button
                                    key={song.id}
                                    onClick={() => handleSelectSong(song)}
                                    className="w-full flex items-center gap-3 p-4 active:bg-gray-900 transition-colors"
                                >
                                    <img
                                        src={song.artwork}
                                        alt={song.title}
                                        className="w-12 h-12 rounded object-cover"
                                    />
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-white font-medium text-sm truncate">{song.title}</p>
                                        <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="text-gray-400 text-xs">{song.durationFormatted}</span>
                                            {song.source === 'spotify' && (
                                                <p className="text-green-400 text-[10px]">Spotify</p>
                                            )}
                                            {song.source === 'deezer' && (
                                                <p className="text-blue-400 text-[10px]">Deezer</p>
                                            )}
                                        </div>
                                        <Bookmark className="w-5 h-5 text-gray-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : searchQuery ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <p>No results found</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <p>Search for music</p>
                        </div>
                    )}
                </div>

                {/* Now Playing Bar (if song selected) */}
                {selectedSong && (
                    <div className="bg-gray-900 border-t border-gray-800 p-3">
                        <div className="flex items-center gap-3">
                            <img
                                src={selectedSong.artwork}
                                alt={selectedSong.title}
                                className="w-10 h-10 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{selectedSong.title}</p>
                                <p className="text-gray-400 text-xs truncate">{selectedSong.artist}</p>
                            </div>
                            <button className="p-2 bg-white rounded-full">
                                <Pause className="w-4 h-4 text-black" fill="black" />
                            </button>
                            <button
                                onClick={() => setStep('trim')}
                                className="p-2 bg-purple-500 rounded-full"
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Trim Screen - Shows story canvas with trimmer overlay
    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={() => setStep('search')}
                    className="p-2 active:scale-90 transition-transform"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
                <h2 className="text-white font-semibold drop-shadow-lg">Music Only</h2>
                <button
                    onClick={handleDone}
                    className="px-4 py-2 bg-white text-black font-semibold rounded-full active:scale-95 transition-transform"
                >
                    Done
                </button>
            </div>

            {/* Story Canvas - Full screen background */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
                {storyMedia ? (
                    storyMediaType === 'video' ? (
                        <video
                            src={storyMedia}
                            className="w-full h-full object-contain"
                            muted
                            loop
                            autoPlay
                            playsInline
                        />
                    ) : (
                        <img
                            src={storyMedia}
                            alt="Story"
                            className="w-full h-full object-contain"
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center">
                        <p className="text-white/40 text-sm">Story Preview</p>
                    </div>
                )}
            </div>

            {/* Music Only Label - Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center">
                <p className="text-white text-2xl font-bold drop-shadow-2xl">Music Only</p>
                {/* Time Counter */}
                {selectedSong && (
                    <div className="mt-4 text-white text-lg font-semibold drop-shadow-lg">
                        {formatDuration(Math.floor(currentTime))} / {selectedSong.durationFormatted}
                    </div>
                )}
            </div>

            {/* Control Icons - Middle */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10 flex gap-4" style={{ top: '60%' }}>
                <button className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                    <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                </button>
                <button className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                    <div className="w-5 h-4 bg-white rounded-sm" />
                </button>
                <button className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                    <div className="w-5 h-5 border-2 border-white rounded-full" />
                </button>
                <button className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                    <div className="w-5 h-5 bg-white rounded-full" />
                </button>
            </div>

            {/* Timeline Trimmer - Bottom Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                {/* Duration and Controls Row */}
                <div className="flex items-center justify-between mb-4">
                    <button className="w-12 h-12 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">20</span>
                    </button>

                    <button
                        onClick={togglePlayback}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                    >
                        {isPlaying ? (
                            <Pause className="w-7 h-7 text-black" fill="black" />
                        ) : (
                            <Play className="w-7 h-7 text-black ml-1" fill="black" />
                        )}
                    </button>

                    <button className="w-12 h-12 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                        <div className="w-4 h-4 bg-white rounded-sm" />
                    </button>
                </div>

                {/* Timeline */}
                <div
                    ref={timelineRef}
                    className="relative h-16 bg-gray-800 rounded-lg overflow-visible mb-4"
                >
                    {/* Static Waveform bars */}
                    <div className="absolute inset-0 flex items-center justify-around px-1 rounded-lg overflow-hidden">
                        {Array.from({ length: 60 }).map((_, i) => {
                            const baseHeight = 30 + Math.random() * 70
                            const maxDuration = selectedSong ? Math.min(selectedSong.duration, 60) : 30
                            const position = (i / 60) * maxDuration
                            const inRange = position >= trimStart && position <= trimEnd

                            return (
                                <div
                                    key={i}
                                    className={`w-0.5 rounded-full transition-colors ${inRange
                                            ? 'bg-gradient-to-t from-yellow-400 via-pink-500 to-purple-500'
                                            : 'bg-gray-600'
                                        }`}
                                    style={{
                                        height: `${baseHeight}%`,
                                        opacity: inRange ? 1 : 0.4
                                    }}
                                />
                            )
                        })}
                    </div>

                    {/* Smooth Sliding Playhead Track - Full height indicator */}
                    {isPlaying && selectedSong && (
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 rounded-full"
                            style={{
                                left: `${(currentTime / Math.min(selectedSong.duration, 60)) * 100}%`,
                                transition: 'left 0.1s linear'
                            }}
                        >
                            {/* Playhead circle indicator at top */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                        </div>
                    )}

                    {/* Trim window - draggable area */}
                    <div
                        className="absolute top-0 bottom-0 border-l-2 border-r-2 border-white pointer-events-none"
                        style={{
                            left: `${(trimStart / (selectedSong ? Math.min(selectedSong.duration, 60) : 30)) * 100}%`,
                            right: `${100 - (trimEnd / (selectedSong ? Math.min(selectedSong.duration, 60) : 30)) * 100}%`
                        }}
                    >
                        <div className="absolute inset-0 bg-white/10" />

                        {/* Animated Progress Indicator - slides within trim window */}
                        {isPlaying && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                                style={{
                                    left: `${((currentTime - trimStart) / (trimEnd - trimStart)) * 100}%`,
                                    transition: 'left 0.1s linear'
                                }}
                            />
                        )}

                        {/* Start Handle */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-8 -ml-4 flex items-center justify-center pointer-events-auto"
                            onTouchStart={(e) => handleTouchStart(e, 'start')}
                            onTouchMove={(e) => handleTouchMove(e, 'start')}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="w-1 h-12 bg-white rounded-full shadow-lg" />
                        </div>

                        {/* End Handle */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-8 -mr-4 flex items-center justify-center pointer-events-auto"
                            onTouchStart={(e) => handleTouchStart(e, 'end')}
                            onTouchMove={(e) => handleTouchMove(e, 'end')}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="w-1 h-12 bg-white rounded-full shadow-lg" />
                        </div>
                    </div>
                </div>

            </div>

            {/* Hidden Audio */}
            {selectedSong && (
                <audio
                    ref={audioRef}
                    src={selectedSong.previewUrl}
                    preload="auto"
                    crossOrigin="anonymous"
                    onLoadedData={() => console.log('Audio loaded successfully')}
                    onCanPlay={() => console.log('Audio can play')}
                    onError={(e) => {
                        console.error('Audio load error:', e)
                        console.error('Failed URL:', selectedSong.previewUrl)
                        setIsPlaying(false)
                    }}
                />
            )}
        </div>
    )
}
