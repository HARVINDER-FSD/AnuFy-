"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Shield, Bell, Moon, Globe, UserX, Download, Trash2, HelpCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth/auth-provider"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

const settingsGroups = [
  {
    title: "Account",
    items: [
      { id: "privacy", label: "Privacy and Security", icon: Shield, href: "/settings/privacy" },
      { id: "notifications", label: "Notifications", icon: Bell, href: "/settings/notifications" },
      { id: "blocked", label: "Blocked Accounts", icon: UserX, href: "/settings/blocked" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "theme", label: "Dark Mode", icon: Moon, toggle: true },
      { id: "language", label: "Language", icon: Globe, href: "/settings/language" },
    ],
  },
  {
    title: "Data",
    items: [
      { id: "download", label: "Download Your Data", icon: Download, href: "/settings/download" },
      { id: "delete", label: "Delete Account", icon: Trash2, href: "/settings/delete", danger: true },
    ],
  },
  {
    title: "Support",
    items: [{ id: "help", label: "Help Center", icon: HelpCircle, href: "/help" }],
  },
  {
    title: "Session",
    items: [{ id: "logout", label: "Log Out", icon: LogOut, danger: true }],
  },
]

// Function to fetch user settings
const fetchUserSettings = async () => {
  try {
    // Accept either cookie name and fallback to localStorage
    let token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token') || ''
    if (token) token = token.replace(/^["']|["']$/g, '')
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch('/api/settings', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    const data = await response.json();
    return data.settings || { darkMode: true };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { darkMode: true };
  }
}

// Function to update user settings
const updateUserSetting = async (setting: string, value: any) => {
  try {
    let token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token') || ''
    if (token) token = token.replace(/^["']|["']$/g, '')
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ [setting]: value })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update setting')
    }
    
    return true
  } catch (error) {
    console.error('Error updating setting:', error)
    return false
  }
}

export default function SettingsPage() {
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync darkMode state with current theme
  useEffect(() => {
    if (mounted) {
      setDarkMode(theme === 'dark')
    }
  }, [theme, mounted])

  // Load user settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token')
        
        if (!token) {
          toast({
            title: "Authentication error",
            description: "Please log in again",
            variant: "destructive",
          });
          router.push('/login');
          return;
        }
        
        const settings = await fetchUserSettings()
        const isDark = settings.darkMode !== false // Default to dark if not set
        setDarkMode(isDark)
        setTheme(isDark ? 'dark' : 'light')
      } catch (error) {
        console.error('Error loading settings:', error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false)
      }
    }
    
    if (mounted) {
      loadSettings()
    }
  }, [mounted])

  const handleToggle = async (id: string, value: boolean) => {
    if (id === "theme") {
      // Optimistic UI update
      setDarkMode(value)
      setTheme(value ? 'dark' : 'light')
      
      // Update setting in backend
      const success = await updateUserSetting('darkMode', value)
      
      if (success) {
        toast({
          title: value ? "Dark mode enabled" : "Light mode enabled",
          description: "Your theme preference has been updated.",
        })
      } else {
        // Revert on failure
        setDarkMode(!value)
        setTheme(!value ? 'dark' : 'light')
        toast({
          title: "Error",
          description: "Failed to update theme preference. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return null
  }

  const handleLogout = async () => {
    try {
      const token = Cookies.get('client-token') || Cookies.get('token');
      
      // Call the logout API endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // Clear cookies
      Cookies.remove('token', { path: '/' });
      Cookies.remove('client-token', { path: '/' });
      localStorage.removeItem('token');
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out",
      });
      
      // Hard redirect to login page to ensure complete page refresh
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive"
      });
      // Force navigation even if logout fails
      window.location.href = '/login';
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle className="text-lg">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon

                if ('toggle' in item && item.toggle) {
                  return (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <Switch
                        checked={item.id === "theme" ? darkMode : false}
                        onCheckedChange={(checked) => handleToggle(item.id, checked)}
                        aria-label={`Toggle ${item.label}`}
                      />
                    </div>
                  )
                }

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start gap-3 py-3 h-auto ${
                      'danger' in item && item.danger ? "text-destructive hover:text-destructive" : ""
                    }`}
                    onClick={() => 'href' in item && item.href && router.push(item.href)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        ))}

        <Separator />

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full gap-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="h-6 w-6" />
          Sign Out
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>AnuFy v1.0.0</p>
<p>Made with ❤️ by the AnuFy team</p>
        </div>
      </motion.div>
    </div>
  )
}
