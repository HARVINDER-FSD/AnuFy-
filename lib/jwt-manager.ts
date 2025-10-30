/**
 * Master JWT Manager
 * 
 * Centralized JWT token management for the entire application.
 * This file handles all JWT operations to ensure consistency.
 */

// Add TypeScript declaration for global window property
declare global {
  interface Window {
    updateAuthUser?: (userData: any) => void;
  }
}

import { jwtDecode } from 'jwt-decode';

// Token storage keys
const TOKEN_KEY = 'token';
const CLIENT_TOKEN_KEY = 'client-token';

// Cache for user data
let userDataCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

/**
 * Get JWT token from cookies or localStorage
 */
export function getToken(): string | null {
  // Try cookies first (browser)
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(c => c.startsWith(`${TOKEN_KEY}=`)) || 
                       cookies.find(c => c.startsWith(`${CLIENT_TOKEN_KEY}=`));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }

  // Try localStorage as fallback
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(CLIENT_TOKEN_KEY);
  }

  return null;
}

/**
 * Set JWT token in cookies and localStorage
 */
export function setToken(token: string): void {
  // Set in cookie
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
  }

  // Set in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Clear cache when token changes
  clearUserCache();
}

/**
 * Remove JWT token from all storage
 */
export function removeToken(): void {
  // Remove from cookies
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${CLIENT_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  // Remove from localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CLIENT_TOKEN_KEY);
  }

  // Clear cache
  clearUserCache();
}

/**
 * Verify if token is valid (not expired)
 */
export function isTokenValid(token?: string): boolean {
  const tokenToCheck = token || getToken();
  
  if (!tokenToCheck) {
    return false;
  }

  try {
    const decoded: any = jwtDecode(tokenToCheck);
    
    // Check if token is expired
    if (decoded.exp) {
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user ID from token (for quick access)
 */
export function getUserIdFromToken(): string | null {
  const token = getToken();
  
  if (!token || !isTokenValid(token)) {
    return null;
  }

  try {
    const decoded: any = jwtDecode(token);
    return decoded.userId || decoded.sub || null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch fresh user data from API (with caching)
 * This is the ONLY way to get user data - never use JWT payload
 */
export async function fetchUserData(forceRefresh: boolean = false): Promise<any> {
  // Always force refresh for avatar data
  forceRefresh = true;
  
  // Return cached data if still valid (except for avatar)
  if (!forceRefresh && userDataCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return userDataCache;
  }

  const token = getToken();
  
  if (!token || !isTokenValid(token)) {
    clearUserCache();
    return null;
  }
  
  // Add cache-busting timestamp to ensure fresh data from MongoDB
  const cacheBuster = Date.now();

  try {
    const response = await fetch(`/api/users/me?t=${cacheBuster}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, remove it
        removeToken();
      }
      return null;
    }

    const userData = await response.json();
    
    // Normalize the data
    const normalizedData = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      name: userData.name || userData.full_name || '',
      avatar: userData.avatar_url || userData.avatar || '/placeholder-user.jpg',
      bio: userData.bio || '',
      followers: userData.followers_count || userData.followers || 0,
      following: userData.following_count || userData.following || 0,
      verified: userData.is_verified || userData.verified || false,
      posts_count: userData.posts_count || 0
    };

    // Cache the data
    userDataCache = normalizedData;
    cacheTimestamp = Date.now();

    return normalizedData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Clear user data cache and all related storage
 */
export function clearUserCache(): void {
  // Clear memory cache
  userDataCache = null;
  cacheTimestamp = 0;
  
  // Clear localStorage cache items
  if (typeof window !== 'undefined') {
    // Clear user-related cache items
    const cacheKeys = ['user_data', 'profile_cache', 'avatar_timestamp'];
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Dispatch cache cleared event
    window.dispatchEvent(new CustomEvent('cache-cleared', {
      detail: { timestamp: Date.now() }
    }));
  }
}

/**
 * Get cached user data (if available)
 */
export function getCachedUserData(): any {
  if (userDataCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return userDataCache;
  }
  return null;
}

/**
 * Refresh user data (force fetch from API) and trigger global refresh
 */
export async function refreshUserData(): Promise<any> {
  // Clear all caches first
  clearUserCache();
  
  // Force fetch fresh data directly from MongoDB
  const cacheBuster = Date.now();
  const freshData = await fetchUserData(true);
  
  // Dispatch global refresh events if in browser
  if (typeof window !== 'undefined' && freshData) {
    // Add timestamp for cache busting
    const timestamp = Date.now();
    
    // Add timestamp to avatar URL
    if (freshData.avatar && !freshData.avatar.startsWith('data:')) {
      freshData.avatar = freshData.avatar.includes('?') 
        ? `${freshData.avatar}&_t=${timestamp}` 
        : `${freshData.avatar}?_t=${timestamp}`;
    }
    
    // Dispatch multiple events to ensure all components update
    ['profile-updated', 'user-data-refreshed', 'invalidate-cache', 'force-profile-refresh'].forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: { ...freshData, timestamp }
      }));
      console.log(`[JWT Manager] Dispatched ${eventName} event`);
    });
    
    // Make updateAuthUser available globally for direct updates
    window.updateAuthUser = window.updateAuthUser || function(userData: any) {
      window.dispatchEvent(new CustomEvent('auth-user-update', {
        detail: userData
      }));
    };
  }
  
  return freshData;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  return token !== null && isTokenValid(token);
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getToken();
  
  if (!token || !isTokenValid(token)) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Login helper - set token and fetch user data
 */
export async function loginWithToken(token: string): Promise<any> {
  setToken(token);
  return fetchUserData(true);
}

/**
 * Logout helper - clear everything
 */
export function logout(): void {
  removeToken();
  clearUserCache();
}

// Export a default object with all functions
export default {
  getToken,
  setToken,
  removeToken,
  isTokenValid,
  getUserIdFromToken,
  fetchUserData,
  clearUserCache,
  getCachedUserData,
  refreshUserData,
  isAuthenticated,
  getAuthHeader,
  loginWithToken,
  logout
};
