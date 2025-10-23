"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    <div className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="w-24 h-24 mb-4 relative">
        <Image 
          src="/placeholder.svg" 
          alt="App Logo" 
          fill 
          className="object-contain"
        />
      </div>
      <h1 className="text-white text-2xl font-bold">Social Connect</h1>
      <p className="text-gray-400 mt-2">Connect with friends and the world</p>
    </div>
  )
}