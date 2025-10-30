/**
 * Profile Sync Utility
 * Ensures profile data is consistent across all API responses
 */

import ProfileManager from './profile-manager';

/**
 * Enrich API response data with fresh profile information
 * Use this in API routes to ensure profile data is always up-to-date
 */
export async function enrichWithProfileData(data: any): Promise<any> {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return Promise.all(data.map(item => enrichWithProfileData(item)));
  }

  // Handle objects with user data
  if (data.user_id || data.userId) {
    const userId = data.user_id || data.userId;
    try {
      const profileData = await ProfileManager.fetchProfileData(userId);
      if (profileData) {
        // Merge profile data into the response
        return {
          ...data,
          username: profileData.username,
          user_avatar: profileData.avatar_url,
          avatar_url: profileData.avatar_url,
          full_name: profileData.name,
          is_verified: profileData.verified
        };
      }
    } catch (error) {
      console.error('Error enriching profile data:', error);
    }
  }

  // Handle nested user objects
  if (data.user) {
    const userId = data.user.id || data.user._id;
    if (userId) {
      try {
        const profileData = await ProfileManager.fetchProfileData(userId);
        if (profileData) {
          data.user = {
            ...data.user,
            username: profileData.username,
            avatar: profileData.avatar_url,
            avatar_url: profileData.avatar_url,
            name: profileData.name,
            verified: profileData.verified
          };
        }
      } catch (error) {
        console.error('Error enriching nested profile data:', error);
      }
    }
  }

  return data;
}

/**
 * Normalize profile data from various sources
 * Ensures consistent field names across the app
 */
export function normalizeProfileData(data: any): any {
  if (!data) return null;

  return {
    id: data.id || data._id?.toString(),
    username: data.username,
    email: data.email,
    name: data.name || data.full_name || '',
    avatar: data.avatar_url || data.avatar || '/placeholder-user.jpg',
    avatar_url: data.avatar_url || data.avatar || '/placeholder-user.jpg',
    bio: data.bio || '',
    followers: data.followers_count || data.followers || 0,
    following: data.following_count || data.following || 0,
    verified: data.is_verified || data.verified || false,
    posts_count: data.posts_count || 0,
    website: data.website || '',
    location: data.location || '',
    is_private: data.is_private || false
  };
}

/**
 * Add cache-busting timestamp to avatar URLs
 */
export function addCacheBuster(url: string | null | undefined): string {
  if (!url || url === '/placeholder-user.jpg' || url === '/placeholder.svg') {
    return url || '/placeholder.svg';
  }

  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${timestamp}`;
}
