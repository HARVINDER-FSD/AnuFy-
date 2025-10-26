"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, UserX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BlockedUser {
  id: string
  username: string
  full_name: string
  avatar_url: string
  blocked_at: string
}

export default function BlockedUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unblockingUser, setUnblockingUser] = useState<string | null>(null)
  const [showUnblockDialog, setShowUnblockDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null)

  useEffect(() => {
    fetchBlockedUsers()
  }, [])

  const fetchBlockedUsers = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch('/api/users/blocked', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBlockedUsers(data.blocked_users || [])
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load blocked users',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = async (user: BlockedUser) => {
    setSelectedUser(user)
    setShowUnblockDialog(true)
  }

  const confirmUnblock = async () => {
    if (!selectedUser) return

    setUnblockingUser(selectedUser.id)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch(`/api/users/${selectedUser.id}/block`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== selectedUser.id))
        toast({
          title: 'User unblocked',
          description: `You unblocked @${selectedUser.username}`
        })
      } else {
        throw new Error('Failed to unblock user')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unblock user',
        variant: 'destructive'
      })
    } finally {
      setUnblockingUser(null)
      setShowUnblockDialog(false)
      setSelectedUser(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Blocked Accounts</h1>
            <p className="text-sm text-muted-foreground">
              {blockedUsers.length} {blockedUsers.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UserX className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No blocked accounts</h3>
            <p className="text-muted-foreground">
              When you block someone, they won't be able to find your profile, posts, or stories.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {blockedUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || '/placeholder.svg'} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.username}</p>
                  {user.full_name && (
                    <p className="text-sm text-muted-foreground truncate">{user.full_name}</p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(user)}
                  disabled={unblockingUser === user.id}
                >
                  {unblockingUser === user.id ? 'Unblocking...' : 'Unblock'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock @{selectedUser?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to see your profile, posts, and stories. They won't be notified that you unblocked them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnblock}>
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
