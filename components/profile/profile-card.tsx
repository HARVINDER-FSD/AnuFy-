"use client"

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProfileManager from '@/lib/profile-manager';
import { UserPlus, UserCheck } from 'lucide-react';

interface ProfileCardProps {
  userId: string;
  showFollowButton?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function ProfileCard({ userId, showFollowButton = false, onFollowChange }: ProfileCardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await ProfileManager.fetchProfileData(userId, true);
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    // Listen for profile updates
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      if (updatedData.id === userId) {
        setProfile(updatedData);
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

  const handleFollow = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        onFollowChange?.(newFollowState);
        
        // Update follower count
        if (profile) {
          setProfile({
            ...profile,
            followers: profile.followers + (newFollowState ? 1 : -1)
          });
        }
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || profile.avatar} alt={profile.username} />
            <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm truncate">{profile.username}</p>
              {profile.verified && (
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-primary-foreground">✓</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile.name || profile.bio}</p>
            <p className="text-xs text-muted-foreground">
              {profile.followers || 0} followers
            </p>
          </div>

          {showFollowButton && (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={handleFollow}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
