# Master API - Real World Examples

## 🔄 Migration Examples

### Example 1: Profile Page

#### Before
```typescript
const [user, setUser] = useState(null);

useEffect(() => {
  async function loadUser() {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setUser(data);
    }
  }
  
  loadUser();
}, []);
```

#### After
```typescript
import MasterAPI from '@/lib/master-api';

const [user, setUser] = useState(null);

useEffect(() => {
  MasterAPI.User.getMe().then(setUser);
}, []);
```

---

### Example 2: Like Post

#### Before
```typescript
const handleLike = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed');
    
    const data = await response.json();
    setLiked(data.liked);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### After
```typescript
import MasterAPI from '@/lib/master-api';

const handleLike = async () => {
  try {
    await MasterAPI.Post.likePost(postId);
    setLiked(!liked);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

### Example 3: Upload Image

#### Before
```typescript
const uploadImage = async (file) => {
  // Get config
  const token = localStorage.getItem('token');
  const configRes = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const config = await configRes.json();
  
  // Upload to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  
  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  const result = await uploadRes.json();
  return result.secure_url;
};
```

#### After
```typescript
import MasterAPI from '@/lib/master-api';

const uploadImage = async (file) => {
  const config = await MasterAPI.Upload.getConfig();
  const result = await MasterAPI.Upload.uploadToCloudinary(file, config);
  return result.secure_url;
};
```

---

## 🎯 Complete Component Examples

### Feed Component

```typescript
import MasterAPI from '@/lib/master-api';
import { useEffect, useState } from 'react';

export function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await MasterAPI.Post.getFeed();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await MasterAPI.Post.likePost(postId);
      // Update local state
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, liked: !p.liked } : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>
          <p>{post.caption}</p>
          <button onClick={() => handleLike(post.id)}>
            {post.liked ? '❤️' : '🤍'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Profile Edit Component

```typescript
import MasterAPI from '@/lib/master-api';
import { useState } from 'react';

export function ProfileEdit() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await MasterAPI.User.updateProfile({ name, bio });
      
      // Clear cache to force refresh
      MasterAPI.clearCache('/api/users');
      
      alert('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <input 
        value={name} 
        onChange={e => setName(e.target.value)} 
        placeholder="Name"
      />
      <textarea 
        value={bio} 
        onChange={e => setBio(e.target.value)} 
        placeholder="Bio"
      />
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
```

### Notification Component

```typescript
import MasterAPI from '@/lib/master-api';
import { useEffect, useState } from 'react';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await MasterAPI.Notification.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await MasterAPI.Notification.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      {notifications.map(notification => (
        <div 
          key={notification.id}
          onClick={() => markAsRead(notification.id)}
          style={{ opacity: notification.is_read ? 0.5 : 1 }}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}
```

### Search Component

```typescript
import MasterAPI from '@/lib/master-api';
import { useState } from 'react';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await MasterAPI.Search.search(searchQuery);
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {searching && <div>Searching...</div>}
      <div>
        {results.map(result => (
          <div key={result.id}>{result.username}</div>
        ))}
      </div>
    </div>
  );
}
```

## 🎨 Custom Hook Example

```typescript
import MasterAPI from '@/lib/master-api';
import { useEffect, useState } from 'react';

export function useUser(userId?: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const data = userId 
          ? await MasterAPI.User.getUser(userId)
          : await MasterAPI.User.getMe();
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  return { user, loading, error };
}

// Usage
function MyComponent() {
  const { user, loading, error } = useUser();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Hello {user.name}!</div>;
}
```

## 🚀 Performance Tips

1. **Use cache wisely**
```typescript
// Cache for 1 minute
const data = await apiCall('/api/posts', {
  cacheDuration: 60000
});
```

2. **Disable cache when needed**
```typescript
// Always fetch fresh data
const data = await apiCall('/api/posts', {
  cache: false
});
```

3. **Clear cache after updates**
```typescript
await MasterAPI.Post.createPost(data);
MasterAPI.clearCache('/api/posts'); // Force refresh
```

4. **Batch requests**
```typescript
// Load multiple things at once
const [user, posts, notifications] = await Promise.all([
  MasterAPI.User.getMe(),
  MasterAPI.Post.getFeed(),
  MasterAPI.Notification.getNotifications()
]);
```

## ✅ That's It!

Master API makes your app faster, more reliable, and easier to maintain!
