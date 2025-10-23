"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    directMessages: true,
    liveVideos: false,
    stories: true,
    posts: true,
    marketing: false,
    security: true,
  })

  const handleToggle = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: "Notification setting updated",
      description: "Your preferences have been saved.",
    })
  }

  const notificationGroups = [
    {
      title: "General",
      items: [
        { key: "pushNotifications", label: "Push Notifications", description: "Receive notifications on your device" },
        { key: "emailNotifications", label: "Email Notifications", description: "Receive notifications via email" },
      ],
    },
    {
      title: "Activity",
      items: [
        { key: "likes", label: "Likes", description: "When someone likes your posts", icon: Heart },
        { key: "comments", label: "Comments", description: "When someone comments on your posts", icon: MessageCircle },
        { key: "follows", label: "New Followers", description: "When someone follows you", icon: UserPlus },
        { key: "mentions", label: "Mentions", description: "When someone mentions you", icon: Bell },
      ],
    },
    {
      title: "Messages & Content",
      items: [
        {
          key: "directMessages",
          label: "Direct Messages",
          description: "New messages from other users",
          icon: MessageCircle,
        },
        { key: "stories", label: "Stories", description: "When people you follow post stories", icon: Bell },
        { key: "posts", label: "Posts", description: "When people you follow post new content", icon: Bell },
        { key: "liveVideos", label: "Live Videos", description: "When people you follow go live", icon: Video },
      ],
    },
    {
      title: "Other",
      items: [
        { key: "security", label: "Security Alerts", description: "Important security notifications" },
        { key: "marketing", label: "Marketing", description: "Updates about new features and tips" },
      ],
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {notificationGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <h4 className="font-medium">{item.label}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[item.key as keyof typeof settings]}
                      onCheckedChange={(checked) => handleToggle(item.key, checked)}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}

        {/* Notification Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
            <CardDescription>Set times when you don't want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Quiet hours feature coming soon</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
