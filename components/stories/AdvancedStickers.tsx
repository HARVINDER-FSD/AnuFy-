"use client"

import { useState, useEffect } from 'react'

// Instagram-Style Countdown - Fully touchable
export function CountdownSticker({ data }: { data: any }) {
  const [timeLeft, setTimeLeft] = useState('')
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(data.endDate).getTime() - new Date().getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        
        if (days > 0) {
          setTimeLeft(`${days} DAYS`)
        } else if (hours > 0) {
          setTimeLeft(`${hours} HOURS`)
        } else {
          setTimeLeft(`${minutes} MINUTES`)
        }
      } else {
        setTimeLeft('TIME\'S UP!')
      }
    }
    
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000)
    
    return () => clearInterval(timer)
  }, [data.endDate])
  
  const bgColor = data.color || 'black'
  
  return (
    <div 
      className="backdrop-blur-sm rounded-2xl p-4 min-w-[240px]"
      style={{ backgroundColor: `${bgColor}cc` }}
    >
      <div className="text-center pointer-events-none">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
          {data.name}
        </p>
        <p className="text-white font-black text-3xl tracking-tight">
          {timeLeft}
        </p>
        <p className="text-white/60 text-xs mt-1">
          {new Date(data.endDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  )
}

// Instagram-Style Poll - Fully touchable
export function PollSticker({ data }: { data: any }) {
  const bgColor = data.color || 'white'
  const textColor = data.color === 'white' || !data.color ? 'black' : 'white'
  
  return (
    <div 
      className="backdrop-blur-sm rounded-3xl p-4 min-w-[260px]"
      style={{ backgroundColor: `${bgColor}f2` }}
    >
      <div className="pointer-events-none">
        <p className="font-bold text-base mb-3 text-center" style={{ color: textColor }}>
          {data.question}
        </p>
        
        {data.options.map((option: string, idx: number) => (
          <div
            key={idx}
            className="w-full px-4 py-3 mb-2 rounded-full border-2"
            style={{ 
              backgroundColor: `${textColor}1a`,
              borderColor: `${textColor}33`
            }}
          >
            <span className="font-semibold text-sm" style={{ color: textColor }}>
              {option}
            </span>
          </div>
        ))}
        
        <p className="text-xs text-center mt-2 uppercase tracking-wide opacity-60" style={{ color: textColor }}>
          Tap to vote
        </p>
      </div>
    </div>
  )
}

// Instagram-Style Question - Fully touchable
export function QuestionSticker({ data }: { data: any }) {
  const baseColor = data.color || '#8b5cf6'
  
  return (
    <div 
      className="rounded-3xl p-5 min-w-[260px]"
      style={{ background: `linear-gradient(135deg, ${baseColor}ee, ${baseColor}dd)` }}
    >
      <div className="pointer-events-none">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
          Ask me a question
        </p>
        <p className="text-white font-bold text-lg mb-3">{data.question}</p>
        <div className="bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/30">
          <p className="text-white/70 text-sm">Tap to respond...</p>
        </div>
      </div>
    </div>
  )
}

// Instagram-Style Slider - Fully touchable
export function SliderSticker({ data }: { data: any }) {
  const baseColor = data.color || '#ec4899'
  
  return (
    <div 
      className="rounded-3xl p-5 min-w-[260px]"
      style={{ background: `linear-gradient(90deg, ${baseColor}ee, ${baseColor}dd)` }}
    >
      <div className="pointer-events-none">
        <p className="text-white font-bold text-base mb-4 text-center">{data.question}</p>
        <div className="relative bg-white/25 backdrop-blur-sm rounded-full h-12 flex items-center justify-center border border-white/30">
          <span className="text-3xl">{data.emoji}</span>
        </div>
        <p className="text-white/70 text-xs text-center mt-3 uppercase tracking-wide">
          Slide to rate
        </p>
      </div>
    </div>
  )
}

// Instagram-Style Location - Fully touchable
export function LocationSticker({ data }: { data: any }) {
  const bgColor = data.color || 'white'
  const textColor = data.color === 'white' || !data.color ? 'black' : 'white'
  
  return (
    <div 
      className="backdrop-blur-sm rounded-2xl px-4 py-3 min-w-[200px]"
      style={{ backgroundColor: `${bgColor}f2` }}
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <span className="text-2xl">📍</span>
        <p className="font-bold text-sm" style={{ color: textColor }}>{data.location}</p>
      </div>
    </div>
  )
}

// Instagram-Style Mention - Fully touchable
export function MentionSticker({ data }: { data: any }) {
  const baseColor = data.color || '#8b5cf6'
  
  return (
    <div 
      className="rounded-full px-5 py-2.5"
      style={{ background: `linear-gradient(90deg, ${baseColor}ee, ${baseColor}dd)` }}
    >
      <span className="text-white font-bold text-base pointer-events-none">@{data.username}</span>
    </div>
  )
}

// Instagram-Style Hashtag - Fully touchable
export function HashtagSticker({ data }: { data: any }) {
  const bgColor = data.color || '#3b82f6'
  
  return (
    <div 
      className="rounded-full px-5 py-2.5"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-white font-bold text-lg pointer-events-none">{data.hashtag}</span>
    </div>
  )
}

// Instagram-Style Link - Fully touchable
export function LinkSticker({ data }: { data: any }) {
  const bgColor = data.color || 'white'
  const textColor = data.color === 'white' || !data.color ? 'black' : 'white'
  
  return (
    <div 
      className="backdrop-blur-sm rounded-2xl px-5 py-3 min-w-[220px]"
      style={{ backgroundColor: `${bgColor}f2` }}
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <span className="text-2xl">🔗</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: textColor }}>{data.text}</p>
          <p className="text-xs uppercase tracking-wide opacity-60" style={{ color: textColor }}>See more</p>
        </div>
      </div>
    </div>
  )
}
