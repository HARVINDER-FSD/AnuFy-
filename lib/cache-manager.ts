/**
 * Master Cache Manager
 * Central control for all app caching behavior
 * Update APP_VERSION to force cache refresh across entire app
 */

// ⚠️ INCREMENT THIS VERSION TO FORCE CACHE REFRESH EVERYWHERE
export const APP_VERSION = "1.0.3"

// Cache configuration
export const CACHE_CONFIG = {
  // Development: No caching for instant updates
  development: {
    pages: "no-store",
    api: "no-cache",
    images: 0,
    revalidate: 0,
  },
  
  // Production: Optimized caching
  production: {
    pages: "force-cache",
    api: "default",
    images: 3600, // 1 hour
    revalidate: 60, // 1 minute
  },
}

// Get current environment
const ENV = process.env.NODE_ENV || "development"

// Export active config
export const ACTIVE_CACHE = CACHE_CONFIG[ENV as keyof typeof CACHE_CONFIG]

/**
 * Get cache headers for API routes
 */
export function getCacheHeaders(maxAge: number = 0) {
  if (ENV === "development") {
    return {
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-App-Version": APP_VERSION,
    }
  }
  
  return {
    "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    "X-App-Version": APP_VERSION,
  }
}

/**
 * Get versioned URL for cache busting
 */
export function getVersionedUrl(url: string): string {
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}v=${APP_VERSION}`
}

/**
 * Clear client-side cache
 */
export function clearClientCache() {
  if (typeof window !== "undefined") {
    // Clear localStorage
    const keysToKeep = ["token", "client-token", "user"]
    const allKeys = Object.keys(localStorage)
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Reload with cache bypass
    window.location.reload()
  }
}

/**
 * Get fetch options with proper caching
 */
export function getFetchOptions(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    cache: ENV === "development" ? "no-store" : (options.cache || "default"),
    headers: {
      ...options.headers,
      "X-App-Version": APP_VERSION,
    },
  }
}

// Log cache config on import
console.log(`🔧 Cache Manager: v${APP_VERSION} (${ENV})`)
