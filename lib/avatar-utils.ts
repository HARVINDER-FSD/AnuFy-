/**
 * Utility functions for handling avatar URLs with cache busting
 */

/**
 * Add cache-busting timestamp to avatar URL
 * This ensures browsers fetch the latest version after profile updates
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  if (!avatarUrl || avatarUrl === '') {
    return '/placeholder.svg'
  }

  // Don't add timestamp to placeholder images
  if (avatarUrl === '/placeholder.svg' || avatarUrl === '/placeholder-user.jpg') {
    return avatarUrl
  }

  // Add timestamp for cache busting
  const timestamp = Date.now()
  const separator = avatarUrl.includes('?') ? '&' : '?'
  return `${avatarUrl}${separator}t=${timestamp}`
}

/**
 * Get fresh avatar URL from API
 */
export async function fetchFreshAvatar(userId?: string): Promise<string> {
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token=') || row.startsWith('client-token='))
      ?.split('=')[1]

    const response = await fetch(`/api/users/me?t=${Date.now()}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      cache: 'no-store'
    })

    if (response.ok) {
      const data = await response.json()
      return data.avatar_url || data.avatar || '/placeholder.svg'
    }
  } catch (error) {
    console.error('Error fetching fresh avatar:', error)
  }

  return '/placeholder.svg'
}
