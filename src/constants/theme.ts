/**
 * HelpHub Theme Constants
 * Defines colors, spacing, and design tokens
 * Used throughout the app for consistent styling
 */

// ====================================
// COLOR PALETTE
// ====================================

export const colors = {
  // Primary brand colors
  primary: "#EF4444", // Red for emergency/help theme
  primaryDark: "#DC2626",
  primaryLight: "#FCA5A5",

  // Neutral colors
  background: "#000000", // Dark background
  surface: "#1F2937", // Dark surface
  surfaceLight: "#374151",
  text: "#FFFFFF", // Light text on dark
  textSecondary: "#D1D5DB",
  textMuted: "#9CA3AF",

  // Semantic colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Light mode (for light theme)
  lightBackground: "#FFFFFF",
  lightSurface: "#F3F4F6",
  lightText: "#1F2937",
  lightTextSecondary: "#6B7280",

  // Gradients
  gradientPrimary: ["#EF4444", "#DC2626"], // Red gradient
  gradientSuccess: ["#10B981", "#059669"], // Green gradient
  gradientBlue: ["#3B82F6", "#1D4ED8"], // Blue gradient
  gradientOrange: ["#F97316", "#EA580C"], // Orange gradient
  gradientPurple: ["#A855F7", "#7E22CE"], // Purple gradient

  // Transparency
  overlay: "rgba(0, 0, 0, 0.5)",
  glassmorphism: "rgba(255, 255, 255, 0.1)",
};

// ====================================
// SPACING SCALE
// ====================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

// ====================================
// TYPOGRAPHY
// ====================================

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,

  // Font weights
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
};

// ====================================
// BORDER RADIUS
// ====================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
};

// ====================================
// SHADOWS
// ====================================

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 12,
  },
};

// ====================================
// ANIMATION DURATIONS
// ====================================

export const animations = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500,
};

// ====================================
// COMMON COMPONENT SIZES
// ====================================

export const sizes = {
  // Button sizes
  buttonSmall: 40,
  buttonMedium: 48,
  buttonLarge: 56,

  // Icon sizes
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,

  // Avatar sizes
  avatarSmall: 40,
  avatarMedium: 56,
  avatarLarge: 80,

  // Screen dimensions reference
  maxWidth: 1200,
};

// ====================================
// RESPONSIVE BREAKPOINTS
// ====================================

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};
