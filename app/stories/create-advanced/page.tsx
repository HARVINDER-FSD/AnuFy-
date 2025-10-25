"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import {
    ArrowLeft, Camera, X, Type, Smile, Music, Sparkles, Download, Send,
    Palette, Eraser, Undo, Image as ImageIcon, Video, Zap, Layers,
    Copy, Lock, Eye, EyeOff, ChevronUp, ChevronDown, Save, Clock,
    BarChart3, MessageSquare, Timer, Link as LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

// Text animation types
const TEXT_ANIMATIONS = [
    { id: 'none', name: 'None', class: '' },
    { id: 'fade', name: 'Fade In', class: 'animate-fade-in' },
    { id: 'slide-up', name: 'Slide Up', class: 'animate-slide-up' },
    { id: 'slide-down', name: 'Slide Down', class: 'animate-slide-down' },
    { id: 'slide-left', name: 'Slide Left', class: 'animate-slide-left' },
    { id: 'slide-right', name: 'Slide Right', class: 'animate-slide-right' },
    { id: 'bounce', name: 'Bounce', class: 'animate-bounce-in' },
    { id: 'pulse', name: 'Pulse', class: 'animate-pulse' },
    { id: 'typewriter', name: 'Typewriter', class: 'animate-typewriter' },
    { id: 'rotate', name: 'Rotate In', class: 'animate-rotate-in' },
]

// Text effects
const TEXT_EFFECTS = [
    { id: 'none', name: 'None' },
    { id: 'glow', name: 'Glow' },
    { id: 'shadow-3d', name: '3D Shadow' },
    { id: 'outline', name: 'Outline' },
    { id: 'neon', name: 'Neon' },
    { id: 'gradient', name: 'Gradient' },
]

