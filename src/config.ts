import { Platform } from "react-native";
import Constants from "expo-constants";

// Live backend default (Render).
// Override with EXPO_PUBLIC_API_URL if you deploy a custom domain.
// Example:
//   EXPO_PUBLIC_API_URL=https://api.yourdomain.com
const ENV_URL = String(process.env.EXPO_PUBLIC_API_URL || "").trim();

// Local dev defaults (when EXPO_PUBLIC_API_URL is not provided):
// - Best effort: auto-detect the LAN IP from the Expo dev server host and use :4000.
//   This works nicely for Expo Go on a *physical phone* (same Wi‑Fi).
// - Fallbacks:
//   - Android emulator: 10.0.2.2 points to your computer
//   - iOS simulator: localhost points to your computer
const guessLanApiUrl = (): string | null => {
  // Different Expo SDKs expose this in different places.
  const anyC: any = Constants as any;
  const hostUri: string | undefined =
    anyC?.expoConfig?.hostUri ||
    anyC?.manifest2?.extra?.expoClient?.hostUri ||
    anyC?.manifest?.debuggerHost ||
    anyC?.manifest2?.extra?.expoGo?.debuggerHost ||
    anyC?.manifest?.hostUri;

  if (!hostUri || typeof hostUri !== "string") return null;

  // Examples:
  //  - "192.168.1.10:19000"
  //  - "192.168.1.10:8081"
  //  - "exp://192.168.1.10:19000"
  const cleaned = hostUri.replace(/^\w+:\/\//, "");
  const host = cleaned.split("/")[0];
  const ip = host.split(":")[0];

  // Very small sanity check (IPv4-ish).
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return null;

  return `http://${ip}:4000`;
};

// IMPORTANT:
// Android Emulator should always use 10.0.2.2 to reach your computer.
// Using a LAN IP (e.g. 192.168.x.x) can fail inside the emulator depending on network setup.
const isAndroidEmulator = Platform.OS === "android" && Constants.isDevice === false;

const LAN_URL = !isAndroidEmulator ? guessLanApiUrl() : null;

const DEV_URL = (LAN_URL ||
  Platform.select({
    android: "http://10.0.2.2:4000",
    ios: "http://localhost:4000",
    default: "http://localhost:4000",
  })) as string;

export const API_URL = ENV_URL || (__DEV__ ? DEV_URL : "https://tap-soran-api.onrender.com");
