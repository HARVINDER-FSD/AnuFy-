"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import JWTManager from "@/lib/jwt-manager"
import ProfileManager from "@/lib/profile-manager"

interface User {
  id: string
  username: string
  email: string
  name?: string
  avatar?: string
  bio?: string
  followers: number
  following: number
  verified: boolean
  posts_count?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  updateUser: (updatedUser: User) => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Use ProfileManager to load user
    const loadUser = async () => {
      try {
        const userId = ProfileManager.getCurrentUserId();
        if (!userId) {
          setUser(null)
          setLoading(false)
          return
        }

        // Fetch fresh user data directly from MongoDB using ProfileManager
        const userData = await ProfileManager.getCurrentUserProfile(true);

        if (userData) {
          const normalizedUser = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            name: userData.name || '',
            avatar: userData.avatar_url,
            bio: userData.bio || '',
            followers: userData.followers || 0,
            following: userData.following || 0,
            verified: userData.verified || false,
            posts_count: userData.posts_count || 0
          };
          
          setUser(normalizedUser)
          // Make user data available globally
          if (typeof window !== 'undefined' && window.updateAuthUser) {
            window.updateAuthUser(normalizedUser);
          }
        } else {
          setUser(null)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading user:', error)
        JWTManager.logout()
        setUser(null)
        setLoading(false)
      }
    };

    loadUser();

    // Listen for profile updates
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      console.log('[Auth Provider] Profile updated event received:', updatedData);
      
      // Force a refresh of user data directly from MongoDB
      ProfileManager.clearAllProfileCaches();
      ProfileManager.getCurrentUserProfile(true).then(freshData => {
        console.log('[Auth Provider] Fresh data after profile update:', freshData);
        
        if (!freshData) return;
        
        const timestamp = Date.now();
        let avatarUrl = freshData.avatar_url || freshData.avatar || '/placeholder-user.jpg';
        if (avatarUrl && avatarUrl !== '/placeholder-user.jpg') {
          avatarUrl = avatarUrl.includes('?') 
            ? `${avatarUrl}&t=${timestamp}` 
            : `${avatarUrl}?t=${timestamp}`;
        }
        
        // Convert profile data to user format
        const updatedUser = {
          id: freshData.id,
          username: freshData.username,
          email: freshData.email || updatedData.email,
          name: freshData.name || updatedData.full_name || updatedData.name || '',
          avatar: avatarUrl,
          bio: freshData.bio || updatedData.bio || '',
          followers: freshData.followers || updatedData.followers_count || updatedData.followers || 0,
          following: freshData.following || updatedData.following_count || updatedData.following || 0,
          verified: freshData.verified || updatedData.is_verified || updatedData.verified || false,
          posts_count: freshData.posts_count || updatedData.posts_count || 0
        };
        
        // Update user state
        setUser(updatedUser);
        
        // Make user data available globally
        if (typeof window !== 'undefined' && window.updateAuthUser) {
          window.updateAuthUser(updatedUser);
        }
        
        // Dispatch global event to refresh all components
        const refreshEvent = new CustomEvent('force-profile-refresh', { 
          detail: { 
            ...updatedUser,
            timestamp: timestamp 
          }
        });
        window.dispatchEvent(refreshEvent);
        
        // Dispatch global event to refresh all components
        window.dispatchEvent(new CustomEvent('user-data-refreshed', {
          detail: { timestamp }
        }));
      }).catch(error => {
        console.error('[Auth Provider] Error refreshing user data:', error);
        
        // Fallback to event data if refresh fails
        const timestamp = Date.now();
        let avatarUrl = updatedData.avatar_url || updatedData.avatar || '/placeholder-user.jpg';
        if (avatarUrl && avatarUrl !== '/placeholder-user.jpg') {
          avatarUrl = avatarUrl.includes('?') 
            ? `${avatarUrl}&t=${timestamp}` 
            : `${avatarUrl}?t=${timestamp}`;
        }
        
        setUser({
          id: updatedData.id,
          username: updatedData.username,
          email: updatedData.email,
          name: updatedData.name || updatedData.full_name || '',
          avatar: avatarUrl,
          bio: updatedData.bio || '',
          followers: updatedData.followers_count || updatedData.followers || 0,
          following: updatedData.following_count || updatedData.following || 0,
          verified: updatedData.is_verified || updatedData.verified || false,
          posts_count: updatedData.posts_count || 0
        });
      });
    }

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener)

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use JWT manager to handle login
        const userData = await JWTManager.loginWithToken(data.token);
        setUser(userData);

        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // Force a small delay to ensure cookie is set before redirect
        setTimeout(() => {
          router.push("/feed");
        }, 100);
        return true;
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Please check your credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }

  const register = async (username: string, email: string, password: string, name: string): Promise<boolean> => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after registration
        if (data.token) {
          const userData = await JWTManager.loginWithToken(data.token);
          setUser(userData);
          toast({
            title: "Registration successful",
            description: "Your account has been created and you're now logged in",
          });
          router.push("/feed");
        } else {
          setUser(data.user);
          toast({
            title: "Registration successful",
            description: "Your account has been created",
          });
          router.push("/login");
        }
        return true;
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Please check your information",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    try {
      // Call logout API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Use JWT manager to handle logout
      JWTManager.logout();
      setUser(null);

      // Use router.replace for cleaner navigation
      router.replace("/login");
    }
  };

  // Function to update user data using JWT manager
  const updateUser = async (updatedUser: User) => {
    // Optimistically update UI
    setUser(updatedUser);

    // Refresh from database using JWT manager
    try {
      const freshData = await JWTManager.refreshUserData();
      if (freshData) {
        setUser(freshData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, setUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  // Removed excessive re-verification for better performance
  // Token is already verified in AuthProvider

  return context
}
