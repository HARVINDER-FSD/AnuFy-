"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SplashScreen } from "@/components/splash-screen"
import { useAuth } from "@/components/auth/auth-provider"

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      // After splash screen completes, redirect based on auth status
      if (!showSplash) {
        if (user) {
          router.push('/feed')
        } else {
          router.push('/login')
        }
      }
    }
  }, [showSplash, user, loading, router])

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </>
  )
}
