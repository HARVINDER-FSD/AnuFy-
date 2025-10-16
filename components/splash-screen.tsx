"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500) // Wait for fade out animation
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-950"
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="text-5xl"
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
          </motion.h1>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-950"
    >
      <div className="text-center">
        <motion.h1
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-6xl mb-2"
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
        </motion.h1>

        <motion.p
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Connect with the world
        </motion.p>

        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8"
        >
          <div className="w-8 h-8 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      </div>
    </motion.div>
  )
}
