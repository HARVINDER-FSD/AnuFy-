"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ReelPlayer } from "@/components/reels/reel-player"
import { useAuth } from "@/components/auth/auth-provider"
import { Play } from "lucide-react"

interface Reel {
  id: string
  user: {
    id: string
    username: string
    avatar?: string
    verified: boolean
  }
  video: string
  video_url?: string
  caption: string
  description?: string
  title?: string
  thumbnail_url?: string
  music?: {
    title: string
    artist: string
  }
  likes: number
  comments: number
  shares: number
  liked: boolean
  bookmarked: boolean
}

interface ReelGridProps {
  reels: Reel[]
  onReelDeleted?: (reelId: string) => void
}

export function ReelGrid({ reels, onReelDeleted }: ReelGridProps) {
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  const { user } = useAuth()

  const handleReelClick = (reel: Reel) => {
    setSelectedReel(reel)
  }

  const handleDeleteReel = (reelId: string) => {
    setSelectedReel(null)
    onReelDeleted?.(reelId)
  }

  // Format reel for ReelPlayer component
  const formatReelForPlayer = (reel: Reel) => {
    return {
      id: reel.id,
      user: reel.user,
      video: reel.video_url || reel.video,
      caption: reel.caption || reel.description || reel.title || "",
      music: reel.music,
      likes: reel.likes || 0,
      comments: reel.comments || 0,
      shares: reel.shares || 0,
      liked: reel.liked || false,
      bookmarked: reel.bookmarked || false,
      isOwner: user?.id === reel.user?.id
    }
  }

  if (!reels || reels.length === 0) {
    return (
      <div className="col-span-3 text-center py-12">
        <p className="text-muted-foreground text-lg">No reels yet</p>
        <p className="text-muted-foreground text-sm mt-2">
          Reels you create will appear here
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {reels.map((reel) => (
          <div
            key={reel.id}
            className="aspect-[9/16] bg-muted rounded-lg cursor-pointer hover:opacity-80 transition-opacity relative group"
            onClick={() => handleReelClick(reel)}
          >
            {/* Thumbnail */}
            {reel.thumbnail_url ? (
              <img
                src={reel.thumbnail_url}
                alt={reel.caption || reel.title || "Reel"}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <video
                src={reel.video_url || reel.video}
                className="w-full h-full object-cover rounded-lg"
                muted
              />
            )}
            
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-black/70 transition-colors">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
            </div>

            {/* Hover overlay with stats */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span className="font-semibold">{reel.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{reel.comments || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reel Detail Modal */}
      <Dialog open={!!selectedReel} onOpenChange={() => setSelectedReel(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black">
          {selectedReel && (
            <ReelPlayer
              reel={formatReelForPlayer(selectedReel)}
              isActive={true}
              currentUserId={user?.id}
              onDelete={handleDeleteReel}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
