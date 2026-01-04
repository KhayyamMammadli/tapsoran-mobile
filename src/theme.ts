import { MD3LightTheme as DefaultTheme } from "react-native-paper";

export const theme = {
  ...DefaultTheme,
  // Consistent UI rounding across the app.
  // Requested: keep corners subtle (≈5px).
  roundness: 5,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2F6FEB",
    secondary: "#FF7A00",
    tertiary: "#22C55E",

    background: "#F6F8FC",
    surface: "#FFFFFF",
    surfaceVariant: "#EEF2FF",

    outline: "#E5E7EB",
    outlineVariant: "#E5E7EB",

    onBackground: "#0F172A",
    onSurface: "#0F172A",
    onSurfaceVariant: "#475569",
  },
};
