"use client"

import { Sparkles, Bell, Zap, Film, UserCircle2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { useEffect, useState, useCallback } from "react"

const navItems = [
  { href: "/feed", icon: Sparkles, label: "Home" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/create", icon: Zap, label: "Create" },
  { href: "/reels", icon: Film, label: "Reels" },
  { href: "/profile", icon: UserCircle2, label: "Profile" },
]

// Version: 2.0 - Updated icon sizes
export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  // Handle navigation click with optimized routing (must be before early return)
  const handleNavigation = useCallback((href: string) => {
    // If not authenticated and trying to access protected route, redirect to login
    if (!user && href !== "/feed" && href !== "/search") {
      router.push('/login')
      return
    }

    // Special handling for different routes with optimized navigation
    switch (href) {
      case "/profile":
        if (user) {
          router.push(`/profile/${user.username || ''}`)
        }
        break
      case "/create":
      case "/reels":
      case "/stories":
        if (user) {
          router.push(href)
        }
        break
      default:
        router.push(href)
    }
  }, [router, user])

  // Set mounted state and aggressive prefetch routes
  useEffect(() => {
    setMounted(true)

    // Aggressive prefetch for instant navigation
    if (user) {
      // Prefetch immediately for instant navigation
      router.prefetch('/feed')
      router.prefetch('/notifications')
      router.prefetch('/reels')
      router.prefetch('/search')
      router.prefetch('/create')
      
      if (user.username) {
        router.prefetch(`/profile/${user.username}`)
      }
    }
  }, [router, user])

  // Fetch notification count
  useEffect(() => {
    if (!user) {
      setNotificationCount(0)
      return
    }

    const fetchNotificationCount = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token=') || row.startsWith('client-token='))
          ?.split('=')[1]

        const response = await fetch('/api/notifications?limit=1', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })

        if (response.ok) {
          const data = await response.json()
          setNotificationCount(data.unread_count || 0)
        }
      } catch (error) {
        console.error('Error fetching notification count:', error)
      }
    }

    fetchNotificationCount()

    // Poll every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  // Don't render navigation if not mounted yet (prevents hydration mismatch)
  if (!mounted) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          // Improved active state detection
          const isActive =
            pathname === item.href ||
            (item.href !== "/feed" && pathname.startsWith(item.href)) ||
            (item.href === "/profile" && pathname.startsWith("/profile"))

          const Icon = item.icon

          return (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-lg transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10 scale-110"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                {item.label === "Notifications" && notificationCount > 0 && (
                  <span 
                    style={{ pointerEvents: 'none' }}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
