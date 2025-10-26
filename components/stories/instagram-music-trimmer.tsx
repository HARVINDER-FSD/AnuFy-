"use client"

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, Check } from 'lucide-react'

interface InstagramMusicTrimmerProps {
  music: {
    title: string
    artist: string
    artwork?: string
    previewUrl: string
    duration: number
  }
  onSave: (trimStart: number, trimEnd: number) => void
  onCancel: () => void
  initialStart?: number
  initialEnd?: number
}

export function InstagramMusicTrimmer({
  music,
  onSave,
  onCancel,
  initialStart = 0,
  initialEnd = 15
}: InstagramMusicTrimmerProps) {
  const [trimStart, setTrimStart] = useState(initialStart)
  const [trimEnd, setTrimEnd] = useState(Math.min(initialEnd, music.duration))
  const [currentTime, setCurrentTime] = useState(trimStart)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDraggingStart, setIsDraggingStart] = useState(false)
  const [isDraggingEnd, setIsDraggingEnd] = useState(false)
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  // Update current time while playing
  useEffect(() => {
    if (!isPlaying || !audioRef.current) return

    const updateTime = () => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime
        setCurrentTime(time)
        
        // Stop at trim end
        if (time >= trimEnd) {
          audioRef.current.pause()
          audioRef.current.currentTime = trimStart
          setCurrentTime(trimStart)
          setIsPlaying(false)
        } else {
          animationFrameRef.current = requestAnimationFrame(updateTime)
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateTime)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, trimEnd, trimStart])

  // Play/Pause
  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.currentTime = trimStart
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Handle touch/mouse on timeline
  const handleTimelineInteraction = (clientX: number, type: 'start' | 'end' | 'scrubber') => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const time = percentage * music.duration

    if (type === 'start') {
      setTrimStart(Math.min(time, trimEnd - 1))
    } else if (type === 'end') {
      setTrimEnd(Math.max(time, trimStart + 1))
    } else if (type === 'scrubber') {
      const clampedTime = Math.max(trimStart, Math.min(trimEnd, time))
      setCurrentTime(clampedTime)
      if (audioRef.current) {
        audioRef.current.currentTime = clampedTime
      }
    }
  }

  // Touch handlers for start handle
  const handleStartTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDraggingStart(true)
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  const handleStartMove = (e: TouchEvent) => {
    if (!isDraggingStart) return
    e.preventDefault()
    handleTimelineInteraction(e.touches[0].clientX, 'start')
  }

  const handleStartEnd = () => {
    setIsDraggingStart(false)
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  // Touch handlers for end handle
  const handleEndTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDraggingEnd(true)
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  const handleEndMove = (e: TouchEvent) => {
    if (!isDraggingEnd) return
    e.preventDefault()
    handleTimelineInteraction(e.touches[0].clientX, 'end')
  }

  const handleEndEnd = () => {
    setIsDraggingEnd(false)
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  // Touch handlers for scrubber
  const handleScrubberTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDraggingScrubber(true)
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    }
  }

  const handleScrubberMove = (e: TouchEvent) => {
    if (!isDraggingScrubber) return
    e.preventDefault()
    handleTimelineInteraction(e.touches[0].clientX, 'scrubber')
  }

  const handleScrubberEnd = () => {
    setIsDraggingScrubber(false)
  }

  // Add/remove touch listeners
  useEffect(() => {
    if (isDraggingStart) {
      document.addEventListener('touchmove', handleStartMove, { passive: false })
      document.addEventListener('touchend', handleStartEnd)
      return () => {
        document.removeEventListener('touchmove', handleStartMove)
        document.removeEventListener('touchend', handleStartEnd)
      }
    }
  }, [isDraggingStart])

  useEffect(() => {
    if (isDraggingEnd) {
      document.addEventListener('touchmove', handleEndMove, { passive: false })
      document.addEventListener('touchend', handleEndEnd)
      return () => {
        document.removeEventListener('touchmove', handleEndMove)
        document.removeEventListener('touchend', handleEndEnd)
      }
    }
  }, [isDraggingEnd])

  useEffect(() => {
    if (isDraggingScrubber) {
      document.addEventListener('touchmove', handleScrubberMove, { passive: false })
      document.addEventListener('touchend', handleScrubberEnd)
      return () => {
        document.removeEventListener('touchmove', handleScrubberMove)
        document.removeEventListener('touchend', handleScrubberEnd)
      }
    }
  }, [isDraggingScrubber])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const trimDuration = trimEnd - trimStart

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onCancel}
          className="p-2 active:scale-90 transition-transform"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-white font-semibold">Trim Music</h2>
        <button
          onClick={() => onSave(trimStart, trimEnd)}
          className="p-2 active:scale-90 transition-transform"
        >
          <Check className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Music Info */}
      <div className="px-4 py-6 flex items-center gap-4">
        {music.artwork && (
          <img
            src={music.artwork}
            alt={music.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-lg truncate">{music.title}</p>
          <p className="text-white/60 text-sm truncate">{music.artist}</p>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 flex flex-col justify-center px-4">
        <div className="space-y-6">
          {/* Duration Display */}
          <div className="text-center">
            <div className="text-white text-3xl font-bold">
              {formatTime(trimDuration)}
            </div>
            <div className="text-white/60 text-sm mt-1">
              {formatTime(trimStart)} - {formatTime(trimEnd)}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative py-8">
            {/* Background track */}
            <div
              ref={timelineRef}
              className="relative h-16 bg-white/10 rounded-lg overflow-hidden"
            >
              {/* Waveform visualization (simplified) */}
              <div className="absolute inset-0 flex items-center justify-around px-1">
                {Array.from({ length: 40 }).map((_, i) => {
                  const height = 20 + Math.random() * 60
                  const inRange = (i / 40) * music.duration >= trimStart && (i / 40) * music.duration <= trimEnd
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-colors ${
                        inRange ? 'bg-white' : 'bg-white/30'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  )
                })}
              </div>

              {/* Trim overlay */}
              <div
                className="absolute top-0 bottom-0 bg-purple-500/30 border-l-2 border-r-2 border-purple-500"
                style={{
                  left: `${(trimStart / music.duration) * 100}%`,
                  right: `${100 - (trimEnd / music.duration) * 100}%`
                }}
              />

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                style={{
                  left: `${(currentTime / music.duration) * 100}%`
                }}
              >
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
                  onTouchStart={handleScrubberTouch}
                />
              </div>

              {/* Start handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-purple-500 z-20"
                style={{ left: `${(trimStart / music.duration) * 100}%` }}
              >
                <div
                  className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-12 bg-purple-500 rounded-lg shadow-lg flex items-center justify-center active:scale-110 transition-transform"
                  onTouchStart={handleStartTouch}
                >
                  <div className="w-0.5 h-6 bg-white rounded-full" />
                </div>
              </div>

              {/* End handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-purple-500 z-20"
                style={{ left: `${(trimEnd / music.duration) * 100}%` }}
              >
                <div
                  className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-12 bg-purple-500 rounded-lg shadow-lg flex items-center justify-center active:scale-110 transition-transform"
                  onTouchStart={handleEndTouch}
                >
                  <div className="w-0.5 h-6 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={togglePlayback}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-black" fill="black" />
              ) : (
                <Play className="w-8 h-8 text-black ml-1" fill="black" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Audio */}
      <audio
        ref={audioRef}
        src={music.previewUrl}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}
