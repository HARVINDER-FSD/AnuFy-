"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ArrowLeft, Phone, Video, Info, Mic, Image as ImageIcon, Smile, Plus, X, Reply, Copy, Trash2, Heart, MoreVertical } from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { useTheme } from 'next-themes'

interface InstagramStyleChatProps {
    conversationId: string
    recipient: {
        id: string
        username: string
        full_name?: string
        avatar: string
    }
    onClose?: () => void
}

export function InstagramStyleChat({ conversationId, recipient, onClose }: InstagramStyleChatProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [replyingTo, setReplyingTo] = useState<any>(null)
    const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
    const [storyStatus, setStoryStatus] = useState<{ hasStories: boolean; allViewed: boolean } | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
    const [selectedMessage, setSelectedMessage] = useState<any>(null)
    const [showMessageMenu, setShowMessageMenu] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [viewingMedia, setViewingMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
    const [lastClickTime, setLastClickTime] = useState<{ messageId: string; time: number } | null>(null)
    const [showUserInfo, setShowUserInfo] = useState(false)
    const [showThemeSelector, setShowThemeSelector] = useState(false)
    const [chatTheme, setChatTheme] = useState<string>(() => {
        // Load saved theme from localStorage
        return localStorage.getItem(`chat-theme-${conversationId}`) || 'default'
    })
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()
    const { theme, systemTheme } = useTheme()

    const quickReactions = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥']

    // Determine current theme for emoji picker
    const currentTheme = theme === 'system' ? systemTheme : theme
    const emojiTheme = currentTheme === 'dark' ? Theme.DARK : Theme.LIGHT

    // Get theme colors and emoji for message bubbles
    const getThemeColors = (themeName: string) => {
        const themes: Record<string, { own: string; other: string; emoji?: string; emojiSize?: string }> = {
            default: { own: 'bg-primary text-primary-foreground', other: 'bg-muted text-foreground border border-border' },
            sunset: { own: 'bg-gradient-to-br from-orange-500 to-pink-600 text-white', other: 'bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 text-foreground' },
            ocean: { own: 'bg-gradient-to-br from-blue-500 to-teal-600 text-white', other: 'bg-gradient-to-br from-blue-100 to-teal-100 dark:from-blue-900/30 dark:to-teal-900/30 text-foreground' },
            lavender: { own: 'bg-gradient-to-br from-purple-500 to-rose-600 text-white', other: 'bg-gradient-to-br from-purple-100 to-rose-100 dark:from-purple-900/30 dark:to-rose-900/30 text-foreground' },
            forest: { own: 'bg-gradient-to-br from-green-500 to-teal-600 text-white', other: 'bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 text-foreground' },
            fire: { own: 'bg-gradient-to-br from-red-500 to-yellow-500 text-white', other: 'bg-gradient-to-br from-red-100 to-yellow-100 dark:from-red-900/30 dark:to-yellow-900/30 text-foreground' },
            midnight: { own: 'bg-gradient-to-br from-indigo-600 to-pink-600 text-white', other: 'bg-gradient-to-br from-indigo-100 to-pink-100 dark:from-indigo-900/30 dark:to-pink-900/30 text-foreground' },
            candy: { own: 'bg-gradient-to-br from-pink-500 to-indigo-600 text-white', other: 'bg-gradient-to-br from-pink-100 to-indigo-100 dark:from-pink-900/30 dark:to-indigo-900/30 text-foreground' },
            tropical: { own: 'bg-gradient-to-br from-yellow-500 to-cyan-600 text-white', other: 'bg-gradient-to-br from-yellow-100 to-cyan-100 dark:from-yellow-900/30 dark:to-cyan-900/30 text-foreground' },
            aurora: { own: 'bg-gradient-to-br from-green-400 to-purple-600 text-white', other: 'bg-gradient-to-br from-green-100 to-purple-100 dark:from-green-900/30 dark:to-purple-900/30 text-foreground' },
            cherry: { own: 'bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white', other: 'bg-gradient-to-br from-rose-100 to-fuchsia-100 dark:from-rose-900/30 dark:to-fuchsia-900/30 text-foreground' },
            mint: { own: 'bg-gradient-to-br from-emerald-400 to-cyan-600 text-white', other: 'bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 text-foreground' },
            peach: { own: 'bg-gradient-to-br from-orange-400 to-yellow-500 text-white', other: 'bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 text-foreground' },
            galaxy: { own: 'bg-gradient-to-br from-violet-600 to-indigo-800 text-white', other: 'bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 text-foreground' },
            rose: { own: 'bg-gradient-to-br from-pink-400 to-red-600 text-white', other: 'bg-gradient-to-br from-pink-100 to-red-100 dark:from-pink-900/30 dark:to-red-900/30 text-foreground' },
            sky: { own: 'bg-gradient-to-br from-sky-400 to-indigo-600 text-white', other: 'bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30 text-foreground' },
            // Character/Emoji Themes
            love: { own: 'bg-gradient-to-br from-pink-500 to-red-500 text-white', other: 'bg-gradient-to-br from-pink-100 to-red-100 dark:from-pink-900/30 dark:to-red-900/30 text-foreground', emoji: '❤️', emojiSize: 'text-6xl' },
            celebration: { own: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white', other: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-foreground', emoji: '🎉', emojiSize: 'text-6xl' },
            birthday: { own: 'bg-gradient-to-br from-pink-400 to-purple-500 text-white', other: 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-foreground', emoji: '🎂', emojiSize: 'text-6xl' },
            summer: { own: 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white', other: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-foreground', emoji: '☀️', emojiSize: 'text-6xl' },
            space: { own: 'bg-gradient-to-br from-indigo-700 to-purple-900 text-white', other: 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-foreground', emoji: '🚀', emojiSize: 'text-6xl' },
            unicorn: { own: 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 text-white', other: 'bg-gradient-to-br from-pink-100 to-blue-100 dark:from-pink-900/30 dark:to-blue-900/30 text-foreground', emoji: '🦄', emojiSize: 'text-6xl' },
            pizza: { own: 'bg-gradient-to-br from-orange-500 to-red-500 text-white', other: 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-foreground', emoji: '🍕', emojiSize: 'text-6xl' },
            music: { own: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white', other: 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-foreground', emoji: '🎵', emojiSize: 'text-6xl' },
            gaming: { own: 'bg-gradient-to-br from-green-500 to-blue-600 text-white', other: 'bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 text-foreground', emoji: '🎮', emojiSize: 'text-6xl' },
            coffee: { own: 'bg-gradient-to-br from-amber-700 to-orange-800 text-white', other: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-foreground', emoji: '☕', emojiSize: 'text-6xl' }
        }
        return themes[themeName] || themes.default
    }
    const themeColors = getThemeColors(chatTheme)

    useEffect(() => {
        fetchMessages()
        fetchStoryStatus()
    }, [conversationId])

    const fetchStoryStatus = async () => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('token=') || row.startsWith('client-token='))
                ?.split('=')[1]

            const response = await fetch(`/api/stories/user/${recipient.id}/status`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            })

            if (response.ok) {
                const data = await response.json()
                setStoryStatus(data)
            }
        } catch (error) {
            console.error('Error fetching story status:', error)
        }
    }

    const handleAvatarClick = () => {
        if (storyStatus?.hasStories) {
            window.location.href = `/stories?userId=${recipient.id}`
        }
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchMessages = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                console.log('[InstagramChat] Fetched messages:', data.messages)
                // Log shared content details
                data.messages?.forEach((msg: any) => {
                    if (msg.shared_content) {
                        console.log('[InstagramChat] Shared content:', msg.shared_content)
                    }
                })
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSend = async () => {
        if (!newMessage.trim()) return

        // Create optimistic message
        const optimisticMessage = {
            _id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: user?.id,
            content: newMessage,
            message_type: 'text',
            reply_to: replyingTo,
            created_at: new Date().toISOString(),
            reactions: [],
            is_sending: true // Flag to show sending state
        }

        // Store message content and clear input immediately
        const messageContent = newMessage
        const replyToMessage = replyingTo

        // Add message to UI instantly
        setMessages(prev => [...prev, optimisticMessage])
        setNewMessage('')
        setReplyingTo(null)

        try {
            const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    conversation_id: conversationId,
                    content: messageContent,
                    message_type: 'text',
                    reply_to: replyToMessage?._id
                })
            })

            console.log('Send message response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('Message sent successfully:', data)

                // Replace optimistic message with real one
                setMessages(prev => {
                    const updated = prev.map(msg =>
                        msg._id === optimisticMessage._id ? data.message : msg
                    )
                    console.log('Updated messages after send:', updated)
                    return updated
                })
            } else {
                const errorData = await response.text()
                console.error('Failed to send message:', response.status, errorData)

                // Keep the optimistic message visible but mark it as failed
                setMessages(prev => prev.map(msg =>
                    msg._id === optimisticMessage._id
                        ? { ...msg, is_sending: false, send_failed: true }
                        : msg
                ))

                // Show error after a delay
                setTimeout(() => {
                    setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id))
                    setNewMessage(messageContent)
                    setReplyingTo(replyToMessage)
                }, 2000)
            }
        } catch (error) {
            console.error('Error sending message:', error)

            // Keep the optimistic message visible but mark it as failed
            setMessages(prev => prev.map(msg =>
                msg._id === optimisticMessage._id
                    ? { ...msg, is_sending: false, send_failed: true }
                    : msg
            ))

            // Show error after a delay
            setTimeout(() => {
                setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id))
                setNewMessage(messageContent)
                setReplyingTo(replyToMessage)
            }, 2000)
        }
    }

    const handleReaction = async (messageId: string, emoji: string) => {
        // INSTANT UI UPDATE - No waiting!
        setMessages(prev => prev.map(msg => {
            if (msg._id === messageId) {
                const reactions = msg.reactions || []
                const existingIndex = reactions.findIndex((r: any) =>
                    r.user_id === user?.id && r.emoji === emoji
                )

                let newReactions
                if (existingIndex !== -1) {
                    // Remove reaction instantly
                    newReactions = reactions.filter((_: any, i: number) => i !== existingIndex)
                    console.log('❤️ Removed instantly!')
                } else {
                    // Add reaction instantly
                    newReactions = [...reactions, {
                        user_id: user?.id,
                        emoji,
                        created_at: new Date()
                    }]
                    console.log('❤️ Added instantly!')
                }

                return {
                    ...msg,
                    reactions: newReactions
                }
            }
            return msg
        }))

        // Background API call - save to server but don't refresh UI
        fetch(`/api/messages/conversations/${conversationId}/messages/${messageId}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ emoji })
        }).then(response => {
            if (response.ok) {
                console.log('✅ Saved to server')
            } else {
                console.error('❌ Failed to save, reverting...')
                // Only fetch if it failed
                fetchMessages()
            }
        }).catch(error => {
            console.error('❌ Error:', error)
            // Only fetch if it failed
            fetchMessages()
        })

        setShowReactionPicker(null)
    }

    const handleReply = (message: any) => {
        setReplyingTo(message)
        setShowMessageMenu(false)
        inputRef.current?.focus()
    }

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
        setShowMessageMenu(false)
    }

    const handleDelete = async (messageId: string) => {
        // Store the message before deleting (for potential restore)
        const messageToDelete = messages.find(m => m._id === messageId)

        // Remove message from UI instantly
        setMessages(prev => prev.filter(m => m._id !== messageId))
        setShowMessageMenu(false)

        try {
            const response = await fetch(`/api/messages/conversations/${conversationId}/messages/${messageId}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (!response.ok) {
                // Restore message if deletion failed
                if (messageToDelete) {
                    setMessages(prev => [...prev, messageToDelete].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    ))
                }
                alert('Failed to delete message')
            }
        } catch (error) {
            console.error('Error deleting message:', error)
            // Restore message on error
            if (messageToDelete) {
                setMessages(prev => [...prev, messageToDelete].sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ))
            }
            alert('Failed to delete message')
        }
    }

    const handleEmojiSelect = (emojiData: any) => {
        setNewMessage(prev => prev + emojiData.emoji)
        setShowEmojiPicker(false)
        inputRef.current?.focus()
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('File size must be less than 50MB')
            return
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image or video file')
            return
        }

        setSelectedFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setFilePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSendMedia = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        try {
            // Create FormData
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('conversation_id', conversationId)
            formData.append('message_type', selectedFile.type.startsWith('image/') ? 'image' : 'video')
            if (newMessage.trim()) {
                formData.append('content', newMessage.trim())
            }
            if (replyingTo) {
                formData.append('reply_to', replyingTo._id)
            }

            // Upload file
            const response = await fetch(`/api/messages/conversations/${conversationId}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                setMessages(prev => [...prev, data.message])
                setNewMessage('')
                setReplyingTo(null)
                setSelectedFile(null)
                setFilePreview(null)
            } else {
                alert('Failed to send media')
            }
        } catch (error) {
            console.error('Error uploading media:', error)
            alert('Failed to send media')
        } finally {
            setIsUploading(false)
        }
    }

    const cancelMediaUpload = () => {
        setSelectedFile(null)
        setFilePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleVoiceRecord = () => {
        setIsRecording(!isRecording)
    }

    const handleDownloadMedia = async (url: string, filename: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error('Error downloading media:', error)
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>
    }

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Header - Instagram Style - Mobile Optimized - Clean White */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/20 sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}
                    <div
                        className="relative cursor-pointer flex-shrink-0"
                        onClick={handleAvatarClick}
                    >
                        <div className={`rounded-full p-[2px] ${storyStatus?.hasStories
                            ? storyStatus.allViewed
                                ? 'bg-gradient-to-tr from-gray-400 to-gray-300'
                                : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                            : ''
                            }`}>
                            <img
                                src={recipient.avatar}
                                alt=""
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-background"
                            />
                        </div>
                    </div>
                    <div
                        className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowUserInfo(true)}
                    >
                        <p className="font-semibold text-sm truncate">{recipient.full_name || recipient.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{recipient.username}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <button className="p-1.5 sm:p-1 hover:bg-muted rounded-full transition-colors" aria-label="Voice call">
                        <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button className="p-1.5 sm:p-1 hover:bg-muted rounded-full transition-colors" aria-label="Video call">
                        <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button className="p-1.5 sm:p-1 hover:bg-muted rounded-full transition-colors" aria-label="Info">
                        <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>

            {/* Messages Area - Clean with Visible Watermark and Theme */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 overscroll-contain relative">
                {/* Theme Background with Emoji Pattern */}
                {chatTheme !== 'default' && themeColors.emoji && (
                    <div className="fixed inset-0 z-[1] pointer-events-none select-none overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 gap-12 p-8 opacity-[0.08] dark:opacity-[0.12]">
                            {Array.from({ length: 64 }).map((_, i) => (
                                <div key={i} className="text-5xl sm:text-6xl transform rotate-12">
                                    {themeColors.emoji}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Theme Background Gradient */}
                {chatTheme !== 'default' && (
                    <div className="fixed inset-0 z-0 opacity-20 dark:opacity-10">
                        {(chatTheme === 'sunset' || chatTheme === 'ocean' || chatTheme === 'lavender' ||
                            chatTheme === 'forest' || chatTheme === 'fire' || chatTheme === 'midnight' ||
                            chatTheme === 'candy' || chatTheme === 'tropical' || chatTheme === 'aurora' ||
                            chatTheme === 'cherry' || chatTheme === 'mint' || chatTheme === 'peach' ||
                            chatTheme === 'galaxy' || chatTheme === 'rose' || chatTheme === 'sky' ||
                            chatTheme === 'love' || chatTheme === 'celebration' || chatTheme === 'birthday' ||
                            chatTheme === 'summer' || chatTheme === 'space' || chatTheme === 'unicorn' ||
                            chatTheme === 'pizza' || chatTheme === 'music' || chatTheme === 'gaming' || chatTheme === 'coffee') && (
                                <div className={`absolute inset-0 ${themeColors.own.replace('text-white', '')}`}></div>
                            )}
                    </div>
                )}

                {/* Visible Watermark - App Logo Style - Only for Default Theme */}
                {chatTheme === 'default' && (
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-[2]">
                        <div className="text-center transform -rotate-12">
                            <div className="relative px-8">
                                {/* Main watermark in app primary color (teal/cyan) */}
                                <div className="text-[8rem] sm:text-[10rem] font-black mb-4 text-[#2dd4bf] dark:text-[#14b8a6] opacity-10 dark:opacity-15 whitespace-nowrap">
                                    Anufy
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-semibold text-[#2dd4bf] dark:text-[#14b8a6] opacity-8 dark:opacity-12 whitespace-nowrap">
                                Connect with the World
                            </div>
                        </div>
                    </div>
                )}
                <div className="relative z-10">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-4 min-h-[60vh]">
                            <img src={recipient.avatar} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-3 sm:mb-4" />
                            <p className="font-semibold text-base sm:text-lg">{recipient.full_name || recipient.username}</p>
                            <p className="text-muted-foreground text-sm">{recipient.username}</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            if (!message) return null

                            const isOwn = message.sender_id === user?.id
                            const prevMessage = messages[index - 1]
                            const showAvatar = !isOwn && (index === 0 || !prevMessage || prevMessage.sender_id !== message.sender_id)
                            const showTimestamp = index === 0 || !prevMessage ||
                                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 3600000

                            return (
                                <div key={message._id}>
                                    {/* Timestamp */}
                                    {showTimestamp && (
                                        <div className="flex justify-center my-4">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(message.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={`flex items-end gap-1.5 sm:gap-2 mb-2 relative group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                        onMouseEnter={() => setHoveredMessage(message._id)}
                                        onMouseLeave={() => setHoveredMessage(null)}
                                        onClick={(e) => {
                                            // Manual double-click detection
                                            const now = Date.now()
                                            if (lastClickTime && lastClickTime.messageId === message._id && now - lastClickTime.time < 300) {
                                                // Double-click detected!
                                                e.stopPropagation()
                                                e.preventDefault()
                                                console.log('Double-click detected on message:', message._id)
                                                handleReaction(message._id, '❤️')
                                                setLastClickTime(null)
                                                // Clear any pending single-click timers
                                                if (e.currentTarget) {
                                                    (e.currentTarget as any)._doubleClicked = true
                                                    setTimeout(() => {
                                                        if (e.currentTarget) {
                                                            (e.currentTarget as any)._doubleClicked = false
                                                        }
                                                    }, 300)
                                                }
                                            } else {
                                                // First click
                                                setLastClickTime({ messageId: message._id, time: now })
                                            }
                                        }}
                                        onTouchStart={(e) => {
                                            // Long-press detection for mobile (500ms)
                                            const target = e.currentTarget;
                                            (target as any)._longPressTriggered = false;
                                            (target as any)._longPressTimer = setTimeout(() => {
                                                (target as any)._longPressTriggered = true
                                                setSelectedMessage(message)
                                                setShowMessageMenu(true)
                                                // Haptic feedback if available (silently fail if blocked)
                                                try {
                                                    if (navigator.vibrate) {
                                                        navigator.vibrate(50)
                                                    }
                                                } catch (e) {
                                                    // Vibration blocked by browser, ignore
                                                }
                                            }, 500) // 500ms hold time
                                        }}
                                        onTouchEnd={(e) => {
                                            // Only clear timer if menu hasn't opened yet
                                            const target = e.currentTarget;
                                            if ((target as any)._longPressTimer && !(target as any)._longPressTriggered) {
                                                clearTimeout((target as any)._longPressTimer)
                                            }
                                        }}
                                        onTouchMove={(e) => {
                                            // Cancel long-press if user moves finger (only if not triggered yet)
                                            const target = e.currentTarget;
                                            if ((target as any)._longPressTimer && !(target as any)._longPressTriggered) {
                                                clearTimeout((target as any)._longPressTimer)
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault()
                                            setSelectedMessage(message)
                                            setShowMessageMenu(true)
                                        }}
                                    >
                                        {!isOwn && (
                                            <img
                                                src={recipient.avatar}
                                                alt=""
                                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}
                                            />
                                        )}

                                        {/* Quick Actions on Hover */}
                                        {hoveredMessage === message._id && (
                                            <div className={`absolute ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} top-0 z-10 hidden sm:flex items-center gap-1 bg-background border border-border rounded-full px-2 py-1 shadow-lg`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleReaction(message._id, '❤️')
                                                    }}
                                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                                    title="Like"
                                                >
                                                    <Heart className="w-4 h-4 text-red-500" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setShowReactionPicker(message._id)
                                                    }}
                                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleReply(message)
                                                    }}
                                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <Reply className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedMessage(message)
                                                        setShowMessageMenu(true)
                                                    }}
                                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Reaction Picker */}
                                        {showReactionPicker === message._id && (
                                            <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} -top-16 z-20 bg-background border border-border rounded-full px-3 py-2 shadow-xl flex gap-1`}>
                                                {quickReactions.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(message._id, emoji)}
                                                        className="text-xl hover:scale-125 transition-transform"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setShowReactionPicker(null)}
                                                    className="p-1 hover:bg-muted rounded-full"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        <div className={`max-w-[75%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                            {/* Reply Preview */}
                                            {message.reply_to && (
                                                <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs ${isOwn ? themeColors.own + ' opacity-30' : themeColors.other + ' opacity-70'
                                                    } border-l-2 max-w-full`}>
                                                    <p className="font-semibold opacity-70 truncate">
                                                        {message.reply_to.sender_id === user?.id ? 'You' : recipient.username}
                                                    </p>
                                                    <p className="opacity-60 truncate">{message.reply_to.content}</p>
                                                </div>
                                            )}
                                            {/* Shared Content */}
                                            {(message.message_type === 'shared_post' || message.message_type === 'shared_story') && message.shared_content ? (
                                                <div
                                                    onClick={(e) => {
                                                        // Don't navigate if parent detected double-click
                                                        const parent = e.currentTarget.closest('.group')
                                                        if ((parent as any)?._doubleClicked) {
                                                            e.stopPropagation()
                                                            return
                                                        }

                                                        // Single click - navigate after delay
                                                        const timer = setTimeout(() => {
                                                            window.location.href = message.shared_content.content_type === 'post' ? '/reels' : `/stories?storyId=${message.shared_content.content_id}`
                                                        }, 300)
                                                            ; (e.currentTarget as any)._clickTimer = timer
                                                    }}
                                                    className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer w-full max-w-[200px] sm:max-w-[240px] mb-1 bg-muted active:scale-95 transition-transform"
                                                >
                                                    {message.shared_content.preview_data?.media_url ? (
                                                        <div className="relative aspect-[9/16]">
                                                            {message.shared_content.preview_data.media_type === 'video' ? (
                                                                <video
                                                                    src={message.shared_content.preview_data.media_url}
                                                                    className="w-full h-full object-cover"
                                                                    muted
                                                                    playsInline
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={message.shared_content.preview_data.media_url}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}

                                                            {/* User info overlay */}
                                                            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                                                                <img
                                                                    src={message.shared_content.preview_data.avatar || recipient.avatar}
                                                                    alt=""
                                                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                                                                />
                                                                <span className="text-white text-[10px] sm:text-xs font-semibold">
                                                                    {message.shared_content.preview_data.username || recipient.username}
                                                                </span>
                                                            </div>

                                                            {/* Play icon for videos */}
                                                            {message.shared_content.preview_data.media_type === 'video' && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="bg-white/90 dark:bg-black/60 rounded-full p-2 sm:p-3">
                                                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                                                                            <path d="M8 5v14l11-7z" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Caption overlay if exists */}
                                                            {message.shared_content.preview_data.caption && (
                                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
                                                                    <p className="text-white text-[10px] sm:text-xs line-clamp-2">
                                                                        {message.shared_content.preview_data.caption}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-[9/16] flex items-center justify-center bg-muted">
                                                            <div className="text-center p-4">
                                                                <svg className="w-12 h-12 mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {message.shared_content.content_type === 'post' ? 'Shared Reel' : 'Shared Story'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            ) : message.message_type === 'image' || message.message_type === 'video' ? (
                                                <div className="max-w-[280px] sm:max-w-[320px]">
                                                    {message.message_type === 'image' ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={message.media_url}
                                                                alt="Shared image"
                                                                className="rounded-2xl w-full cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={(e) => {
                                                                    // Don't open if parent detected double-click
                                                                    const parent = e.currentTarget.closest('.group')
                                                                    if ((parent as any)?._doubleClicked) {
                                                                        e.stopPropagation()
                                                                        return
                                                                    }

                                                                    // Single click - open viewer after delay
                                                                    const timer = setTimeout(() => {
                                                                        setViewingMedia({ url: message.media_url, type: 'image' })
                                                                    }, 300)
                                                                        ; (e.target as any)._clickTimer = timer
                                                                }}
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDownloadMedia(message.media_url, `image-${message._id}.jpg`)
                                                                }}
                                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                title="Download"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative group">
                                                            <video
                                                                src={message.media_url}
                                                                controls
                                                                className="rounded-2xl w-full"
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDownloadMedia(message.media_url, `video-${message._id}.mp4`)
                                                                }}
                                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                title="Download"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {message.content && (
                                                        <div className={`mt-1 px-3 py-1.5 rounded-2xl ${isOwn
                                                            ? themeColors.own
                                                            : themeColors.other
                                                            }`}>
                                                            <p className="text-sm break-words">{message.content}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`px-3 sm:px-4 py-2 rounded-3xl ${isOwn
                                                    ? themeColors.own
                                                    : themeColors.other
                                                    }`}>
                                                    <p className="text-sm break-words">{message.content}</p>
                                                </div>
                                            )}

                                            {/* Reactions */}
                                            {message.reactions && message.reactions.length > 0 && (
                                                <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    {message.reactions.map((reaction: any, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleReaction(message._id, reaction.emoji)}
                                                            className="bg-background border border-border rounded-full px-2 py-0.5 text-xs shadow-sm hover:scale-110 transition-transform flex items-center gap-1"
                                                        >
                                                            <span>{reaction.emoji}</span>
                                                            {reaction.user_id === user?.id && (
                                                                <span className="text-[10px] font-medium text-primary">You</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area - Instagram Style - Mobile Optimized - Clean White */}
            <div className="border-t border-border/20 sticky bottom-0 safe-area-inset-bottom bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                {/* Reply Bar */}
                {replyingTo && (
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-muted/50 border-b border-border">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-primary">
                                Replying to {replyingTo.sender_id === user?.id ? 'yourself' : recipient.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
                    <button
                        className="p-1.5 sm:p-2 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex-shrink-0 active:scale-95 transition-transform"
                        aria-label="Camera"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </button>

                    <div className="flex-1 flex items-center gap-1.5 sm:gap-2 bg-muted rounded-full px-3 sm:px-4 py-2 min-w-0 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
                        />
                        {!newMessage.trim() && (
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <button
                                    onClick={handleVoiceRecord}
                                    className={`p-1 active:scale-95 transition-transform ${isRecording ? 'text-red-500' : ''}`}
                                    aria-label="Voice message"
                                >
                                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1 active:scale-95 transition-transform"
                                    aria-label="Send image"
                                >
                                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-1 active:scale-95 transition-transform"
                                    aria-label="Send emoji"
                                >
                                    <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                </button>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    {newMessage.trim() ? (
                        <button
                            onClick={handleSend}
                            className="font-semibold text-primary text-sm px-2 active:scale-95 transition-transform flex-shrink-0"
                            aria-label="Send message"
                        >
                            Send
                        </button>
                    ) : (
                        <button className="p-1 active:scale-95 transition-transform flex-shrink-0" aria-label="More options">
                            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="fixed inset-0 sm:absolute sm:inset-auto sm:bottom-full sm:left-0 sm:right-0 sm:mb-2 flex items-end sm:items-center justify-center z-50 bg-black/50 sm:bg-transparent">
                        <div className="bg-background border border-border rounded-t-2xl sm:rounded-lg shadow-2xl w-full sm:w-auto max-w-full sm:max-w-md">
                            <div className="flex justify-between items-center p-3 sm:p-2 border-b border-border">
                                <span className="text-sm font-semibold">Emojis</span>
                                <button
                                    onClick={() => setShowEmojiPicker(false)}
                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                            <div className="overflow-hidden">
                                <EmojiPicker
                                    onEmojiClick={handleEmojiSelect}
                                    theme={emojiTheme}
                                    width="100%"
                                    height={400}
                                    searchPlaceHolder="Search emoji..."
                                    previewConfig={{
                                        showPreview: false
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Media Viewer Modal */}
            {viewingMedia && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingMedia(null)}
                >
                    <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-semibold">View Media</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownloadMedia(
                                        viewingMedia.url,
                                        `${viewingMedia.type}-${Date.now()}.${viewingMedia.type === 'image' ? 'jpg' : 'mp4'}`
                                    )}
                                    className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                                    title="Download"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewingMedia(null)}
                                    className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-black rounded-lg overflow-hidden">
                            {viewingMedia.type === 'image' ? (
                                <img
                                    src={viewingMedia.url}
                                    alt="Full size"
                                    className="w-full max-h-[80vh] object-contain"
                                />
                            ) : (
                                <video
                                    src={viewingMedia.url}
                                    controls
                                    autoPlay
                                    className="w-full max-h-[80vh]"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Media Preview Modal */}
            {filePreview && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-semibold">Send Media</h3>
                            <button
                                onClick={cancelMediaUpload}
                                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-background rounded-lg overflow-hidden mb-4">
                            {selectedFile?.type.startsWith('image/') ? (
                                <img
                                    src={filePreview}
                                    alt="Preview"
                                    className="w-full max-h-[60vh] object-contain"
                                />
                            ) : (
                                <video
                                    src={filePreview}
                                    controls
                                    className="w-full max-h-[60vh]"
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Add a caption..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none"
                            />
                            <button
                                onClick={handleSendMedia}
                                disabled={isUploading}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold disabled:opacity-50"
                            >
                                {isUploading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Menu Modal */}
            {showMessageMenu && selectedMessage && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                    onClick={(e) => {
                        // Only close on direct backdrop click, not on touch events
                        if (e.target === e.currentTarget) {
                            setShowMessageMenu(false)
                        }
                    }}
                    onTouchEnd={(e) => {
                        // Prevent touch end from closing modal
                        if (e.target === e.currentTarget) {
                            setShowMessageMenu(false)
                        }
                    }}
                >
                    <div
                        className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-4 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Message Options</h3>
                            <button
                                onClick={() => setShowMessageMenu(false)}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={() => handleReply(selectedMessage)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                        >
                            <Reply className="w-5 h-5" />
                            <span>Reply</span>
                        </button>

                        <button
                            onClick={() => {
                                setShowReactionPicker(selectedMessage._id)
                                setShowMessageMenu(false)
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                        >
                            <Heart className="w-5 h-5" />
                            <span>React</span>
                        </button>

                        <button
                            onClick={() => handleCopy(selectedMessage.content)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                        >
                            <Copy className="w-5 h-5" />
                            <span>Copy</span>
                        </button>

                        {selectedMessage.sender_id === user?.id && (
                            <button
                                onClick={() => handleDelete(selectedMessage._id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-destructive/10 text-destructive rounded-lg transition-colors text-left"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>Unsend</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* User Info Modal */}
            {showUserInfo && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowUserInfo(false)
                        }
                    }}
                >
                    <div
                        className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="font-semibold">Details</h3>
                            <button
                                onClick={() => setShowUserInfo(false)}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Profile Section */}
                        <div className="p-6 text-center border-b border-border">
                            <div className="relative inline-block mb-4">
                                <div className={`rounded-full p-[3px] ${storyStatus?.hasStories
                                    ? storyStatus.allViewed
                                        ? 'bg-gradient-to-tr from-gray-400 to-gray-300'
                                        : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                                    : ''
                                    }`}>
                                    <img
                                        src={recipient.avatar}
                                        alt=""
                                        className="w-24 h-24 rounded-full border-4 border-background"
                                    />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold mb-1">{recipient.full_name || recipient.username}</h2>
                            <p className="text-muted-foreground mb-4">@{recipient.username}</p>

                            {/* Action Buttons */}
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => {
                                        window.location.href = `/profile/${recipient.username}`
                                        setShowUserInfo(false)
                                    }}
                                    className="flex-1 max-w-[150px] bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="p-2">
                            <button
                                onClick={() => {
                                    if (storyStatus?.hasStories) {
                                        window.location.href = `/stories?userId=${recipient.id}`
                                    }
                                    setShowUserInfo(false)
                                }}
                                disabled={!storyStatus?.hasStories}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">View Story</p>
                                    <p className="text-xs text-muted-foreground">
                                        {storyStatus?.hasStories ? 'See their latest story' : 'No stories available'}
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setShowUserInfo(false)
                                    setShowThemeSelector(true)
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">Theme</p>
                                    <p className="text-xs text-muted-foreground">Change chat background</p>
                                </div>
                            </button>

                            <button
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">Mute</p>
                                    <p className="text-xs text-muted-foreground">Mute notifications</p>
                                </div>
                            </button>

                            <button
                                className="w-full flex items-center gap-3 p-3 hover:bg-destructive/10 text-destructive rounded-lg transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">Block</p>
                                    <p className="text-xs text-muted-foreground">Block this user</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Selector Modal */}
            {showThemeSelector && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowThemeSelector(false)
                        }
                    }}
                >
                    <div
                        className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
                            <h3 className="font-semibold">Chat Theme</h3>
                            <button
                                onClick={() => setShowThemeSelector(false)}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {/* Default Theme */}
                            <button
                                onClick={() => {
                                    setChatTheme('default')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'default')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'default' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-background border border-border"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Default</p>
                                        <p className="text-xs text-muted-foreground">Clean and simple</p>
                                    </div>
                                </div>
                            </button>

                            {/* Gradient Themes */}
                            <button
                                onClick={() => {
                                    setChatTheme('sunset')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'sunset')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'sunset' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Sunset</p>
                                        <p className="text-xs text-muted-foreground">Warm orange to purple</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('ocean')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'ocean')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'ocean' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Ocean</p>
                                        <p className="text-xs text-muted-foreground">Cool blue to teal</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('lavender')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'lavender')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'lavender' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 via-pink-400 to-rose-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Lavender</p>
                                        <p className="text-xs text-muted-foreground">Soft purple to rose</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('forest')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'forest')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'forest' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Forest</p>
                                        <p className="text-xs text-muted-foreground">Fresh green to teal</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('fire')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'fire')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'fire' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Fire</p>
                                        <p className="text-xs text-muted-foreground">Hot red to yellow</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('midnight')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'midnight')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'midnight' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Midnight</p>
                                        <p className="text-xs text-muted-foreground">Deep indigo to pink</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('candy')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'candy')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'candy' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Candy</p>
                                        <p className="text-xs text-muted-foreground">Sweet pink to indigo</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('tropical')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'tropical')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'tropical' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 via-green-400 to-cyan-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Tropical</p>
                                        <p className="text-xs text-muted-foreground">Vibrant yellow to cyan</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('aurora')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'aurora')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'aurora' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-300 via-blue-400 to-purple-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Aurora</p>
                                        <p className="text-xs text-muted-foreground">Northern lights</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('cherry')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'cherry')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'cherry' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Cherry</p>
                                        <p className="text-xs text-muted-foreground">Bold rose to fuchsia</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('mint')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'mint')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'mint' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-300 via-teal-400 to-cyan-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Mint</p>
                                        <p className="text-xs text-muted-foreground">Fresh emerald to cyan</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('peach')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'peach')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'peach' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-300 via-amber-400 to-yellow-400"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Peach</p>
                                        <p className="text-xs text-muted-foreground">Soft orange to yellow</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('galaxy')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'galaxy')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'galaxy' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Galaxy</p>
                                        <p className="text-xs text-muted-foreground">Deep space vibes</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('rose')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'rose')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'rose' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-300 via-rose-400 to-red-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Rose</p>
                                        <p className="text-xs text-muted-foreground">Romantic pink to red</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setChatTheme('sky')
                                    localStorage.setItem(`chat-theme-${conversationId}`, 'sky')
                                    setShowThemeSelector(false)
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'sky' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500"></div>
                                    <div className="text-left">
                                        <p className="font-semibold">Sky</p>
                                        <p className="text-xs text-muted-foreground">Clear sky blue</p>
                                    </div>
                                </div>
                            </button>

                            {/* Character/Emoji Themes Section */}
                            <div className="pt-4 border-t border-border">
                                <p className="text-sm font-semibold text-muted-foreground mb-3 px-1">Character Themes</p>
                            </div>

                            <button onClick={() => { setChatTheme('love'); localStorage.setItem(`chat-theme-${conversationId}`, 'love'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'love' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-2xl">❤️</div>
                                    <div className="text-left"><p className="font-semibold">Love</p><p className="text-xs text-muted-foreground">Hearts everywhere</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('celebration'); localStorage.setItem(`chat-theme-${conversationId}`, 'celebration'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'celebration' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">🎉</div>
                                    <div className="text-left"><p className="font-semibold">Celebration</p><p className="text-xs text-muted-foreground">Party time!</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('birthday'); localStorage.setItem(`chat-theme-${conversationId}`, 'birthday'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'birthday' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl">🎂</div>
                                    <div className="text-left"><p className="font-semibold">Birthday</p><p className="text-xs text-muted-foreground">Make a wish</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('summer'); localStorage.setItem(`chat-theme-${conversationId}`, 'summer'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'summer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-2xl">☀️</div>
                                    <div className="text-left"><p className="font-semibold">Summer</p><p className="text-xs text-muted-foreground">Sunny vibes</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('space'); localStorage.setItem(`chat-theme-${conversationId}`, 'space'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'space' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center justify-center text-2xl">🚀</div>
                                    <div className="text-left"><p className="font-semibold">Space</p><p className="text-xs text-muted-foreground">To infinity!</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('unicorn'); localStorage.setItem(`chat-theme-${conversationId}`, 'unicorn'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'unicorn' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center text-2xl">🦄</div>
                                    <div className="text-left"><p className="font-semibold">Unicorn</p><p className="text-xs text-muted-foreground">Magical rainbow</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('pizza'); localStorage.setItem(`chat-theme-${conversationId}`, 'pizza'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'pizza' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl">🍕</div>
                                    <div className="text-left"><p className="font-semibold">Pizza</p><p className="text-xs text-muted-foreground">Delicious slices</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('music'); localStorage.setItem(`chat-theme-${conversationId}`, 'music'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'music' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">🎵</div>
                                    <div className="text-left"><p className="font-semibold">Music</p><p className="text-xs text-muted-foreground">Feel the beat</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('gaming'); localStorage.setItem(`chat-theme-${conversationId}`, 'gaming'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'gaming' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-2xl">🎮</div>
                                    <div className="text-left"><p className="font-semibold">Gaming</p><p className="text-xs text-muted-foreground">Level up!</p></div>
                                </div>
                            </button>

                            <button onClick={() => { setChatTheme('coffee'); localStorage.setItem(`chat-theme-${conversationId}`, 'coffee'); setShowThemeSelector(false) }} className={`w-full p-4 rounded-xl border-2 transition-all ${chatTheme === 'coffee' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-700 to-orange-800 flex items-center justify-center text-2xl">☕</div>
                                    <div className="text-left"><p className="font-semibold">Coffee</p><p className="text-xs text-muted-foreground">Caffeine boost</p></div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
