"use client"

import { useEffect } from "react"
import { APP_VERSION } from "@/lib/cache-manager"

/**
 * Cache Control Component
 * Automatically detects version changes and refreshes the app
 */
export function CacheControl() {
  useEffect(() => {
    // Check version on mount
    const storedVersion = localStorage.getItem("app-version")
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log(`🔄 Version changed: ${storedVersion} → ${APP_VERSION}`)
      console.log("Clearing cache and reloading...")
      
      // Clear cache
      localStorage.setItem("app-version", APP_VERSION)
      
      // Force reload without cache
      window.location.reload()
    } else if (!storedVersion) {
      // First time, just store version
      localStorage.setItem("app-version", APP_VERSION)
    }
  }, [])

  // Add version to body for debugging
  useEffect(() => {
    document.body.setAttribute("data-app-version", APP_VERSION)
  }, [])

  return null
}
