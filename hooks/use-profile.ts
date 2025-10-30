/**
 * Custom hook for using ProfileManager
 * Provides easy access to profile data with automatic updates
 */

import { useState, useEffect, useCallback } from 'react';
import ProfileManager from '@/lib/profile-manager';

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

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      // Load current user's profile
      try {
        setLoading(true);
        const data = await ProfileManager.getCurrentUserProfile(forceRefresh);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    } else {
      // Load specific user's profile
      try {
        setLoading(true);
        const data = await ProfileManager.fetchProfileData(userId, forceRefresh);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
  }, [userId]);

  const refresh = useCallback(() => {
    loadProfile(true);
  }, [loadProfile]);

  useEffect(() => {
    loadProfile();

    // Listen for profile updates
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      // Only update if it's the same user
      if (!userId || updatedData.id === userId) {
        loadProfile(true);
      }
    };

    const events = [
      'profile-updated',
      'force-profile-refresh',
      'force-mongodb-refresh',
      'profiles-cleared'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleProfileUpdate as EventListener);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleProfileUpdate as EventListener);
      });
    };
  }, [loadProfile, userId]);

  return {
    profile,
    loading,
    error,
    refresh
  };
}

export function useCurrentUser() {
  return useProfile();
}
