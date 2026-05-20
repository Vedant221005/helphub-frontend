/**
 * Frontend API Configuration
 * Centralized API endpoints and external service URLs
 */

// API Base URL - Points to backend server
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Socket.io Server URL - For real-time communication
export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:3000";

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Firebase Configuration (for push notifications)
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// ====================================
// API ENDPOINTS
// ====================================

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    PROFILE: "/auth/profile",
    LOGOUT: "/auth/logout",
  },

  // Blood Donors
  DONORS: {
    REGISTER: "/donors/register",
    NEARBY: "/donors/nearby",
    FILTER_BY_BLOOD_GROUP: "/donors/blood-group",
    AVAILABILITY: "/donors/:id/availability",
    GET_DONOR: "/donors/:id",
  },

  // Emergencies
  EMERGENCIES: {
    CREATE: "/emergencies/create",
    NEARBY: "/emergencies/nearby",
    GET_EMERGENCY: "/emergencies/:id",
    UPDATE_STATUS: "/emergencies/:id/status",
    DELETE: "/emergencies/:id",
  },

  // Volunteer Campaigns
  CAMPAIGNS: {
    CREATE: "/campaigns/create",
    NEARBY: "/campaigns/nearby",
    GET_CAMPAIGN: "/campaigns/:id",
    JOIN: "/campaigns/:id/join",
    LEAVE: "/campaigns/:id/leave",
    VOLUNTEERS: "/campaigns/:id/volunteers",
  },

  // Messages
  MESSAGES: {
    SEND: "/messages/send",
    GET_HISTORY: "/messages/:userId",
  },

  // Image Upload
  UPLOAD: {
    IMAGE: "/upload/image",
  },
};

// ====================================
// SOCKET.IO EVENTS
// ====================================

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // User events
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_UPDATE: "user:update",

  // Chat events
  MESSAGE_SEND: "message:send",
  MESSAGE_RECEIVE: "message:receive",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // Emergency events
  EMERGENCY_CREATE: "emergency:create",
  EMERGENCY_UPDATE: "emergency:update",
  EMERGENCY_RESOLVE: "emergency:resolve",

  // Group events
  GROUP_JOIN: "group:join",
  GROUP_LEAVE: "group:leave",
};

// ====================================
// APP CONSTANTS
// ====================================

export const APP_CONFIG = {
  // App info
  NAME: "HelpHub",
  VERSION: "1.0.0",
  TAGLINE: "Helping Communities Connect",

  // Geolocation
  DEFAULT_LATITUDE: 40.7128,
  DEFAULT_LONGITUDE: -74.006,
  NEARBY_RADIUS_KM: 5, // Search radius for nearby resources

  // Blood groups
  BLOOD_GROUPS: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],

  // Emergency types
  EMERGENCY_TYPES: [
    { label: "Medical Emergency", value: "medical", icon: "heart" },
    { label: "Accident", value: "accident", icon: "alert" },
    { label: "Blood Required", value: "blood", icon: "droplet" },
    { label: "Transport Help", value: "transport", icon: "car" },
    { label: "Safety Issue", value: "safety", icon: "shield" },
  ],

  // Volunteer campaign types
  CAMPAIGN_TYPES: [
    { label: "Blood Donation", value: "blood_donation", icon: "droplet" },
    { label: "Food Donation", value: "food_donation", icon: "utensils" },
    { label: "Tree Plantation", value: "tree_plantation", icon: "leaf" },
    {
      label: "Emergency Help",
      value: "emergency_help",
      icon: "alert-circle",
    },
    { label: "Education", value: "education", icon: "book" },
  ],

  // User roles
  USER_ROLES: ["user", "volunteer", "admin"],

  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "auth_token",
    USER_DATA: "user_data",
    THEME_MODE: "theme_mode",
    SOCKET_ID: "socket_id",
  },
};

// ====================================
// ERROR MESSAGES
// ====================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_NOT_FOUND: "User not found.",
  EMAIL_ALREADY_EXISTS: "Email already registered.",
  PHONE_ALREADY_EXISTS: "Phone number already registered.",
  INVALID_EMAIL: "Invalid email format.",
  WEAK_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, and numbers.",
  INVALID_PHONE: "Invalid phone number.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  SERVER_ERROR: "Server error. Please try again later.",
  LOCATION_PERMISSION_DENIED: "Location permission was denied.",
  CAMERA_PERMISSION_DENIED: "Camera permission was denied.",
};

// ====================================
// SUCCESS MESSAGES
// ====================================

export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: "Registration successful! Please log in.",
  LOGIN_SUCCESS: "Welcome back!",
  PROFILE_UPDATED: "Profile updated successfully.",
  EMERGENCY_CREATED: "Emergency request sent to nearby volunteers.",
  CAMPAIGN_JOINED: "You have joined the campaign!",
  MESSAGE_SENT: "Message sent!",
  IMAGE_UPLOADED: "Image uploaded successfully.",
};
