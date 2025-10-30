"use client"

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileManager from '@/lib/profile-manager';

interface ProfileAvatarProps {
  userId: string;
  username: string;
  avatar?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

export function ProfileAvatar({ userId, username, avatar: initialAvatar, className, size = 'md' }: ProfileAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar || '/placeholder.svg');

  useEffect(() => {
    // Fetch fresh avatar from ProfileManager
    const loadAvatar = async () => {
      try {
        const profileData = await ProfileManager.fetchProfileData(userId);
        if (profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };

    loadAvatar();

    // Listen for profile updates
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      if (updatedData.id === userId && updatedData.avatar_url) {
        setAvatarUrl(updatedData.avatar_url);
      }
    };

    const events = ['profile-updated', 'force-profile-refresh', 'force-mongodb-refresh'];
    events.forEach(event => {
      window.addEventListener(event, handleProfileUpdate as EventListener);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleProfileUpdate as EventListener);
      });
    };
  }, [userId]);

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ''}`}>
      <AvatarImage src={avatarUrl} alt={username} />
      <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
