"use client"

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Send, Smile, Image, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/components/auth/auth-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthToken } from '@/lib/auth-utils';

interface Message {
  _id: string;
  sender_id: string;
  content: string;
  message_type: string;
  media_url?: string;
  created_at: string;
  is_read: boolean;
  reactions: Array<{
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
}

interface ChatWindowProps {
  conversationId: string;
  recipient: {
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
  };
  onClose: () => void;
}

export function ChatWindow({ conversationId, recipient, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { socket, isConnected, sendMessage, joinConversation, leaveConversation, startTyping, stopTyping, markMessagesAsRead } = useSocket();
  const { user } = useAuth();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join conversation when component mounts
  useEffect(() => {
    if (isConnected && conversationId) {
      joinConversation(conversationId);
      loadMessages();
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [isConnected, conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark message as read if it's from the current conversation
      if (message.conversation_id === conversationId) {
        markMessagesAsRead(conversationId, [message._id]);
      }
    };

    const handleUserTyping = (data: { userId: string; username: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        setIsTyping(true);
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
          if (typingUsers.length === 1) {
            setIsTyping(false);
          }
        }, 3000);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
      if (typingUsers.length === 1) {
        setIsTyping(false);
      }
    };

    const handleMessagesRead = (data: { userId: string; messageIds: string[] }) => {
      // Update read status for messages
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg._id) 
          ? { ...msg, is_read: true }
          : msg
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, conversationId, user?.id, typingUsers.length]);

  // Optimized message loading with pagination
  const loadMessages = useCallback(async (append = false) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const skip = append ? messages.length : 0;
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/messages?limit=10&skip=${skip}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        setMessages(prev => append ? [...newMessages, ...prev] : newMessages);
        
        // Mark unread messages as read (non-blocking)
        const unreadMessageIds = newMessages
          .filter((msg: Message) => !msg.is_read && msg.sender_id !== user?.id)
          .map((msg: Message) => msg._id);
        
        if (unreadMessageIds.length > 0 && markMessagesAsRead) {
          // Don't await - let it run in background
          markMessagesAsRead(conversationId, unreadMessageIds);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messages.length, user?.id, markMessagesAsRead]);

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      sendMessage({
        conversationId,
        content: newMessage.trim(),
        messageType: 'text'
      });
      setNewMessage('');
      stopTyping(conversationId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Start typing indicator
    if (e.target.value.trim() && !typingTimeoutRef.current) {
      startTyping(conversationId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading messages...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={recipient.avatar || "/placeholder-user.jpg"} alt={recipient.username} />
            <AvatarFallback>{recipient.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{recipient.username}</h3>
            <p className="text-sm text-muted-foreground">
              {recipient.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.created_at)}
                    {message.sender_id === user?.id && (
                      <span className="ml-1">
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing indicator */}
        {isTyping && typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">
                {typingUsers.length === 1 ? 'Someone is typing...' : 'Multiple people are typing...'}
              </p>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Image className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={!isConnected}
          />
          <Button variant="ghost" size="icon">
            <Smile className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || !isConnected}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2">
            Connecting to chat server...
          </p>
        )}
      </div>
    </Card>
  );
}
