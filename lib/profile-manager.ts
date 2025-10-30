/**
 * Master Profile Manager
 * Central manager for all profile data across the application
 */

import { jwtDecode } from 'jwt-decode';

// Profile data interface
interface ProfileData {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
  [key: string]: any;
}

// Global window interface
declare global {
  interface Window {
    updateProfile?: (userId: string, data: Partial<ProfileData>) => void;
    refreshAllProfiles?: () => void;
    getProfileData?: (userId: string) => Promise<ProfileData | null>;
  }
}

// Global cache with short duration
let profileCache: Map<string, { data: ProfileData; timestamp: number }> = new Map();
const CACHE_DURATION = 1000; // 1 second (very short)

/**
 * Get token from storage
 */
function getToken(): string | null {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(c => c.startsWith('token=')) || 
                       cookies.find(c => c.startsWith('client-token='));
    if (tokenCookie) return tokenCookie.split('=')[1];
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || localStorage.getItem('client-token');
  }
  return null;
}

/**
 * Get current user ID from token
 */
export function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded: any = jwtDecode(token);
    return decoded.userId || decoded.sub || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Clear all profile caches
 */
export function clearAllProfileCaches(): void {
  profileCache.clear();
  if (typeof window !== 'undefined') {
    // Clear profile-related items from storage
    ['profile_data', 'user_data', 'avatar_timestamp', 'profile_cache'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('profiles-cleared', {
      detail: { timestamp: Date.now() }
    }));
  }
}

/**
 * Fetch profile data directly from MongoDB
 */
export async function fetchProfileData(userId: string, forceRefresh: boolean = false): Promise<ProfileData | null> {
  // Always use cache busting
  const cacheBuster = Date.now();
  
  // Check cache first (unless force refresh)
  if (!forceRefresh && profileCache.has(userId)) {
    const cached = profileCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
  }
  
  const token = getToken();
  if (!token) return null;
  
  try {
    // Fetch from API with cache busting
    const response = await fetch(`/api/users/${userId}?t=${cacheBuster}&direct=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch profile: ${response.status}`);
    
    const data = await response.json();
    
    // Normalize the data
    const normalizedData: ProfileData = {
      id: data.id || data._id,
      username: data.username,
      email: data.email,
      name: data.name || data.full_name || '',
      avatar: data.avatar_url || data.avatar || '/placeholder-user.jpg',
      avatar_url: data.avatar_url || data.avatar || '/placeholder-user.jpg',
      bio: data.bio || '',
      followers: data.followers_count || data.followers || 0,
      following: data.following_count || data.following || 0,
      verified: data.is_verified || data.verified || false
    };
    
    // Add cache busting to avatar URLs
    if (normalizedData.avatar && !normalizedData.avatar.startsWith('data:')) {
      normalizedData.avatar = normalizedData.avatar.includes('?') 
        ? `${normalizedData.avatar}&t=${cacheBuster}` 
        : `${normalizedData.avatar}?t=${cacheBuster}`;
    }
    
    if (normalizedData.avatar_url && !normalizedData.avatar_url.startsWith('data:')) {
      normalizedData.avatar_url = normalizedData.avatar_url.includes('?') 
        ? `${normalizedData.avatar_url}&t=${cacheBuster}` 
        : `${normalizedData.avatar_url}?t=${cacheBuster}`;
    }
    
    // Update cache
    profileCache.set(userId, {
      data: normalizedData,
      timestamp: Date.now()
    });
    
    return normalizedData;
  } catch (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get current user's profile data
 */
export async function getCurrentUserProfile(forceRefresh: boolean = false): Promise<ProfileData | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;
  return fetchProfileData(userId, forceRefresh);
}

/**
 * Update profile data and notify all components
 */
export async function updateProfile(userId: string, updates: Partial<ProfileData>): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Send update to API
    const response = await fetch(`/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) throw new Error(`Failed to update profile: ${response.status}`);
    
    // Clear cache and fetch fresh data
    clearAllProfileCaches();
    const freshData = await fetchProfileData(userId, true);
    if (!freshData) return false;
    
    // Dispatch global events with timestamp
    const timestamp = Date.now();
    
    // Dispatch all refresh events
    ['profile-updated', 'force-profile-refresh', 'force-mongodb-refresh'].forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: { ...freshData, timestamp }
      }));
    });
    
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

/**
 * Initialize global profile functions
 */
export function initProfileManager(): void {
  if (typeof window !== 'undefined') {
    // Make functions available globally
    window.updateProfile = (userId: string, data: Partial<ProfileData>) => {
      updateProfile(userId, data);
    };
    
    window.refreshAllProfiles = () => {
      clearAllProfileCaches();
      window.dispatchEvent(new CustomEvent('force-mongodb-refresh', {
        detail: { timestamp: Date.now() }
      }));
    };
    
    window.getProfileData = async (userId: string) => {
      return fetchProfileData(userId, true);
    };
    
    // Initialize by clearing caches
    clearAllProfileCaches();
    console.log('[ProfileManager] Initialized');
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  setTimeout(initProfileManager, 0);
}

// Default export
const ProfileManager = {
  getCurrentUserId,
  fetchProfileData,
  getCurrentUserProfile,
  updateProfile,
  clearAllProfileCaches,
  initProfileManager
};

export default ProfileManager;