"use client"

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (data: {
    conversationId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    replyTo?: string;
  }) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markMessagesAsRead: (conversationId: string, messageIds: string[]) => void;
  addReaction: (messageId: string, emoji: string) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    
    if (!token) {
      return;
    }

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  const sendMessage = (data: {
    conversationId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    replyTo?: string;
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', data);
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  };

  const startTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', { conversationId });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', { conversationId });
    }
  };

  const markMessagesAsRead = (conversationId: string, messageIds: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_messages_read', { conversationId, messageIds });
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('add_reaction', { messageId, emoji });
    }
  };

  return {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    addReaction
  };
}
