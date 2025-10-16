"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function SplashScreen() {
  const router = useRouter()
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Show splash screen for 2 seconds then redirect to login
    const timer = setTimeout(() => {
      setShow(false)
      router.push('/login')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className={`fixed inset-0 bg-background flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <h1 
        className="text-6xl mb-4"
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
      <p className="text-muted-foreground mt-2">Connect with friends and the world</p>
    </div>
  )
}