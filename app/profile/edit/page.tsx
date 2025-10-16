"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Camera, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function EditProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    full_name: user?.full_name || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
    isPrivate: user?.is_private || false,
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState(null)

  // Use the user data from auth context
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        full_name: user.full_name || "",
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        isPrivate: user.is_private || false,
      })
      
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
    
    const fetchUserData = async () => {
      try {
        // Get token from localStorage - ensure it's properly formatted
        let token = localStorage.getItem('token');
        
        if (!token) {
          // Try to get token from sessionStorage as fallback
          token = sessionStorage.getItem('token');
        }
        
        if (!token) {
          toast({
            title: "Authentication error",
            description: "Please log in again",
            variant: "destructive",
          });
          router.push('/login');
          return;
        }
        
        // Remove any quotes if present
        // Ensure token is properly formatted without quotes
        if (token) {
          token = token.replace(/^["'](.*)["']$/, '$1');
        }
        
        // Get current user's username from auth context
        const username = user?.username;
        
        if (!username) {
          throw new Error('Username not found');
        }
        
        // Use the [username] endpoint which supports GET
        const response = await fetch(`/api/users/${username}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        console.log("Fetched user data:", data);
        setUserData(data);
        
        // Update form data with fetched user data
        setFormData({
          username: data.username || "",
          email: data.email || "",
          full_name: data.full_name || "",
          bio: data.bio || "",
          website: data.website || "",
          location: data.location || "",
          isPrivate: data.is_private || false,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load user data: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
      }
    };

    fetchUserData();
  }, [router, toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Get token from localStorage - ensure it's properly formatted
      let token = localStorage.getItem('token');
      
      if (!token) {
        // Try to get token from sessionStorage as fallback
        token = sessionStorage.getItem('token');
      }
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Remove any quotes if present
      token = token.replace(/^["'](.*)["']$/, '$1');
      
      // Prepare the update data
      const updateData = {
        full_name: formData.full_name || user?.full_name || formData.username,
        bio: formData.bio || "",
        website: formData.website || "",
        location: formData.location || "",
        avatar_url: avatarPreview || (user?.avatar) || ""
      };
      
      console.log("Updating profile with data:", updateData);
      
      // Real API call to update profile
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Get the updated user data
      const updatedUserData = await response.json();
      console.log("Profile updated successfully:", updatedUserData);

      // Update privacy settings if changed
      if (formData.isPrivate !== userData?.is_private) {
        const privacyResponse = await fetch('/api/users/privacy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            is_private: formData.isPrivate
          }),
        });

        if (!privacyResponse.ok) {
          const errorText = await privacyResponse.text();
          let errorMessage = 'Failed to update privacy settings';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
      }
      
      // Success - update complete
      // Update user in auth context
      if (user && updatedUserData) {
        // Refresh the page to get updated user data
        router.refresh()
      }
      
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      })

      router.push("/profile")
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Failed to update profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle switch toggle for privacy
  const handlePrivacyToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPrivate: checked
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || (userData?.avatar || user?.avatar) || "/placeholder.svg"} alt={formData.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {formData.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
              </div>
              <div>
                <h3 className="font-medium">Upload a new photo</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a square photo for best results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                tabIndex={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself"
                value={formData.bio || ""}
                onChange={handleChange}
                className="min-h-24"
                tabIndex={0}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  placeholder="https://example.com"
                  value={formData.website || ""}
                  onChange={handleChange}
                  tabIndex={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="City, Country"
                  value={formData.location || ""}
                  onChange={handleChange}
                  tabIndex={0}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Private Account</h3>
                <p className="text-sm text-muted-foreground">
                  Only approved followers can see your content
                </p>
              </div>
              <Switch
                checked={formData.isPrivate}
                onCheckedChange={handlePrivacyToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </motion.div>
    </div>
  )
}
