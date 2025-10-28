"use client"

import { Search, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AppHeader() {
  const router = useRouter()
  const [messageCount, setMessageCount] = useState(0)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div
          onClick={() => router.push('/feed')}
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              router.push('/feed')
            }
          }}
        >
          <h1
            className="text-3xl font-bold select-none"
            style={{
              fontFamily: "'Pacifico', 'Dancing Script', cursive",
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AnuFy
          </h1>
        </div>

        {/* Navigation Icons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Icon */}
          <div
            onClick={() => router.push('/search')}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer active:scale-95"
            role="button"
            tabIndex={0}
            aria-label="Search"
          >
            <Search
              style={{
                width: '28px',
                height: '28px',
                pointerEvents: 'none'
              }}
              className="text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Messages Icon */}
          <div
            onClick={() => router.push('/messages')}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer active:scale-95"
            role="button"
            tabIndex={0}
            aria-label="Messages"
          >
            <MessageCircle
              style={{
                width: '28px',
                height: '28px',
                pointerEvents: 'none'
              }}
              className="text-gray-700 dark:text-gray-300"
            />
            {messageCount > 0 && (
              <span
                style={{ pointerEvents: 'none' }}
                className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
              >
                {messageCount > 9 ? '9+' : messageCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
