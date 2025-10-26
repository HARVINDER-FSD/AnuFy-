"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Play, Pause, Music, LogIn } from 'lucide-react'
import { isSpotifyAuthenticated, redirectToSpotifyAuth, getSpotifyTokens } from '@/lib/spotify-auth'
import { getSpotifyPlayer } from '@/lib/spotify-player'

interface Song {
  id: string
  title: string
  artist: string
  duration: number
  durationFormatted: string
  artwork: string
  previewUrl: string
  fullSongUrl?: string | null
  spotifyUri?: string
  source: 'itunes' | 'spotify' | 'deezer'
}

interface SpotifyFullSongPlayerProps {
  song: Song
  trimStart: number
  trimEnd: number
  onClose: () => void
  onTimeUpdate?: (currentTime: number) => void
}

export function SpotifyFullSongPlayer({ 
  song, 
  trimStart, 
  trimEnd, 
  onClose,
  onTimeUpdate 
}: SpotifyFullSongPlayerProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(trimStart)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check authentication on mount
  useEffect(() => {
    setIsAuthenticated(isSpotifyAuthenticated())
  }, [])

  // Initialize Spotify player when authenticated
  useEffect(() => {
    if (isAuthenticated && !playerRef.current && song.spotifyUri) {
      initializePlayer()
    }
  }, [isAuthenticated, song.spotifyUri])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (playerRef.current) {
        playerRef.current.disconnect()
      }
    }
  }, [])

  const initializePlayer = async () => {
    setIsInitializing(true)
    try {
      const player = getSpotifyPlayer()
      const success = await player.initialize()
      
      if (success) {
        playerRef.current = player
        setIsPlayerReady(true)
        console.log('✅ Spotify player initialized')
      }
    } catch (error) {
      console.error('Player initialization error:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleLogin = () => {
    redirectToSpotifyAuth()
  }

  const togglePlayback = async () => {
    if (!playerRef.current || !song.spotifyUri) return

    if (isPlaying) {
      await playerRef.current.pause()
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    } else {
      // Play from trim start position
      const success = await playerRef.current.playTrack(song.spotifyUri, trimStart * 1000)
      
      if (success) {
        setIsPlaying(true)
        
        // Start position tracking
        intervalRef.current = setInterval(async () => {
          const state = await playerRef.current.getState()
          if (state) {
            const positionSec = state.position / 1000
            setCurrentTime(positionSec)
            onTimeUpdate?.(positionSec)

            // Loop within trim range
            if (positionSec >= trimEnd) {
              await playerRef.current.seek(trimStart * 1000)
            }
          }
        }, 100)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-white text-2xl font-bold mb-3">
            Full Song Playback
          </h2>
          
          <p className="text-gray-300 mb-6">
            Login with Spotify to play complete songs (not just 30-second previews)
          </p>

          <div className="bg-gray-900 rounded-lg p-4 mb-6 text-left">
            <p className="text-white font-semibold mb-2">What you get:</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>✅ Full-length songs (3-5 minutes)</li>
              <li>✅ High-quality streaming</li>
              <li>✅ 100M+ track catalog</li>
              <li>✅ Works with free Spotify accounts</li>
            </ul>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-3 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Login with Spotify
          </button>

          <p className="text-gray-500 text-xs mt-4">
            Free or Premium account required
          </p>
        </div>
      </div>
    )
  }

  // Authenticated but player not ready
  if (!isPlayerReady) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">
            {isInitializing ? 'Initializing Spotify Player...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Player ready - show playback controls
  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Album Art */}
        <img
          src={song.artwork}
          alt={song.title}
          className="w-64 h-64 rounded-lg shadow-2xl mb-8"
        />

        {/* Song Info */}
        <h2 className="text-white text-2xl font-bold mb-2 text-center">
          {song.title}
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          {song.artist}
        </p>

        {/* Time Display */}
        <div className="text-white text-sm mb-4">
          {formatTime(currentTime)} / {formatTime(trimEnd)}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md h-1 bg-gray-700 rounded-full mb-8">
          <div 
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ 
              width: `${((currentTime - trimStart) / (trimEnd - trimStart)) * 100}%` 
            }}
          />
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayback}
          className="w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-10 h-10 text-white" fill="white" />
          ) : (
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          )}
        </button>

        {/* Trim Info */}
        <p className="text-gray-500 text-sm mt-6">
          Playing {formatTime(trimStart)} - {formatTime(trimEnd)}
        </p>
      </div>
    </div>
  )
}
