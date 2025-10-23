"use client"

import { useEffect } from "react"

export default function ChatRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Hide header and navbar
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] bg-background overflow-hidden">
      {children}
    </div>
  )
}
