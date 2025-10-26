"use client"

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, Music, Scissors, Check, RotateCw, Type, Smile, Image as ImageIcon, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'

interface MusicTrack {
  id: string
  title: string
  artist: string
  duration: number
  url: string
  albumArt?: string
}

interface StoryMetadata {
  mediaType: 'photo' | 'video'
  mediaUrl: string
  mediaDuration: number
  audioTrack?: MusicTrack
  audioStart: number
  audioEnd: number
  videoStart: number
  videoEnd: number
  overlays: Array<{
    id: string
    type: 'sticker' | 'text' | 'lyrics' | 'albumArt'
    content: string
    position: { x: number; y: number }
    scale: number
    rotation: number
    style?: any
  }>
}

interface MusicStoryEditorProps {
  mediaFile: File
  mediaType: 'photo' | 'video'
  onSave: (metadata: StoryMetadata) => void
  onCancel: () => void
}

const SAMPLE_MUSIC: MusicTrack[] = [
  {
    id: '1',
    title: 'Summer Vibes',
    artist: 'DJ Cool',
    duration: 180,
    url: '/music/sample1.mp3',
    albumArt: '/album-art/1.jpg'
  },
  {
    id: '2',
    title: 'Night Drive',
    artist: 'The Weeknd',
    duration: 210,
    url: '/music/sample2.mp3',
    albumArt: '/album-art/2.jpg'
  },
  {
    id: '3',
    title: 'Happy Days',
    artist: 'Pharrell',
    duration: 195,
    url: '/music/sample3.mp3',
    albumArt: '/album-art/3.jpg'
  }
]

export function MusicStoryEditor({ mediaFile, mediaType, onSave, onCancel }: MusicStoryEditorProps) {
  const [mediaUrl, setMediaUrl] = useState<string>('')
  const [mediaDuration, setMediaDuration] = useState<number>(0)
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showMusicLibrary, setShowMusicLibrary] = useState(false)
  const [showTrimmer, setShowTrimmer] = useState(false)
  
  // Trim ranges
  const [audioStart, setAudioStart] = useState(0)
  const [audioEnd, setAudioEnd] = useState(0)
  const [videoStart, setVideoStart] = useState(0)
  const [videoEnd, setVideoEnd] = useState(0)
  
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Load media file
  useEffect(() => {
    const url = URL.createObjectURL(mediaFile)
    setMediaUrl(url)
    
    if (mediaType === 'video') {
      const video = document.createElement('video')
      video.src = url
      video.onloadedmetadata = () => {
        setMediaDuration(video.duration)
        setVideoEnd(video.duration)
      }
    } else {
      // For photos, default to 15 seconds
      setMediaDuration(15)
    }
    
    return () => URL.revokeObjectURL(url)
  }, [mediaFile, mediaType])

  // Handle music selection
  const handleSelectMusic = (track: MusicTrack) => {
    setSelectedMusic(track)
    setAudioStart(0)
    setAudioEnd(Math.min(track.duration, mediaDuration))
    setShowMusicLibrary(false)
  }

  // Play/Pause
  const togglePlayback = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause()
      if (mediaType === 'video' && mediaRef.current) {
        (mediaRef.current as HTMLVideoElement).pause()
      }
      setIsPlaying(false)
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = audioStart
        audioRef.current.play()
      }
      if (mediaType === 'video' && mediaRef.current) {
        (mediaRef.current as HTMLVideoElement).currentTime = videoStart
        ;(mediaRef.current as HTMLVideoElement).play()
      }
      setIsPlaying(true)
    }
  }

  // Update current time
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime
        setCurrentTime(time)
        
        // Stop at audio end
        if (time >= audioEnd) {
          setIsPlaying(false)
          if (audioRef.current) audioRef.current.pause()
          if (mediaType === 'video' && mediaRef.current) {
            (mediaRef.current as HTMLVideoElement).pause()
          }
        }
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [isPlaying, audioEnd, mediaType])

  // Handle save
  const handleSave = () => {
    const metadata: StoryMetadata = {
      mediaType,
      mediaUrl,
      mediaDuration,
      audioTrack: selectedMusic || undefined,
      audioStart,
      audioEnd,
      videoStart,
      videoEnd,
      overlays: []
    }
    onSave(metadata)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-6 w-6 text-white" />
        </Button>
        <h2 className="text-white font-semibold">Add Music</h2>
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Check className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center relative bg-black">
        <div className="relative w-full max-w-md aspect-[9/16] bg-black">
          {mediaType === 'video' ? (
            <video
              ref={mediaRef as any}
              src={mediaUrl}
              className="w-full h-full object-contain"
              loop={false}
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <img
              ref={mediaRef as any}
              src={mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}
          
          {/* Album Art Overlay */}
          {selectedMusic?.albumArt && (
            <div className="absolute bottom-20 left-4 w-16 h-16 rounded-lg overflow-hidden shadow-lg">
              <img src={selectedMusic.albumArt} alt="Album" className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Music Info Overlay */}
          {selectedMusic && (
            <div className="absolute bottom-20 left-24 text-white">
              <div className="text-sm font-semibold">{selectedMusic.title}</div>
              <div className="text-xs opacity-80">{selectedMusic.artist}</div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/90 p-4 space-y-4">
        {/* Playback Control */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white/20"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>

        {/* Music Selection */}
        {!selectedMusic ? (
          <Button
            className="w-full"
            onClick={() => setShowMusicLibrary(true)}
          >
            <Music className="h-4 w-4 mr-2" />
            Add Music
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowMusicLibrary(true)}
            >
              <Music className="h-4 w-4 mr-2" />
              Change Music
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTrimmer(!showTrimmer)}
            >
              <Scissors className="h-4 w-4 mr-2" />
              Trim
            </Button>
          </div>
        )}

        {/* Trimmer */}
        {showTrimmer && selectedMusic && (
          <Card className="p-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Audio Start: {audioStart.toFixed(1)}s</span>
                <span>End: {audioEnd.toFixed(1)}s</span>
              </div>
              <Slider
                value={[audioStart]}
                onValueChange={([value]) => setAudioStart(value)}
                max={selectedMusic.duration}
                step={0.1}
                className="mb-2"
              />
              <Slider
                value={[audioEnd]}
                onValueChange={([value]) => setAudioEnd(value)}
                max={selectedMusic.duration}
                step={0.1}
              />
            </div>
            
            {mediaType === 'video' && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Video Start: {videoStart.toFixed(1)}s</span>
                  <span>End: {videoEnd.toFixed(1)}s</span>
                </div>
                <Slider
                  value={[videoStart]}
                  onValueChange={([value]) => setVideoStart(value)}
                  max={mediaDuration}
                  step={0.1}
                  className="mb-2"
                />
                <Slider
                  value={[videoEnd]}
                  onValueChange={([value]) => setVideoEnd(value)}
                  max={mediaDuration}
                  step={0.1}
                />
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Music Library Modal */}
      {showMusicLibrary && (
        <div className="absolute inset-0 bg-black/95 z-10 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Select Music</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowMusicLibrary(false)}>
              <X className="h-6 w-6 text-white" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {SAMPLE_MUSIC.map((track) => (
              <button
                key={track.id}
                onClick={() => handleSelectMusic(track)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {track.albumArt && (
                  <img src={track.albumArt} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">{track.title}</div>
                  <div className="text-white/60 text-sm">{track.artist}</div>
                </div>
                <div className="text-white/40 text-sm">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      {selectedMusic && (
        <audio
          ref={audioRef}
          src={selectedMusic.url}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  )
}
