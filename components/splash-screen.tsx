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
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      >
        <div className="text-center">
          <motion.div initial={{ scale: 1 }} animate={{ scale: 0.8 }} transition={{ duration: 0.5 }} className="mb-4">
            <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">SC</span>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-2xl font-bold text-foreground"
          >
            AnuFy
          </motion.h1>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto bg-primary rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-3xl font-bold text-primary-foreground">SC</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-3xl font-bold text-foreground mb-2"
        >
          SocialConnect
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-muted-foreground"
        >
          Connect with the world
        </motion.p>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="mt-8"
        >
          <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </motion.div>
      </div>
    </motion.div>
  )
}
