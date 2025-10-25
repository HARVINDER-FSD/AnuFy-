"use client"

import { useState, useEffect, useRef } from "react"
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ShareModal } from "@/components/share/share-modal"

interface InstagramPostModalProps {
    item: any
    type: "posts" | "reels"
    currentUserId?: string
    isOpen: boolean
    onClose: () => void
    onDelete?: (itemId: string) => void
    onLikeUpdate?: (itemId: string, isLiked: boolean, likesCount: number) => void
}

interface Comment {
    id: string
    content: string
    user: {
        id: string
        username: string
        avatar?: string
        avatar_url?: string
        full_name?: string
    }
    created_at: string
    likes_count?: number
    is_liked?: boolean
}

interface Like {
    id: string
    user: {
        id: string
        username: string
        avatar?: string
        avatar_url?: string
        full_name?: string
        is_verified?: boolean
    }
    created_at?: string
}

export function InstagramPostModal({
    item,
    type,
    currentUserId,
    isOpen,
    onClose,
    onDelete,
    onLikeUpdate,
}: InstagramPostModalProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [likes, setLikes] = useState<Like[]>([])
    const [newComment, setNewComment] = useState("")
    const [isLiked, setIsLiked] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [likesCount, setLikesCount] = useState(0)
    const [commentsCount, setCommentsCount] = useState(0)
    const [showLikesModal, setShowLikesModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [isLoadingLikes, setIsLoadingLikes] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const isLikingRef = useRef(false) // Use ref to prevent double-clicks immediately
    const { toast } = useToast()

    const isOwner = currentUserId === item?.user?.id || item?.isOwner

    useEffect(() => {
        if (isOpen && item) {
            fetchComments()
            setIsLiked(item.liked || item.is_liked || false)
            setIsSaved(item.saved || item.is_saved || false)
            setLikesCount(item.likes || item.likes_count || 0)
            setCommentsCount(item.comments || item.comments_count || 0)
        }
    }, [isOpen, item])

    // Sync state when item prop changes (for like updates from parent)
    useEffect(() => {
        if (item) {
            setIsLiked(item.liked || item.is_liked || false)
            setLikesCount(item.likes || item.likes_count || 0)
        }
    }, [item?.liked, item?.is_liked, item?.likes, item?.likes_count])

    const fetchComments = async () => {
        setIsLoadingComments(true)
        try {
            const endpoint = type === "reels"
                ? `/api/reels/${item.id}/comments`
                : `/api/posts/${item.id}/comments`

            const response = await fetch(endpoint, {
                credentials: "include",
            })

            if (response.ok) {
                const data = await response.json()
                const fetchedComments = data.data?.comments || data.comments || []
                setComments(fetchedComments)
                setCommentsCount(fetchedComments.length)
            }
        } catch (error) {
            console.error("Error fetching comments:", error)
        } finally {
            setIsLoadingComments(false)
        }
    }

    const fetchLikes = async () => {
        setIsLoadingLikes(true)
        try {
            const endpoint = type === "reels"
                ? `/api/reels/${item.id}/likes`
                : `/api/posts/${item.id}/likes`

            const response = await fetch(endpoint, {
                credentials: "include",
            })

            if (response.ok) {
                const data = await response.json()
                const fetchedLikes = data.data?.likes || data.likes || []
                setLikes(fetchedLikes)
            }
        } catch (error) {
            console.error("Error fetching likes:", error)
        } finally {
            setIsLoadingLikes(false)
        }
    }

    const handleLike = async () => {
        // Prevent double-clicks using ref (works immediately)
        if (isLikingRef.current) {
            console.log('[Modal] Already processing like, ignoring click')
            return
        }

        const previousLiked = isLiked
        const previousCount = likesCount
        const newLikedState = !isLiked
        const newCount = isLiked ? likesCount - 1 : likesCount + 1

        console.log('[Modal] Like clicked - current state:', { isLiked, likesCount, itemId: item.id })

        isLikingRef.current = true

        // Optimistic update
        setIsLiked(newLikedState)
        setLikesCount(newCount)

        try {
            const endpoint = type === "reels"
                ? `/api/reels/${item.id}/like`
                : `/api/posts/${item.id}/like`

            console.log('[Modal] Calling API:', endpoint)

            const response = await fetch(endpoint, {
                method: "POST",
                credentials: "include",
            })

            if (!response.ok) {
                console.error('[Modal] API error:', response.status)
                // Revert on error
                setIsLiked(previousLiked)
                setLikesCount(previousCount)
                throw new Error("Failed to update like")
            }

            const data = await response.json()
            console.log('[Modal] API response:', data)

            // Update with server response
            setIsLiked(data.liked)
            setLikesCount(data.likeCount)

            // Notify parent component about the like update
            if (onLikeUpdate) {
                console.log('[Modal] Notifying parent:', { itemId: item.id, liked: data.liked, count: data.likeCount })
                onLikeUpdate(item.id, data.liked, data.likeCount)
            } else {
                console.warn('[Modal] No onLikeUpdate callback provided')
            }
        } catch (error) {
            console.error("[Modal] Error toggling like:", error)
            toast({
                title: "Error",
                description: "Failed to update like status",
                variant: "destructive",
            })
        } finally {
            // Longer delay to prevent accidental double-clicks
            setTimeout(() => {
                isLikingRef.current = false
            }, 1000)
        }
    }

    const handleSave = async () => {
        const previousSaved = isSaved

        // Optimistic update
        setIsSaved(!isSaved)

        try {
            const endpoint = type === "reels"
                ? `/api/reels/${item.id}/save`
                : `/api/posts/${item.id}/save`

            const method = previousSaved ? "DELETE" : "POST"

            const response = await fetch(endpoint, {
                method,
                credentials: "include",
            })

            if (!response.ok) {
                // Revert on error
                setIsSaved(previousSaved)
                throw new Error("Failed to save")
            }
        } catch (error) {
            console.error("Error saving:", error)
            // Revert on error
            setIsSaved(previousSaved)
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const endpoint = type === "reels"
                ? `/api/reels/${item.id}/comments`
                : `/api/posts/${item.id}/comments`

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ content: newComment }),
            })

            if (response.ok) {
                const data = await response.json()
                const newCommentData = data.data?.comment || data.comment

                // Add comment to list
                if (newCommentData) {
                    setComments(prev => [...prev, newCommentData])
                    setCommentsCount(prev => prev + 1)
                } else {
                    // Fallback: refetch comments
                    await fetchComments()
                }

                setNewComment("")
            } else {
                throw new Error("Failed to post comment")
            }
        } catch (error) {
            console.error("Error adding comment:", error)
            toast({
                title: "Error",
                description: "Failed to post comment",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        try {
            const endpoint = type === "reels"
                ? `/api/reels/${item.id}`
                : `/api/posts/${item.id}`

            const response = await fetch(endpoint, {
                method: "DELETE",
                credentials: "include",
            })

            if (response.ok) {
                toast({
                    title: "Deleted",
                    description: `${type === "reels" ? "Reel" : "Post"} deleted successfully`,
                })
                setShowDeleteDialog(false)
                onClose()
                if (onDelete) onDelete(item.id)
            } else {
                throw new Error("Failed to delete")
            }
        } catch (error) {
            console.error("Error deleting:", error)
            toast({
                title: "Error",
                description: "Failed to delete",
                variant: "destructive",
            })
        }
    }

    const handleLikeComment = async (commentId: string) => {
        // TODO: Implement comment like functionality
        console.log("Like comment:", commentId)
    }

    const formatTimestamp = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
        } catch {
            return timestamp
        }
    }

    const handleShowLikes = () => {
        setShowLikesModal(true)
        if (likes.length === 0) {
            fetchLikes()
        }
    }

    if (!isOpen || !item) return null

    const mediaUrl = type === "reels"
        ? (item.video_url || item.video)
        : (item.image || item.media_urls?.[0] || "/placeholder-image.jpg")

    const caption = item.caption || item.content || item.description || ""
    const username = item.user?.username || item.username || "Unknown User"
    const userAvatar = item.user?.avatar || item.user?.avatar_url || item.avatar || item.avatar_url || "/placeholder-user.jpg"
    const userFullName = item.user?.full_name || item.full_name || username
    const isVerified = item.user?.is_verified || item.is_verified || false

    return (
        <>
            {/* Main Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="relative bg-white dark:bg-black rounded-lg max-w-7xl w-full max-h-[95vh] flex flex-col md:flex-row overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-10 right-0 md:top-4 md:-right-12 p-2 rounded-full text-white hover:bg-white/10 transition-colors z-10"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Media Section - Left Side */}
                    <div className="w-full md:w-[60%] lg:w-[65%] bg-black flex items-center justify-center relative">
                        {type === "reels" ? (
                            <video
                                src={mediaUrl}
                                controls
                                autoPlay
                                loop
                                className="w-full h-full max-h-[95vh] object-contain"
                            />
                        ) : (
                            <img
                                src={mediaUrl}
                                alt={caption}
                                className="w-full h-full max-h-[95vh] object-contain"
                            />
                        )}
                    </div>

                    {/* Details Section - Right Side */}
                    <div className="w-full md:w-[40%] lg:w-[35%] flex flex-col bg-white dark:bg-black border-l dark:border-gray-800">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                            <div className="flex items-center gap-3 flex-1">
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarImage src={userAvatar} />
                                    <AvatarFallback>
                                        {username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm cursor-pointer hover:opacity-70">
                                            {username}
                                        </span>
                                        {isVerified && (
                                            <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                        )}
                                    </div>
                                    {item.location && (
                                        <p className="text-xs text-muted-foreground">{item.location}</p>
                                    )}
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                                    <MoreHorizontal className="h-5 w-5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isOwner ? (
                                        <>
                                            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                                                Delete
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <DropdownMenuItem className="text-red-600">Report</DropdownMenuItem>
                                            <DropdownMenuItem>Unfollow</DropdownMenuItem>
                                            <DropdownMenuItem>Go to post</DropdownMenuItem>
                                            <DropdownMenuItem>Share to...</DropdownMenuItem>
                                            <DropdownMenuItem>Copy link</DropdownMenuItem>
                                            <DropdownMenuItem>Embed</DropdownMenuItem>
                                            <DropdownMenuItem>About this account</DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Comments Section - Scrollable */}
                        <ScrollArea className="flex-1 p-4">
                            {/* Caption as first comment */}
                            {caption && (
                                <div className="flex gap-3 mb-4 pb-4 border-b dark:border-gray-800">
                                    <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer">
                                        <AvatarImage src={userAvatar} />
                                        <AvatarFallback>
                                            {username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm">
                                            <span className="font-semibold mr-2 cursor-pointer hover:opacity-70">{username}</span>
                                            <span className="break-words">{caption}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>{formatTimestamp(item.created_at || item.timestamp || new Date().toISOString())}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Comments List */}
                            {isLoadingComments ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-sm mt-2">Loading comments...</p>
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer">
                                                <AvatarImage src={comment.user?.avatar || comment.user?.avatar_url || "/placeholder-user.jpg"} />
                                                <AvatarFallback>
                                                    {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm">
                                                    <span className="font-semibold mr-2 cursor-pointer hover:opacity-70">{comment.user?.username}</span>
                                                    <span className="break-words">{comment.content}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>{formatTimestamp(comment.created_at)}</span>
                                                    {comment.likes_count && comment.likes_count > 0 && (
                                                        <button className="hover:text-foreground font-semibold">
                                                            {comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}
                                                        </button>
                                                    )}
                                                    <button className="hover:text-foreground font-semibold">Reply</button>
                                                    {currentUserId === comment.user?.id && (
                                                        <button
                                                            className="hover:text-foreground font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                // TODO: Implement delete comment
                                                                console.log('Delete comment:', comment.id)
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleLikeComment(comment.id)}
                                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Heart
                                                    className={`h-3 w-3 ${comment.is_liked ? "fill-red-500 text-red-500" : ""}`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-semibold">No comments yet</p>
                                    <p className="text-xs mt-1">Be the first to comment</p>
                                </div>
                            )}
                        </ScrollArea>

                        {/* Actions Section */}
                        <div className="border-t dark:border-gray-800">
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between px-4 py-2">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleLike}
                                        className="hover:opacity-70 transition-opacity"
                                    >
                                        <Heart
                                            className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                                        />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const input = document.querySelector('input[placeholder="Add a comment..."]') as HTMLInputElement
                                            input?.focus()
                                        }}
                                        className="hover:opacity-70 transition-opacity"
                                    >
                                        <MessageCircle className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="hover:opacity-70 transition-opacity"
                                    >
                                        <Send className="h-6 w-6" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="hover:opacity-70 transition-opacity"
                                >
                                    <Bookmark
                                        className={`h-6 w-6 ${isSaved ? "fill-current" : ""}`}
                                    />
                                </button>
                            </div>

                            {/* Likes Count */}
                            <div className="px-4 pb-2">
                                {likesCount > 0 ? (
                                    <button
                                        onClick={handleShowLikes}
                                        className="font-semibold text-sm hover:opacity-70 transition-opacity"
                                    >
                                        {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
                                    </button>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Be the first to like this</p>
                                )}
                            </div>

                            {/* Timestamp */}
                            <div className="px-4 pb-3">
                                <p className="text-xs text-muted-foreground uppercase">
                                    {formatTimestamp(item.created_at || item.timestamp || new Date().toISOString())}
                                </p>
                            </div>

                            {/* Add Comment */}
                            <div className="flex items-center gap-2 px-4 py-3 border-t dark:border-gray-800">
                                <button className="hover:opacity-70 transition-opacity">
                                    <Smile className="h-6 w-6" />
                                </button>
                                <Input
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleAddComment()
                                        }
                                    }}
                                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                                    disabled={isSubmitting}
                                />
                                {newComment.trim() && (
                                    <Button
                                        onClick={handleAddComment}
                                        disabled={isSubmitting}
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-500 hover:text-blue-600 font-semibold px-0"
                                    >
                                        Post
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Likes Modal */}
            <Dialog open={showLikesModal} onOpenChange={setShowLikesModal}>
                <DialogContent className="sm:max-w-md p-0">
                    <div className="px-4 py-3 border-b dark:border-gray-800 text-center font-semibold">
                        Likes
                    </div>
                    <ScrollArea className="max-h-[400px]">
                        {isLoadingLikes ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            </div>
                        ) : likes.length > 0 ? (
                            <div>
                                {likes.map((like) => (
                                    <div
                                        key={like.id || like.user.id}
                                        className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-11 w-11">
                                                <AvatarImage src={like.user?.avatar || like.user?.avatar_url || "/placeholder-user.jpg"} />
                                                <AvatarFallback>
                                                    {like.user?.username?.charAt(0).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <p className="font-semibold text-sm">{like.user?.username}</p>
                                                    {like.user?.is_verified && (
                                                        <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {like.user?.full_name && (
                                                    <p className="text-sm text-muted-foreground">{like.user.full_name}</p>
                                                )}
                                            </div>
                                        </div>
                                        {like.user.id !== currentUserId && (
                                            <Button size="sm" variant="secondary">
                                                Follow
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">No likes yet</p>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-sm p-0">
                    <div className="text-center py-6">
                        <p className="font-semibold mb-2">Delete {type === "reels" ? "reel" : "post"}?</p>
                        <p className="text-sm text-muted-foreground px-6">
                            Are you sure you want to delete this {type === "reels" ? "reel" : "post"}? This action cannot be undone.
                        </p>
                    </div>
                    <div className="border-t dark:border-gray-800">
                        <button
                            onClick={handleDelete}
                            className="w-full py-3 text-red-600 font-semibold hover:bg-muted/50 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                    <div className="border-t dark:border-gray-800">
                        <button
                            onClick={() => setShowDeleteDialog(false)}
                            className="w-full py-3 hover:bg-muted/50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                contentType="post"
                contentId={item.id}
                previewData={{
                    media_url: mediaUrl,
                    caption: caption,
                    username: username,
                    avatar: userAvatar
                }}
            />
        </>
    )
}
