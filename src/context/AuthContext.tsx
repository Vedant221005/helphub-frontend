/**
 * Authentication Context
 * Manages global authentication state
 * Provides user data and auth methods to entire app
 *
 * Usage:
 * const auth = useContext(AuthContext)
 * OR use the custom hook: const auth = useAuth()
 */

import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, APP_CONFIG } from "@/constants/api";

// ====================================
// TYPE DEFINITIONS
// ====================================

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  bloodGroup: string | null;
  profileImage: string | null;
  latitude: number | null;
  longitude: number | null;
  role: string;
  isBloodDonor: boolean;
  donorAvailability: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Methods
  register: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    bloodGroup?: string,
    role?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  restoreToken: () => Promise<void>;
  setSession: (user: User, token: string) => Promise<void>;
}

// ====================================
// CREATE CONTEXT
// ====================================

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// ====================================
// CONTEXT PROVIDER COMPONENT
// ====================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = async (sessionUser: User, sessionToken: string) => {
    setToken(sessionToken);
    setUser(sessionUser);

    await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, sessionToken);
    await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(sessionUser));
    await AsyncStorage.setItem('userToken', sessionToken);
    await AsyncStorage.setItem('userData', JSON.stringify(sessionUser));
  };

  // ====================================
  // RESTORE TOKEN ON APP START
  // ====================================

  const restoreToken = async () => {
    try {
      setLoading(true);

      // Check if token exists in storage
      let savedToken = await AsyncStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN
      );
      let savedUser = await AsyncStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.USER_DATA
      );

      // Fallback to legacy keys used elsewhere in the app
      if (!savedToken) {
        const legacyToken = await AsyncStorage.getItem('userToken');
        if (legacyToken) savedToken = legacyToken;
      }

      if (!savedUser) {
        const legacyUser = await AsyncStorage.getItem('userData');
        if (legacyUser) savedUser = legacyUser;
      }

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to restore token:", error);
    } finally {
      setLoading(false);
    }
  };

  // Restore token on mount
  useEffect(() => {
    restoreToken();
  }, []);

  // ====================================
  // REGISTER
  // ====================================

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    bloodGroup?: string,
    role?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          bloodGroup,
          role: role || "user",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const data = await response.json();

      await persistSession(data.user, data.token);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // ====================================
  // LOGIN
  // ====================================

const login = async (email: string, password: string) => {
  try {
    console.log("🚀 LOGIN STARTED");
    console.log("🌐 URL:", `${API_BASE_URL}/auth/login`);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 20000);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("📡 RESPONSE STATUS:", response.status);

    const data = await response.json();

    console.log("📦 RESPONSE DATA:", data);

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    await persistSession(data.user, data.token);

    console.log("✅ LOGIN SUCCESS");
  } catch (error: any) {
    console.log("❌ LOGIN ERROR:", error);
    console.log("❌ ERROR MESSAGE:", error?.message);

    if (error.name === "AbortError") {
      throw new Error(
        "Server is waking up. Please wait 30-60 seconds and try again."
      );
    }

    throw error;
  }
};

  // ====================================
  // LOGOUT
  // ====================================

  const logout = async () => {
    try {
      // Clear state
      setUser(null);
      setToken(null);

      // Clear storage
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // ====================================
  // UPDATE PROFILE
  // ====================================

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const data = await response.json();

      // Update state and storage
      setUser(data.user);
      await AsyncStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(data.user)
      );
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const setSession = async (sessionUser: User, sessionToken: string) => {
    await persistSession(sessionUser, sessionToken);
  };

  // ====================================
  // CONTEXT VALUE
  // ====================================

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateProfile,
    restoreToken,
    setSession,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// ====================================
// CUSTOM HOOK
// ====================================

/**
 * Hook to use Auth Context
 * Usage: const auth = useAuth()
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
