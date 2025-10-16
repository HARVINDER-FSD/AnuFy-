"use client"

import { Sparkles, Compass, Zap, Clapperboard, UserCircle2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { useEffect, useState, useCallback } from "react"

const navItems = [
  { href: "/feed", icon: Sparkles, label: "Home" },
  { href: "/search", icon: Compass, label: "Search" },
  { href: "/create", icon: Zap, label: "Create" },
  { href: "/reels", icon: Clapperboard, label: "Reels" },
  { href: "/profile", icon: UserCircle2, label: "Profile" },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  
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
  
  // Set mounted state and lazy prefetch routes
  useEffect(() => {
    setMounted(true)
    
    // Lazy prefetch only critical routes after a delay
    const prefetchTimer = setTimeout(() => {
      if (user) {
        // Only prefetch if user is logged in
        router.prefetch('/feed')
        router.prefetch('/search')
        if (user.username) {
          router.prefetch(`/profile/${user.username}`)
        }
      }
    }, 1000) // Delay prefetch by 1s to prioritize initial load
    
    return () => clearTimeout(prefetchTimer)
  }, [router, user])

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
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