// Background options
const BACKGROUNDS = [
    { id: 'none', name: 'None', value: 'transparent' },
    { id: 'black', name: 'Black', value: '#000000' },
    { id: 'white', name: 'White', value: '#ffffff' },
    { id: 'gradient-1', name: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'gradient-2', name: 'Ocean', value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)' },
    { id: 'gradient-3', name: 'Fire', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'gradient-4', name: 'Forest', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
    { id: 'gradient-5', name: 'Royal', value: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)' },
]

// Story templates
const TEMPLATES = [
    {
        id: 'quote',
        name: 'Quote',
        icon: '💬',
        config: {
            background: 'gradient-1',
            texts: [{
                content: 'Your inspiring quote here',
                fontSize: 36,
                color: '#ffffff',
                fontFamily: 'Georgia',
                x: 50,
                y: 50,
                animation: 'fade',
                effect: 'glow'
            }]
        }
    },
    {
        id: 'announcement',
        name: 'Announce',
        icon: '📢',
        config: {
            background: 'gradient-3',
            texts: [{
                content: 'BIG NEWS!',
                fontSize: 48,
                color: '#ffffff',
                fontFamily: 'Impact',
                x: 50,
                y: 30,
                animation: 'bounce',
                effect: 'shadow-3d'
            }]
        }
    },
    {
        id: 'countdown',
        name: 'Countdown',
        icon: '⏰',
        config: {
            background: 'gradient-5',
            interactive: { type: 'countdown', endDate: new Date(Date.now() + 86400000).toISOString() }
        }
    },
]

export default function AdvancedStoryCreator() {
    const router = useRouter()
    const { user, loading } = useAuth()
    const { toast } = useToast()

    // Media
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null)
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
    const [background, setBackground] = useState('none')
    const [showPreview, setShowPreview] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Tools
    const [activeTool, setActiveTool] = useState<'none' | 'text' | 'draw' | 'sticker' | 'music' | 'filter' | 'interactive' | 'templates'>('none')

    // Text with advanced properties
    const [texts, setTexts] = useState<Array<{
        id: string
        content: string
        x: number
        y: number
        fontSize: number
        color: string
        fontFamily: string
        rotation: number
        animation: string
        effect: string
        locked: boolean
        visible: boolean
        zIndex: number
    }>>([])
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null)

    // Story settings
    const [duration, setDuration] = useState(5) // seconds
    const [selectedFilter, setSelectedFilter] = useState('none')
    const [filterIntensity, setFilterIntensity] = useState(100)

    // Interactive elements
    const [interactive, setInteractive] = useState<{
        type: 'none' | 'poll' | 'question' | 'countdown' | 'quiz' | 'slider'
        data?: any
    }>({ type: 'none' })

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)

    // Auth check
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading || !user) {
        return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>
    }

    const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0]
        if (!file) return

        setMediaType(type)
        const reader = new FileReader()
        reader.onload = (e) => setSelectedMedia(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    const addText = () => {
        const newText = {
            id: Date.now().toString(),
            content: 'Tap to edit',
            x: 50,
            y: 50,
            fontSize: 36,
            color: '#ffffff',
            fontFamily: 'Arial',
            rotation: 0,
            animation: 'fade',
            effect: 'glow',
            locked: false,
            visible: true,
            zIndex: texts.length
        }
        setTexts([...texts, newText])
        setSelectedTextId(newText.id)
    }

    const updateText = (id: string, updates: Partial<typeof texts[0]>) => {
        setTexts(texts.map(t => t.id === id ? { ...t, ...updates } : t))
    }

    const deleteText = (id: string) => {
        setTexts(texts.filter(t => t.id !== id))
        setSelectedTextId(null)
    }

    const duplicateText = (id: string) => {
        const text = texts.find(t => t.id === id)
        if (!text) return

        const newText = {
            ...text,
            id: Date.now().toString(),
            x: text.x + 5,
            y: text.y + 5,
            zIndex: texts.length
        }
        setTexts([...texts, newText])
        setSelectedTextId(newText.id)
    }

    const bringToFront = (id: string) => {
        const maxZ = Math.max(...texts.map(t => t.zIndex))
        updateText(id, { zIndex: maxZ + 1 })
    }

    const sendToBack = (id: string) => {
        const minZ = Math.min(...texts.map(t => t.zIndex))
        updateText(id, { zIndex: minZ - 1 })
    }

    const applyTemplate = (template: typeof TEMPLATES[0]) => {
        setBackground(template.config.background || 'none')
        if (template.config.texts) {
            setTexts(template.config.texts.map((t, i) => ({
                ...t,
                id: (Date.now() + i).toString(),
                rotation: 0,
                locked: false,
                visible: true,
                zIndex: i
            })))
        }
        if (template.config.interactive) {
            setInteractive(template.config.interactive as any)
        }
        toast({ title: `${template.name} template applied!` })
    }

    const handleSubmit = async () => {
        if (!selectedMedia && background === 'none') {
            toast({
                title: "No content",
                description: "Please add media or choose a background",
                variant: "destructive"
            })
            return
        }

        try {
            const token = Cookies.get('client-token') || Cookies.get('token')

            const response = await fetch("/api/stories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    media_url: selectedMedia,
                    media_type: mediaType,
                    background,
                    texts,
                    filter: selectedFilter,
                    filterIntensity,
                    duration,
                    interactive,
                }),
            })

            if (response.ok) {
                toast({ title: "Story created!", description: "Your advanced story has been shared" })
                router.push("/stories")
            } else {
                throw new Error("Failed to create story")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create story",
                variant: "destructive"
            })
        }
    }

    const getTextStyle = (text: typeof texts[0]) => {
        let style: React.CSSProperties = {
            fontSize: `${text.fontSize}px`,
            color: text.color,
            fontFamily: text.fontFamily,
            transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
            zIndex: text.zIndex,
            display: text.visible ? 'block' : 'none',
        }

        // Apply effects
        switch (text.effect) {
            case 'glow':
                style.textShadow = `0 0 20px ${text.color}, 0 0 40px ${text.color}, 2px 2px 8px rgba(0,0,0,0.8)`
                break
            case 'shadow-3d':
                style.textShadow = '3px 3px 0 rgba(0,0,0,0.3), 6px 6px 0 rgba(0,0,0,0.2), 9px 9px 0 rgba(0,0,0,0.1)'
                break
            case 'outline':
                style.WebkitTextStroke = '2px black'
                style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)'
                break
            case 'neon':
                style.textShadow = `0 0 10px ${text.color}, 0 0 20px ${text.color}, 0 0 30px ${text.color}, 0 0 40px ${text.color}`
                style.color = '#fff'
                break
            case 'gradient':
                style.background = 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)'
                style.WebkitBackgroundClip = 'text'
                style.WebkitTextFillColor = 'transparent'
                break
            default:
                style.textShadow = '2px 2px 8px rgba(0,0,0,0.9)'
        }

        return style
    }

    const getBackgroundStyle = () => {
        const bg = BACKGROUNDS.find(b => b.id === background)
        if (!bg) return {}

        if (bg.value.startsWith('linear-gradient')) {
            return { background: bg.value }
        }
        return { backgroundColor: bg.value }
    }

    return (
        <>
            <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translate(-50%, 20%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translate(-50%, -120%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
        @keyframes slide-left {
          from { transform: translate(50%, -50%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
        @keyframes slide-right {
          from { transform: translate(-150%, -50%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
        @keyframes bounce-in {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes rotate-in {
          from { transform: translate(-50%, -50%) rotate(-180deg) scale(0); }
          to { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-slide-down { animation: slide-down 0.6s ease-out; }
        .animate-slide-left { animation: slide-left 0.6s ease-out; }
        .animate-slide-right { animation: slide-right 0.6s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .animate-rotate-in { animation: rotate-in 0.8s ease-out; }
      `}</style>

            <div className="fixed inset-0 bg-black flex flex-col">
                {/* Top bar */}
                <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-sm z-20">
                    <Button variant="ghost" size="icon" className="text-white" onClick={() => router.back()}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-white" onClick={() => toast({ title: "Draft saved!" })}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white">
                            <Download className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main canvas */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                    {selectedMedia || background !== 'none' ? (
                        <div
                            className="relative w-full h-full max-w-md"
                            style={getBackgroundStyle()}
                        >
                            {selectedMedia && (
                                mediaType === 'image' ? (
                                    <img src={selectedMedia} alt="Story" className="w-full h-full object-contain" />
                                ) : (
                                    <video src={selectedMedia} className="w-full h-full object-contain" controls />
                                )
                            )}

                            {/* Text overlays */}
                            {texts.map(text => (
                                <div
                                    key={text.id}
                                    className={`absolute cursor-move select-none ${TEXT_ANIMATIONS.find(a => a.id === text.animation)?.class}`}
                                    style={{
                                        left: `${text.x}%`,
                                        top: `${text.y}%`,
                                        ...getTextStyle(text),
                                        border: selectedTextId === text.id ? '2px dashed white' : 'none',
                                        padding: '12px',
                                        fontWeight: 'bold',
                                    }}
                                    onClick={() => !text.locked && setSelectedTextId(text.id)}
                                >
                                    {text.content}
                                    {text.locked && <Lock className="absolute top-0 right-0 h-4 w-4 text-white/50" />}
                                </div>
                            ))}

                            {/* Interactive elements preview */}
                            {interactive.type === 'poll' && (
                                <div className="absolute bottom-20 left-4 right-4 bg-white/20 backdrop-blur-md rounded-2xl p-4">
                                    <p className="text-white font-bold mb-3">Poll Question?</p>
                                    <div className="space-y-2">
                                        <div className="bg-white/30 rounded-full p-3 text-white text-center">Option 1</div>
                                        <div className="bg-white/30 rounded-full p-3 text-white text-center">Option 2</div>
                                    </div>
                                </div>
                            )}

                            {interactive.type === 'countdown' && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                    <Timer className="h-16 w-16 text-white mx-auto mb-4" />
                                    <div className="text-6xl font-bold text-white">00:00:00</div>
                                    <p className="text-white mt-2">Countdown Timer</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center px-4">
                            <Camera className="h-24 w-24 text-white/50 mx-auto mb-6" />
                            <p className="text-white/70 mb-8">Create your advanced story</p>
                            <div className="flex gap-4 justify-center">
                                <Button className="bg-white/20" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon className="h-5 w-5 mr-2" />
                                    Photo
                                </Button>
                                <Button className="bg-white/20" onClick={() => videoInputRef.current?.click()}>
                                    <Video className="h-5 w-5 mr-2" />
                                    Video
                                </Button>
                                <Button className="bg-white/20" onClick={() => setActiveTool('templates')}>
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Template
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaSelect(e, 'image')} />
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaSelect(e, 'video')} />

                {/* Tools bar */}
                {(selectedMedia || background !== 'none') && (
                    <>
                        {!showPreview && (
                        <div className="flex items-center justify-around p-3 bg-black/50 backdrop-blur-sm border-t border-white/10">
                            <button className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTool === 'text' ? 'bg-white/20' : ''}`} onClick={() => { setActiveTool('text'); addText(); }}>
                                <Type className="h-6 w-6 text-white" />
                                <span className="text-white text-xs">Text</span>
                            </button>
                            <button className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTool === 'templates' ? 'bg-white/20' : ''}`} onClick={() => setActiveTool('templates')}>
                                <Sparkles className="h-6 w-6 text-white" />
                                <span className="text-white text-xs">Templates</span>
                            </button>
                            <button className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTool === 'interactive' ? 'bg-white/20' : ''}`} onClick={() => setActiveTool('interactive')}>
                                <BarChart3 className="h-6 w-6 text-white" />
                                <span className="text-white text-xs">Interactive</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-2 rounded-lg" onClick={() => setActiveTool('none')}>
                                <Layers className="h-6 w-6 text-white" />
                                <span className="text-white text-xs">Layers</span>
                            </button>
                        </div>
                        )}

                        {/* Tool options */}
                        {activeTool === 'text' && selectedTextId && !showPreview && (
                            <div className="bg-black/90 p-4 max-h-64 overflow-y-auto border-t border-white/10">
                                <input
                                    type="text"
                                    value={texts.find(t => t.id === selectedTextId)?.content || ''}
                                    onChange={(e) => updateText(selectedTextId, { content: e.target.value })}
                                    className="w-full bg-white/10 text-white px-4 py-2 rounded-lg mb-3"
                                />

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <select
                                        value={texts.find(t => t.id === selectedTextId)?.animation || 'none'}
                                        onChange={(e) => updateText(selectedTextId, { animation: e.target.value })}
                                        className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm"
                                    >
                                        {TEXT_ANIMATIONS.map(a => (
                                            <option key={a.id} value={a.id} className="bg-black">{a.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={texts.find(t => t.id === selectedTextId)?.effect || 'none'}
                                        onChange={(e) => updateText(selectedTextId, { effect: e.target.value })}
                                        className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm"
                                    >
                                        {TEXT_EFFECTS.map(e => (
                                            <option key={e.id} value={e.id} className="bg-black">{e.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => duplicateText(selectedTextId)}>
                                        <Copy className="h-4 w-4 mr-1" />
                                        Duplicate
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => bringToFront(selectedTextId)}>
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => sendToBack(selectedTextId)}>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => updateText(selectedTextId, { locked: !texts.find(t => t.id === selectedTextId)?.locked })}>
                                        <Lock className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteText(selectedTextId)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTool === 'templates' && !showPreview && (
                            <div className="bg-black/90 p-4 max-h-64 overflow-y-auto border-t border-white/10">
                                <p className="text-white/70 text-xs mb-3">Choose Template</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {TEMPLATES.map(template => (
                                        <button
                                            key={template.id}
                                            className="p-4 bg-white/10 rounded-lg text-center hover:bg-white/20"
                                            onClick={() => applyTemplate(template)}
                                        >
                                            <div className="text-3xl mb-2">{template.icon}</div>
                                            <p className="text-white text-xs">{template.name}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <p className="text-white/70 text-xs mb-2">Background</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {BACKGROUNDS.map(bg => (
                                            <button
                                                key={bg.id}
                                                className={`h-12 rounded-lg border-2 ${background === bg.id ? 'border-white' : 'border-transparent'}`}
                                                style={bg.value.startsWith('linear') ? { background: bg.value } : { backgroundColor: bg.value }}
                                                onClick={() => setBackground(bg.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTool === 'interactive' && !showPreview && (
                            <div className="bg-black/90 p-4 max-h-64 overflow-y-auto border-t border-white/10">
                                <p className="text-white/70 text-xs mb-3">Add Interactive Element</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="p-3 bg-white/10 rounded-lg text-white text-sm" onClick={() => setInteractive({ type: 'poll' })}>
                                        <BarChart3 className="h-5 w-5 mx-auto mb-1" />
                                        Poll
                                    </button>
                                    <button className="p-3 bg-white/10 rounded-lg text-white text-sm" onClick={() => setInteractive({ type: 'question' })}>
                                        <MessageSquare className="h-5 w-5 mx-auto mb-1" />
                                        Question
                                    </button>
                                    <button className="p-3 bg-white/10 rounded-lg text-white text-sm" onClick={() => setInteractive({ type: 'countdown' })}>
                                        <Timer className="h-5 w-5 mx-auto mb-1" />
                                        Countdown
                                    </button>
                                    <button className="p-3 bg-white/10 rounded-lg text-white text-sm" onClick={() => setInteractive({ type: 'slider' })}>
                                        <LinkIcon className="h-5 w-5 mx-auto mb-1" />
                                        Link
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
                            {!showPreview ? (
                                <>
                                    <div className="flex gap-2 mb-2">
                                        <div className="flex-1">
                                            <p className="text-white/70 text-xs mb-1">Duration</p>
                                            <select
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                className="w-full bg-white/10 text-white px-3 py-2 rounded-lg text-sm"
                                            >
                                                <option value={3} className="bg-black">3 seconds</option>
                                                <option value={5} className="bg-black">5 seconds</option>
                                                <option value={10} className="bg-black">10 seconds</option>
                                                <option value={15} className="bg-black">15 seconds</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                            onClick={() => {
                                                setSelectedMedia(null)
                                                setBackground('none')
                                                setTexts([])
                                                setInteractive({ type: 'none' })
                                                setActiveTool('none')
                                            }}
                                        >
                                            <X className="h-5 w-5 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                                            onClick={() => setShowPreview(true)}
                                        >
                                            Preview
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                            onClick={() => setShowPreview(false)}
                                        >
                                            <ArrowLeft className="h-5 w-5 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            <Send className="h-5 w-5 mr-2" />
                                            {isSubmitting ? 'Sharing...' : 'Share Story'}
                                        </Button>
                                    </div>
                                    <p className="text-white/60 text-xs text-center">Preview your story before sharing</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
