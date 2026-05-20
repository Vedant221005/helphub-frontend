import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, SOCKET_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

console.log('🔧 API Configuration:');
console.log('  API_BASE_URL:', API_BASE_URL);
console.log('  SOCKET_URL:', SOCKET_URL);

// Use API_BASE_URL but remove /api suffix for emergencies endpoint
const API_URL = API_BASE_URL.replace('/api', '');

console.log('🔌 EmergenciesContext initialized:');
console.log('  API_URL:', API_URL);
console.log('  Full endpoint:', `${API_URL}/api/emergencies`);

const EMERGENCY_TTL_MS = 2 * 60 * 60 * 1000;

const isEmergencyExpired = (createdAt: string) => {
  return Date.now() - new Date(createdAt).getTime() >= EMERGENCY_TTL_MS;
};

const filterActiveEmergencies = (items: Emergency[]) =>
  items.filter((emergency) => !isEmergencyExpired(emergency.createdAt));

interface Emergency {
  id: string;
  type: string;
  message: string;
  userName: string;
  userEmail: string;
  userId: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface EmergenciesContextType {
  emergencies: Emergency[];
  ownEmergencies: Emergency[];
  notificationCount: number;
  socket: Socket | null;
  fetchEmergencies: (token: string | null, userId: string | null) => Promise<void>;
}

const EmergenciesContext = createContext<EmergenciesContextType | undefined>(undefined);

export const EmergenciesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [ownEmergencies, setOwnEmergencies] = useState<Emergency[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { user, token } = useAuth();

  const refreshEmergencies = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!token || !currentUserId) {
        return;
      }

      await fetchEmergencies(token, currentUserId);
    } catch (error) {
      console.error('Error refreshing emergencies:', error);
    }
  };

  useEffect(() => {
    const pruneExpiredEmergencies = () => {
      setEmergencies((prev) => {
        const next = filterActiveEmergencies(prev);
        if (next.length !== prev.length) {
          setNotificationCount(next.length);
        }
        return next;
      });

      setOwnEmergencies((prev) => filterActiveEmergencies(prev));
    };

    pruneExpiredEmergencies();
    const interval = setInterval(pruneExpiredEmergencies, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextUserId = user?.id || null;

    if (currentUserId !== nextUserId) {
      setCurrentUserId(nextUserId);
      setEmergencies([]);
      setOwnEmergencies([]);
      setNotificationCount(0);
    }
  }, [currentUserId, user?.id]);

  useEffect(() => {
    const initSocket = async () => {
      try {
        // Disconnect old socket if it exists
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }

        const sessionToken = token || (await AsyncStorage.getItem('userToken'));

        // Only fetch emergencies if we have a valid token
        if (sessionToken) {
          // Fetch existing emergencies FIRST before socket setup
          // This ensures notifications are loaded when user logs in after SOS is sent
          await fetchEmergencies(sessionToken, currentUserId);
        }

        const newSocket = io(SOCKET_URL, {
          auth: {
            token: `Bearer ${sessionToken}`,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
          console.log('✅ Socket.io connected for user:', currentUserId);
        });

        newSocket.on('emergency:new', (emergency: Emergency) => {
          console.log('🚨 NEW EMERGENCY RECEIVED via socket:', emergency);
          console.log('📌 Current user ID:', currentUserId);
          console.log('📌 Emergency user ID:', emergency.userId);

          if (emergency.userId === currentUserId) {
            console.log('✅ Adding own emergency to list');
            setOwnEmergencies((prev) => [emergency, ...prev]);
          } else {
            console.log('✅ Adding emergency from other user to list');
            setEmergencies((prev) => [emergency, ...prev]);
            setNotificationCount((prev) => prev + 1);
          }
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Socket.io disconnected');
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Socket.io initialization error:', error);
      }
    };

    if (currentUserId && token) {
      initSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUserId, token]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    refreshEmergencies();
    const interval = setInterval(refreshEmergencies, 60000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  const fetchEmergencies = async (token: string | null, userId: string | null) => {
    try {
      if (!token) {
        console.warn('⚠️  No token available - skipping emergencies fetch');
        return;
      }

      console.log('📍 Fetching emergencies for user:', userId);

      const response = await fetch(`${API_URL}/api/emergencies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Raw emergencies from API:', data.emergencies);

        // Separate own emergencies from others
        const ownEmerg: Emergency[] = [];
        const otherEmerg: Emergency[] = [];

        (data.emergencies || []).forEach((emergency: Emergency) => {
          if (isEmergencyExpired(emergency.createdAt)) {
            return;
          }

          if (emergency.userId === userId) {
            ownEmerg.push(emergency);
          } else {
            otherEmerg.push(emergency);
          }
        });

        console.log('✅ Own emergencies:', ownEmerg);
        console.log('✅ Other emergencies:', otherEmerg);

        const activeOwnEmerg = filterActiveEmergencies(ownEmerg);
        const activeOtherEmerg = filterActiveEmergencies(otherEmerg);

        setOwnEmergencies(activeOwnEmerg);
        setEmergencies(activeOtherEmerg);
        setNotificationCount(activeOtherEmerg.length);
      } else {
        console.error('❌ API returned non-200 status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching emergencies:', error);
    }
  };

  return (
    <EmergenciesContext.Provider value={{ emergencies, ownEmergencies, notificationCount, socket, fetchEmergencies }}>
      {children}
    </EmergenciesContext.Provider>
  );
};

export const useEmergencies = () => {
  const context = useContext(EmergenciesContext);
  if (!context) {
    throw new Error('useEmergencies must be used within EmergenciesProvider');
  }
  return context;
};
