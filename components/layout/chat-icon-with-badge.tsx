"use client"

import { MessageCircle } from 'lucide-react'
import { useChatNotifications } from '@/hooks/use-chat-notifications'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function ChatIconWithBadge() {
  const { unreadCount } = useChatNotifications()

  return (
    <Link href="/messages" className="relative">
      <MessageCircle className="w-6 h-6" />
      
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  )
}
