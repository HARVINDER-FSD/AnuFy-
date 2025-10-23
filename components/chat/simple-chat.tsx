"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

interface SimpleChatProps {
    conversationId: string
    recipient: {
        id: string
        username: string
        full_name?: string
        avatar: string
    }
    onClose?: () => void
}

export function SimpleChat({ conversationId, recipient, onClose }: SimpleChatProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [replyingTo, setReplyingTo] = useState<any>(null)
    const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
    const [isTyping, setIsTyping] = useState(false)
    const [recipientTyping, setRecipientTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { user } = useAuth()

    const quickReactions = ['❤️', '😂', '😮', '😢', '🙏', '👍']

    // Typing indicator
    const handleTyping = () => {
        if (!isTyping) setIsTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000)
    }

    useEffect(() => {
        fetchMessages()
    }, [conversationId])

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

        try {
            const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    conversation_id: conversationId,
                    content: newMessage,
                    message_type: 'text',
                    reply_to: replyingTo?._id
                })
            })

            if (response.ok) {
                const data = await response.json()
                setMessages(prev => [...prev, data.message])
                setNewMessage('')
                setReplyingTo(null)
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            await fetch(`/api/messages/conversations/${conversationId}/messages/${messageId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ emoji })
            })
            fetchMessages()
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleDelete = async (messageId: string) => {
        if (!confirm('Delete this message?')) return
        try {
            await fetch(`/api/messages/conversations/${conversationId}/messages/${messageId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            setMessages(prev => prev.filter(m => m._id !== messageId))
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="border-b p-4 flex items-center gap-3">
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        ←
                    </button>
                )}
                <div className="relative">
                    <img src={recipient.avatar} alt="" className="w-10 h-10 rounded-full" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                </div>
                <div className="flex-1">
                    <p className="font-semibold">{recipient.full_name || recipient.username}</p>
                    {recipientTyping ? (
                        <div className="flex items-center gap-1 text-sm text-blue-500">
                            <span>typing</span>
                            <span className="flex gap-0.5">
                                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Active now</p>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <img src={recipient.avatar} alt="" className="w-24 h-24 rounded-full mb-4" />
                        <p className="font-semibold text-lg">{recipient.full_name || recipient.username}</p>
                        <p className="text-gray-500 text-sm">{recipient.username}</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = message.sender_id === user?.id
                        const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id)

                        return (
                            <div
                                key={message._id}
                                className={`flex items-end gap-2 mb-3 relative ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                onMouseEnter={() => setHoveredMessage(message._id)}
                                onMouseLeave={() => setHoveredMessage(null)}
                                onDoubleClick={() => handleReaction(message._id, '❤️')}
                            >
                                {!isOwn && (
                                    <img
                                        src={recipient.avatar}
                                        alt=""
                                        className={`w-6 h-6 rounded-full ${showAvatar ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                )}
                                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {/* Reply Preview */}
                                    {message.reply_to && (
                                        <div className={`mb-1 px-3 py-1 rounded-lg text-xs border-l-2 ${isOwn ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : 'bg-gray-100 dark:bg-gray-800 border-gray-400'
                                            }`}>
                                            <p className="font-semibold opacity-70">
                                                {message.reply_to.sender_id === user?.id ? 'You' : recipient.username}
                                            </p>
                                            <p className="opacity-60 truncate">{message.reply_to.content}</p>
                                        </div>
                                    )}

                                    <div className="relative">
                                        {/* Shared Content */}
                                        {(message.message_type === 'shared_post' || message.message_type === 'shared_story') && message.shared_content ? (
                                            <div className="space-y-2">
                                                {message.content && message.content !== `Shared a ${message.shared_content.content_type}` && (
                                                    <div className={`px-4 py-2 rounded-3xl ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                                        <p className="text-sm">{message.content}</p>
                                                    </div>
                                                )}
                                                <div
                                                    onClick={() => window.location.href = message.shared_content.content_type === 'post' ? '/reels' : `/stories?storyId=${message.shared_content.content_id}`}
                                                    className="border rounded-2xl overflow-hidden bg-white dark:bg-gray-800 hover:opacity-90 cursor-pointer shadow-sm max-w-[280px]"
                                                >
                                                    {message.shared_content.preview_data?.media_url && (
                                                        <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-900">
                                                            <img src={message.shared_content.preview_data.media_url} alt="" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                <div className="bg-white/90 rounded-full p-3">▶</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="p-3">
                                                        <p className="text-xs font-semibold">{message.shared_content.preview_data?.username || 'User'}</p>
                                                        <p className="text-xs text-blue-500 mt-1">Tap to view {message.shared_content.content_type}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`px-4 py-2 rounded-3xl ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
                                                <p className="text-sm break-words">{message.content}</p>
                                            </div>
                                        )}

                                        {/* Hover Actions */}
                                        {hoveredMessage === message._id && (
                                            <div className={`absolute -top-2 ${isOwn ? 'left-0' : 'right-0'} flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border p-1`}>
                                                <button
                                                    onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                                    title="React"
                                                >
                                                    ❤️
                                                </button>
                                                <button
                                                    onClick={() => setReplyingTo(message)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm"
                                                    title="Reply"
                                                >
                                                    ↩️
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(message.content)}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm"
                                                    title="Copy"
                                                >
                                                    📋
                                                </button>
                                                {isOwn && (
                                                    <button
                                                        onClick={() => handleDelete(message._id)}
                                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-full text-sm"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Emoji Picker */}
                                        {showEmojiPicker === message._id && (
                                            <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 flex gap-1 z-10">
                                                {quickReactions.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => {
                                                            handleReaction(message._id, emoji)
                                                            setShowEmojiPicker(null)
                                                        }}
                                                        className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-transform hover:scale-125"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Reactions Display */}
                                    {message.reactions && message.reactions.length > 0 && (
                                        <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            {message.reactions.map((reaction: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleReaction(message._id, reaction.emoji)}
                                                    className="bg-white dark:bg-gray-800 border rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                >
                                                    <span className="text-sm">{reaction.emoji}</span>
                                                    {reaction.user_id === user?.id && (
                                                        <span className="text-[10px] font-medium text-blue-500">You</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className="text-xs text-gray-500">
                                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        {isOwn && message.is_read && (
                                            <span className="text-blue-500 text-xs">✓✓</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t">
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">
                                Replying to {replyingTo.sender_id === user?.id ? 'yourself' : recipient.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="p-4 flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                    {newMessage.trim() && (
                        <button
                            onClick={handleSend}
                            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                        >
                            Send
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
