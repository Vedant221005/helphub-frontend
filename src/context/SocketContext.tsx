/**
 * Socket.io Context
 * Manages real-time communication with backend
 * Handles chat messages, emergencies, notifications
 *
 * Usage:
 * const socket = useContext(SocketContext)
 * OR use the custom hook: const socket = useSocket()
 */

import React, { createContext, useEffect, useState, ReactNode } from "react";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL, SOCKET_URL, SOCKET_EVENTS } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";

// ====================================
// TYPE DEFINITIONS
// ====================================

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isTyping: boolean;
  onlineUsers: string[];
  unreadCounts: { [userId: string]: number };
  totalUnreadCount: number;
  activeChatUserId: string | null;

  // Methods
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  connect: () => void;
  disconnect: () => void;
  incrementUnreadCount: (userId: string) => void;
  clearUnreadCount: (userId: string) => void;
  setActiveChatUser: (userId: string | null) => void;
}

// ====================================
// CREATE CONTEXT
// ====================================

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

// ====================================
// CONTEXT PROVIDER COMPONENT
// ====================================

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const activeChatRef = React.useRef<string | null>(null);

  const { user, token } = useAuth();

  const totalUnreadCount = React.useMemo(
    () => Object.values(unreadCounts).reduce((sum, count) => sum + (count || 0), 0),
    [unreadCounts]
  );

  const syncUnreadCounts = async (sessionToken: string, sessionUserId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (!response.data.success || !Array.isArray(response.data.conversations)) {
        return;
      }

      const nextUnreadCounts: { [userId: string]: number } = {};

      for (const conversation of response.data.conversations) {
        const otherUserId = conversation?.otherUser?.id;
        if (!otherUserId || otherUserId === sessionUserId) {
          continue;
        }

        nextUnreadCounts[otherUserId] = conversation.unreadCount || 0;
      }

      setUnreadCounts(nextUnreadCounts);
    } catch (error) {
      console.error('Failed to sync unread counts:', error);
    }
  };

  // ====================================
  // INITIALIZE SOCKET CONNECTION
  // ====================================

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
        userId: user.id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection handlers
    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);

      // Announce user is online
      console.log(`Socket ${newSocket.id} announcing online for user:${user.id}`);
      newSocket.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId: user.id,
        userName: user.fullName,
      });
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    // Error handling
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Online users update
    newSocket.on("users:online", (users: string[]) => {
      setOnlineUsers(users);
    });

    // Typing indicator
    newSocket.on(SOCKET_EVENTS.TYPING_START, () => {
      setIsTyping(true);
    });

    newSocket.on(SOCKET_EVENTS.TYPING_STOP, () => {
      setIsTyping(false);
    });

    setSocket(newSocket);

    // Listen for incoming messages and increment unread when appropriate
    newSocket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, (data: any) => {
      console.log(`Socket ${newSocket.id} received event ${SOCKET_EVENTS.MESSAGE_RECEIVE}:`, data);
      const senderId = data.senderId || data.sender?.id;
      if (!senderId) return;

      if (senderId === user.id) return;

      // If the user currently has this chat open, don't increment
      if (senderId === activeChatRef.current) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    if (!user?.id || !token) {
      setUnreadCounts({});
      return;
    }

    syncUnreadCounts(token, user.id);
  }, [user?.id, token]);

  // ====================================
  // SOCKET METHODS
  // ====================================

  const emit = (event: string, data?: any) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string) => {
    if (socket) {
      socket.off(event);
    }
  };

  const connect = () => {
    if (socket && !isConnected) {
      socket.connect();
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  const incrementUnreadCount = (userId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1,
    }));
  };

  const clearUnreadCount = (userId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [userId]: 0,
    }));
  };

  const setActiveChatUser = (userId: string | null) => {
    setActiveChatUserId(userId);
    activeChatRef.current = userId;
    if (!userId) return;
    // optionally clear unread when user opens the chat
    setUnreadCounts((prev) => ({
      ...prev,
      [userId]: 0,
    }));
  };

  // ====================================
  // CONTEXT VALUE
  // ====================================

  const value: SocketContextType = {
    socket,
    isConnected,
    isTyping,
    onlineUsers,
    unreadCounts,
    totalUnreadCount,
    activeChatUserId,
    emit,
    on,
    off,
    connect,
    disconnect,
    incrementUnreadCount,
    clearUnreadCount,
    setActiveChatUser,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// ====================================
// CUSTOM HOOK
// ====================================

/**
 * Hook to use Socket Context
 * Usage: const socket = useSocket()
 */
export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
