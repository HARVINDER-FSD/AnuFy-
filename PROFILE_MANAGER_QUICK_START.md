# ProfileManager Quick Start Guide

## 🚀 Quick Usage Examples

### 1. Display User Avatar Anywhere

```tsx
import { ProfileAvatar } from '@/components/profile/profile-avatar';

<ProfileAvatar 
  userId={user.id}
  username={user.username}
  size="md"  // sm, md, lg, xl
/>
```

### 2. Show User Profile Card

```tsx
import { ProfileCard } from '@/components/profile/profile-card';

<ProfileCard 
  userId={user.id}
  showFollowButton={true}
/>
```

### 3. Get Profile Data in Component

```tsx
import { useProfile } from '@/hooks/use-profile';

function MyComponent({ userId }) {
  const { profile, loading, refresh } = useProfile(userId);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.bio}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### 4. Get Current User Profile

```tsx
import { useCurrentUser } from '@/hooks/use-profile';

function MyComponent() {
  const { profile, loading } = useCurrentUser();
  
  return <div>Welcome {profile?.username}!</div>;
}
```

### 5. Update Profile Programmatically

```tsx
import ProfileManager from '@/lib/profile-manager';

async function updateMyProfile() {
  const userId = ProfileManager.getCurrentUserId();
  
  await ProfileManager.updateProfile(userId, {
    name: 'New Name',
    bio: 'New bio',
    avatar: 'https://...'
  });
  
  // All components will update automatically!
}
```

### 6. Force Refresh Profile Data

```tsx
import ProfileManager from '@/lib/profile-manager';

// Refresh specific user
const freshData = await ProfileManager.fetchProfileData(userId, true);

// Refresh current user
const myData = await ProfileManager.getCurrentUserProfile(true);

// Clear all caches
ProfileManager.clearAllProfileCaches();
```

### 7. Listen for Profile Updates

```tsx
useEffect(() => {
  const handleUpdate = (event: CustomEvent) => {
    console.log('Profile updated:', event.detail);
  };
  
  window.addEventListener('profile-updated', handleUpdate);
  return () => window.removeEventListener('profile-updated', handleUpdate);
}, []);
```

## 🎯 Common Use Cases

### Show User Info in a List

```tsx
import { ProfileAvatar } from '@/components/profile/profile-avatar';

function UserList({ users }) {
  return (
    <div>
      {users.map(user => (
        <div key={user.id} className="flex items-center gap-2">
          <ProfileAvatar 
            userId={user.id}
            username={user.username}
            size="sm"
          />
          <span>{user.username}</span>
        </div>
      ))}
    </div>
  );
}
```

### Profile Header Component

```tsx
import { useProfile } from '@/hooks/use-profile';

function ProfileHeader({ userId }) {
  const { profile, loading } = useProfile(userId);
  
  if (loading) return <Skeleton />;
  
  return (
    <div>
      <img src={profile.avatar_url} alt={profile.username} />
      <h1>{profile.name}</h1>
      <p>{profile.bio}</p>
      <div>
        <span>{profile.followers} followers</span>
        <span>{profile.following} following</span>
      </div>
    </div>
  );
}
```

### Update Profile Form

```tsx
import ProfileManager from '@/lib/profile-manager';
import { useState } from 'react';

function EditProfileForm() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  
  const handleSubmit = async () => {
    const userId = ProfileManager.getCurrentUserId();
    
    await ProfileManager.updateProfile(userId, {
      name,
      bio
    });
    
    // Success! All components update automatically
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <textarea value={bio} onChange={e => setBio(e.target.value)} />
      <button type="submit">Save</button>
    </form>
  );
}
```

## 📋 Profile Data Structure

```typescript
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
  posts_count?: number;
  website?: string;
  location?: string;
  is_private?: boolean;
}
```

## 🔄 Automatic Updates

ProfileManager automatically updates all components when:
- Profile is edited
- Avatar is changed
- Bio is updated
- Any profile field changes

No manual refresh needed!

## 💡 Pro Tips

1. **Use ProfileAvatar** instead of manual Avatar components
2. **Use useProfile hook** instead of manual API calls
3. **Listen to events** for real-time updates
4. **Force refresh** only when absolutely necessary
5. **Cache is automatic** - don't worry about it!

## 🐛 Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('DEBUG_PROFILE_MANAGER', 'true');

// Disable
localStorage.removeItem('DEBUG_PROFILE_MANAGER');
```

## ✅ That's It!

ProfileManager handles everything automatically:
- ✅ Fetching profile data
- ✅ Caching for performance
- ✅ Cache invalidation
- ✅ Real-time updates
- ✅ Avatar cache-busting
- ✅ Event notifications

Just use the components and hooks - ProfileManager does the rest!
