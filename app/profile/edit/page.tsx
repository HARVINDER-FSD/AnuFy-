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
import JWTManager from "@/lib/jwt-manager"
import ProfileManager from "@/lib/profile-manager"

export default function EditProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    full_name: (user as any)?.full_name || user?.name || "",
    bio: user?.bio || "",
    website: (user as any)?.website || "",
    location: (user as any)?.location || "",
    isPrivate: (user as any)?.is_private || false,
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [userData, setUserData] = useState<any>(null)

  // Fetch fresh user data using ProfileManager
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingData(true);
      console.log('[Profile Edit] Starting to load user data...');

      try {
        // Check if authenticated
        if (!JWTManager.isAuthenticated()) {
          console.log('[Profile Edit] Not authenticated, redirecting to login');
          toast({
            title: "Authentication required",
            description: "Please log in to edit your profile",
            variant: "destructive",
          });
          router.push('/login');
          return;
        }

        console.log('[Profile Edit] Fetching fresh user data from ProfileManager...');

        // Use ProfileManager to get fresh data
        const freshData = await ProfileManager.getCurrentUserProfile(true);

        console.log('[Profile Edit] Fresh user data received:', JSON.stringify(freshData, null, 2));

        if (!freshData) {
          console.error('[Profile Edit] No data returned from ProfileManager');
          toast({
            title: "Error loading profile",
            description: "Could not load your profile data",
            variant: "destructive",
          });
          setIsLoadingData(false);
          return;
        }

        console.log('[Profile Edit] Avatar from data:', freshData.avatar);
        console.log('[Profile Edit] Bio from data:', freshData.bio);
        console.log('[Profile Edit] Name from data:', freshData.name);

        setUserData(freshData);

        // Update form with fresh data
        const formDataToSet = {
          username: freshData.username || "",
          email: freshData.email || "",
          full_name: freshData.name || "",
          bio: freshData.bio || "",
          website: (freshData as any).website || "",
          location: (freshData as any).location || "",
          isPrivate: (freshData as any).is_private || false,
        };

        console.log('[Profile Edit] Setting form data:', JSON.stringify(formDataToSet, null, 2));
        setFormData(formDataToSet);

        // Set current avatar as preview
        console.log('[Profile Edit] Setting avatar preview:', freshData.avatar);
        if (freshData.avatar) {
          setAvatarPreview(freshData.avatar);
          console.log('[Profile Edit] Avatar preview set successfully');
        } else {
          console.warn('[Profile Edit] No avatar in fresh data');
        }

        setIsLoadingData(false);
        console.log('[Profile Edit] Data loading complete');

      } catch (error: any) {
        console.error("[Profile Edit] Error loading user data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, [router, toast]);

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Store the file for later upload
      setAvatarFile(file)

      // Show preview
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
      // Get token using JWT Manager
      const token = JWTManager.getToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Get current avatar - use the one from userData (loaded on page load)
      let avatarUrl = (userData as any)?.avatar || avatarPreview || "";

      if (avatarFile) {
        setUploadingAvatar(true);
        toast({
          title: "Uploading image...",
          description: "Please wait while we upload your profile picture.",
        });

        try {
          // Get Cloudinary config
          const configResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!configResponse.ok) {
            throw new Error('Failed to get upload configuration');
          }

          const config = await configResponse.json();

          // Upload to Cloudinary
          const uploadFormData = new FormData();
          uploadFormData.append('file', avatarFile);
          uploadFormData.append('upload_preset', config.uploadPreset);
          uploadFormData.append('folder', config.folder);
          uploadFormData.append('public_id', config.publicId);

          const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
            {
              method: 'POST',
              body: uploadFormData
            }
          );

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const uploadResult = await uploadResponse.json();
          avatarUrl = uploadResult.secure_url;

          console.log('Image uploaded successfully:', avatarUrl);

          toast({
            title: "Image uploaded!",
            description: "Saving your profile...",
          });

        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: uploadError.message || "Failed to upload image. Continuing with profile update...",
            variant: "destructive",
          });
          // Continue with profile update even if upload fails
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Prepare the update data with all fields
      const updateData = {
        name: formData.full_name || (user as any)?.full_name || user?.name || formData.username,
        bio: formData.bio || "",
        avatar: avatarUrl,
        website: formData.website || "",
        location: formData.location || ""
      };

      console.log("[Profile Save] Current form data:", formData);
      console.log("[Profile Save] Sending update data:", updateData);
      console.log("[Profile Save] Avatar URL:", avatarUrl);

      // Real API call to update profile
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      console.log("[Profile Save] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Profile Save] Error response:", errorText);
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
      console.log("[Profile Save] Profile updated successfully:", updatedUserData);

      // Update privacy settings if changed (optional - don't fail if it doesn't work)
      if (formData.isPrivate !== (userData as any)?.is_private) {
        try {
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
            console.warn('Privacy update failed, but continuing with profile update');
          }
        } catch (privacyError) {
          console.warn('Privacy update error:', privacyError);
          // Don't throw - privacy update is optional
        }
      }

      // Success - update complete using ProfileManager
      console.log("[Profile Save] Profile updated successfully, refreshing with ProfileManager");
      
      // Use ProfileManager to handle the update and refresh
      const userId = ProfileManager.getCurrentUserId();
      if (userId) {
        await ProfileManager.updateProfile(userId, updatedUserData);
      }
      
      // Get fresh data from ProfileManager
      const freshData = await ProfileManager.getCurrentUserProfile(true);
      console.log("[Profile Save] Fresh data after ProfileManager refresh:", freshData);

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      })

      // Redirect to profile using the username from updated data or form data
      const usernameToUse = updatedUserData?.username || formData.username || user?.username;
      console.log("[Profile Save] Redirecting to profile:", usernameToUse);

      // Force a hard reload to clear all caches
      const redirectTimestamp = Date.now();
      setTimeout(() => {
        if (usernameToUse) {
          // Force page reload with cache busting parameter
          window.location.href = `/profile/${usernameToUse}?_t=${redirectTimestamp}`;
        } else {
          console.error("[Profile Save] No username found for redirect");
          router.push('/profile/edit'); // Stay on edit page if no username
        }
      }, 1500) // Increased delay for MongoDB Atlas replication
    } catch (error: any) {
      console.error("Update error:", error);
      toast({
        title: "Failed to update profile",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
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
                  <AvatarImage src={avatarPreview || ((userData as any)?.avatar || user?.avatar) || "/placeholder.svg"} alt={formData.username} />
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
        <Button onClick={handleSave} disabled={isLoading || uploadingAvatar} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {uploadingAvatar ? "Uploading image..." : isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </motion.div>
    </div>
  )
}
