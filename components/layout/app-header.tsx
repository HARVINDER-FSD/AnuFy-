"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { MessageCircle, Search } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

export function AppHeader() {
  const { user } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)

  useEffect(() => {
    // Reset counts when user is not logged in
    if (!user) {
      setNotificationCount(0);
      setMessageCount(0);
    }
  }, [user])

  return (
    <header className="top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="group inline-block py-1">
            <h1 
              className="text-2xl hover:scale-105 transition-transform duration-200 cursor-pointer"
              style={{ 
                fontFamily: "'Pacifico', 'Dancing Script', cursive",
                fontWeight: 400,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.02em',
                fontStyle: 'normal',
                transform: 'rotate(-2deg)',
                lineHeight: '1.4'
              }}
            >
              AnuFy
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/search">
            <Button variant="ghost" size="sm" className="relative">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/messages">
            <Button variant="ghost" size="sm" className="relative">
              <MessageCircle className="h-5 w-5" />
              {messageCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {messageCount > 9 ? "9+" : messageCount}
                </Badge>
              )}
            </Button>
          </Link>

          <NotificationDropdown />
        </div>
      </div>
    </header>
  )
}
