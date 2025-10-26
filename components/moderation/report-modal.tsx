"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: 'post' | 'reel' | 'story' | 'comment' | 'user'
  contentId?: string
  reportedUserId?: string
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', description: 'Misleading or repetitive content' },
  { value: 'harassment', label: 'Harassment or bullying', description: 'Targeting or attacking someone' },
  { value: 'hate_speech', label: 'Hate speech', description: 'Promotes violence or hatred' },
  { value: 'violence', label: 'Violence or dangerous content', description: 'Graphic or threatening content' },
  { value: 'nudity', label: 'Nudity or sexual content', description: 'Inappropriate sexual content' },
  { value: 'false_info', label: 'False information', description: 'Misinformation or fake news' },
  { value: 'other', label: 'Something else', description: 'Other issues' },
]

export function ReportModal({ isOpen, onClose, contentType, contentId, reportedUserId }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Please select a reason',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token=') || row.startsWith('client-token='))
        ?.split('=')[1]

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reported_user_id: reportedUserId,
          reason,
          description
        })
      })

      if (response.ok) {
        toast({
          title: 'Report submitted',
          description: 'Thank you for helping keep our community safe'
        })
        onClose()
        setReason('')
        setDescription('')
      } else {
        throw new Error('Failed to submit report')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Help us understand what's happening with this {contentType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="font-normal cursor-pointer flex-1">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-sm text-muted-foreground">{r.description}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about this report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
