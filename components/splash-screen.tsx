"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Check if splash screen has been shown in this session
    const hasShownSplash = sessionStorage.getItem('splashShown')
    
    if (!hasShownSplash) {
      setShouldRender(true)
      setIsVisible(true)
      
      // Hide splash screen after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        sessionStorage.setItem('splashShown', 'true')
        
        // Remove from DOM after animation completes
        setTimeout(() => {
          setShouldRender(false)
        }, 500)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut"
            }}
            className="text-center"
          >
            {/* AnuFy Logo */}
            <motion.h1
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl sm:text-8xl mb-4"
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

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-muted-foreground text-sm sm:text-base"
            >
              Connect with the World
            </motion.p>

            {/* Loading animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex justify-center gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
