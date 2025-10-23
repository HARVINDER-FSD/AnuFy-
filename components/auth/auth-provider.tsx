"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/auth-utils"

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
    // Optimized token verification for faster loading
    const verifyToken = async () => {
      try {
        // Get token using utility
        const token = getAuthToken()
        
        if (!token) {
          setUser(null)
          setLoading(false)
          return
        }
        
        // Decode token immediately for instant user data
        const decoded = jwtDecode(token) as any
        
        // Set user from token immediately (fast)
        const quickUser = {
          id: decoded.userId || decoded.sub,
          username: decoded.username || '',
          email: decoded.email || '',
          name: decoded.name || decoded.username || '',
          avatar: decoded.avatar || '/placeholder-user.jpg',
          bio: decoded.bio || '',
          followers: decoded.followers || 0,
          following: decoded.following || 0,
          verified: decoded.verified || false,
          posts_count: decoded.posts_count || 0
        }
        setUser(quickUser)
        setLoading(false) // Stop loading immediately
        
        // Fetch fresh data in background (non-blocking)
        fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(3000) // 3s timeout
        })
          .then(res => res.ok ? res.json() : null)
          .then(userData => {
            if (userData) setUser(userData)
          })
          .catch(() => {}) // Silently fail, already have token data
        
      } catch (error) {
        console.error("Auth error:", error)
        removeAuthToken()
        setUser(null)
        setLoading(false)
      }
    }
    
    verifyToken()
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
        setUser(data.user);
        setAuthToken(data.token);
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
        setUser(data.user);
        if (data.token) {
          setAuthToken(data.token);
          toast({
            title: "Registration successful",
            description: "Your account has been created and you're now logged in",
          });
          router.push("/feed");
        } else {
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
      // Always clear cookies and state regardless of API response
      removeAuthToken();
      setUser(null);
      router.push("/login");
    }
  };

  // Function to update user data
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
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
