"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Shield, Eye, Users, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function PrivacySettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [settings, setSettings] = useState({
    privateAccount: false,
    showOnlineStatus: true,
    allowTagging: true,
    allowMentions: true,
    showReadReceipts: true,
    whoCanMessage: "everyone", // everyone, followers, nobody
    whoCanSeeStories: "everyone", // everyone, followers, close-friends
    whoCanSeeFollowers: "everyone", // everyone, followers, nobody
  })

  const handleToggle = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: "Privacy setting updated",
      description: "Your changes have been saved.",
    })
  }

  const handleSelectChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: "Privacy setting updated",
      description: "Your changes have been saved.",
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Privacy & Security</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Account Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Account Privacy
            </CardTitle>
            <CardDescription>Control who can see your content and interact with you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Private Account</h4>
                <p className="text-sm text-muted-foreground">Only approved followers can see your posts</p>
              </div>
              <Switch
                checked={settings.privateAccount}
                onCheckedChange={(checked) => handleToggle("privateAccount", checked)}
              />
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Who can message you</h4>
                <Select
                  value={settings.whoCanMessage}
                  onValueChange={(value) => handleSelectChange("whoCanMessage", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="followers">Followers only</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="font-medium mb-2">Who can see your stories</h4>
                <Select
                  value={settings.whoCanSeeStories}
                  onValueChange={(value) => handleSelectChange("whoCanSeeStories", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="followers">Followers only</SelectItem>
                    <SelectItem value="close-friends">Close friends only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="font-medium mb-2">Who can see your followers</h4>
                <Select
                  value={settings.whoCanSeeFollowers}
                  onValueChange={(value) => handleSelectChange("whoCanSeeFollowers", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="followers">Followers only</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Activity Status
            </CardTitle>
            <CardDescription>Control what others can see about your activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Show online status</h4>
                <p className="text-sm text-muted-foreground">Let others see when you're active</p>
              </div>
              <Switch
                checked={settings.showOnlineStatus}
                onCheckedChange={(checked) => handleToggle("showOnlineStatus", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Read receipts</h4>
                <p className="text-sm text-muted-foreground">Show when you've read messages</p>
              </div>
              <Switch
                checked={settings.showReadReceipts}
                onCheckedChange={(checked) => handleToggle("showReadReceipts", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Interactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interactions
            </CardTitle>
            <CardDescription>Control how others can interact with your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Allow tagging</h4>
                <p className="text-sm text-muted-foreground">Let others tag you in their posts</p>
              </div>
              <Switch
                checked={settings.allowTagging}
                onCheckedChange={(checked) => handleToggle("allowTagging", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Allow mentions</h4>
                <p className="text-sm text-muted-foreground">Let others mention you in comments</p>
              </div>
              <Switch
                checked={settings.allowMentions}
                onCheckedChange={(checked) => handleToggle("allowMentions", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-primary">Security Tip</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Regularly review your privacy settings and be cautious about what you share online. Consider making
                  your account private if you want more control over who sees your content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
