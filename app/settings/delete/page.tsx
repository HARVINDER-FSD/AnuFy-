"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import Cookies from "js-cookie"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DeleteAccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleDeleteAccount = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password to confirm deletion",
        variant: "destructive",
      })
      return
    }

    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: 'Please type "DELETE" to confirm',
        variant: "destructive",
      })
      return
    }

    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    setShowConfirmDialog(false)

    try {
      const token = Cookies.get('client-token') || Cookies.get('token') || localStorage.getItem('token')
      
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.replace(/^["']|["']$/g, '')}`
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account')
      }

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      })

      // Clear all auth data
      Cookies.remove('token', { path: '/' })
      Cookies.remove('client-token', { path: '/' })
      localStorage.removeItem('token')

      // Redirect to home page
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)

    } catch (error: any) {
      console.error('Delete account error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Delete Account</h1>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Permanently Delete Account</CardTitle>
          </div>
          <CardDescription>
            This action cannot be undone. All your data will be permanently deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning List */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What will be deleted:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Your profile and account information</li>
              <li>• All your posts, reels, and stories</li>
              <li>• All your comments and likes</li>
              <li>• All your messages and conversations</li>
              <li>• All your followers and following connections</li>
              <li>• All your saved and bookmarked content</li>
            </ul>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Enter your password to confirm</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
            />
          </div>

          {/* Confirmation Text */}
          <div className="space-y-2">
            <Label htmlFor="confirm">Type "DELETE" to confirm</Label>
            <Input
              id="confirm"
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
            />
          </div>

          {/* Delete Button */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDeleteAccount}
            disabled={isDeleting || !password || confirmText !== "DELETE"}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Account...
              </>
            ) : (
              "Delete My Account Permanently"
            )}
          </Button>

          {/* Cancel Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and remove all your data from our servers.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
