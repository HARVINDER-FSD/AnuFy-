'use client'

/**
 * SDK Initializer
 * Initializes the new SDK on app mount
 */

import { useEffect } from 'react'
import { SDK } from '@/sdk'

export function SDKInitializer() {
  useEffect(() => {
    // Initialize SDK
    SDK.init().catch(console.error)
  }, [])

  return null
}
