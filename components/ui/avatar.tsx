'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'
import ProfileManager from '@/lib/profile-manager'

function Avatar({
  className,
  userId,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { userId?: string }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  src,
  userId,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & { userId?: string }) {
  // Use state to store the timestamp and processed source
  const [timestamp, setTimestamp] = React.useState(Date.now());
  const [processedSrc, setProcessedSrc] = React.useState<string | undefined>(src);
  
  // Fetch profile data if userId is provided
  React.useEffect(() => {
    if (userId) {
      const fetchAvatar = async () => {
        try {
          const profileData = await ProfileManager.fetchProfileData(userId, true);
          if (profileData?.avatar_url) {
            setProcessedSrc(profileData.avatar_url);
          }
        } catch (error) {
          console.error('[Avatar] Error fetching profile data:', error);
        }
      };
      
      fetchAvatar();
    }
  }, [userId, timestamp]);
  
  // Listen for profile update events to refresh the avatar
  React.useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('[Avatar] Profile update detected, refreshing avatar...');
      setTimestamp(Date.now());
    };
    
    // Listen to all profile-related events
    const events = [
      'profile-updated', 
      'user-data-refreshed', 
      'invalidate-cache', 
      'force-profile-refresh', 
      'force-mongodb-refresh', 
      'cache-cleared',
      'profiles-cleared'
    ];
    
    events.forEach(event => window.addEventListener(event, handleProfileUpdate));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleProfileUpdate));
    };
  }, []);
  
  // Process the source URL with cache busting
  const finalSrc = React.useMemo(() => {
    const sourceToUse = userId ? processedSrc : src;
    
    return typeof sourceToUse === 'string' && sourceToUse && !sourceToUse.startsWith('data:') ? 
      (sourceToUse.includes('?') ? `${sourceToUse}&_t=${timestamp}&direct=true` : `${sourceToUse}?_t=${timestamp}&direct=true`) : 
      sourceToUse;
  }, [src, processedSrc, timestamp, userId]);
    
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      src={finalSrc}
      loading="eager"
      fetchPriority="high"
      referrerPolicy="no-referrer"
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
