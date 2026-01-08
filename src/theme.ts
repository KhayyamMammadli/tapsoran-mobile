import { MD3LightTheme as DefaultTheme } from "react-native-paper";

/**
 * TapSoran – modern, clean mobile theme (MD3)
 * - Slightly higher roundness for a contemporary look
 * - Soft background + strong primary for clear hierarchy
 */
export const theme = {
  ...DefaultTheme,
  roundness: 18,
  colors: {
    ...DefaultTheme.colors,

    // Brand
    primary: "#4F46E5", // Indigo
    secondary: "#06B6D4", // Cyan
    tertiary: "#F97316", // Orange

    // Surfaces
    background: "#F6F7FB",
    surface: "#FFFFFF",
    surfaceVariant: "#EEF2FF",

    // Lines
    outline: "#E7EAF2",
    outlineVariant: "#E7EAF2",

    // Text
    onBackground: "#0F172A",
    onSurface: "#0F172A",
    onSurfaceVariant: "#475569",
  },
};
