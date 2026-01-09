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
//
// NOTE: In some Expo SDK / Expo Go combinations, `Constants.isDevice` can be unreliable on emulators.
// So we add a couple of safe heuristics based on device/model names.
const anyC: any = Constants as any;
const deviceName = String(anyC?.deviceName || "");
const androidModel = String(anyC?.platform?.android?.model || "");
const androidDevice = String(anyC?.platform?.android?.device || "");

const isAndroidEmulator =
  Platform.OS === "android" &&
  (Constants.isDevice === false ||
    /emulator|sdk_gphone|google_sdk|android sdk built for/i.test(deviceName) ||
    /emulator|sdk_gphone|google_sdk|android sdk built for/i.test(androidModel) ||
    /emulator|sdk_gphone|google_sdk|android sdk built for/i.test(androidDevice));

const LAN_URL = !isAndroidEmulator ? guessLanApiUrl() : null;

const DEV_URL = (LAN_URL ||
  Platform.select({
    android: "http://10.0.2.2:4000",
    ios: "http://localhost:4000",
    default: "http://localhost:4000",
  })) as string;

// IMPORTANT:
// When running the app with Expo Go, __DEV__ is true.
// For most teams, you still want the app to talk to the deployed API by default.
// If you need to use a local backend, set EXPO_PUBLIC_API_URL explicitly.
//
// NOTE:
// A very common production misconfiguration is setting EXPO_PUBLIC_API_URL to something like:
//   https://your-api.onrender.com/auth
// or
//   https://your-api.onrender.com/api
// In our backend, routes are mounted at the root (e.g. /auth/login), so adding /auth or /api
// causes requests to hit protected middleware and return 401 Unauthorized.
const RAW_API_URL = (ENV_URL || "https://tap-soran-api.onrender.com").trim();
const STRIPPED_API_URL = RAW_API_URL.replace(/\/+$/, "").replace(/\/(api|auth)$/i, "");
export const API_URL = STRIPPED_API_URL;


// Separate legal/policy site (optional). If not provided, fall back to the API /legal routes.
// Example:
//   EXPO_PUBLIC_POLICY_URL=https://legal.yourdomain.com
const ENV_POLICY = String(process.env.EXPO_PUBLIC_POLICY_URL || "").trim();

export const POLICY_URL = ENV_POLICY || "";

export const policyLink = (type: "terms" | "privacy") => {
  const base = (POLICY_URL || `${API_URL.replace(/\/$/, "")}/legal`).replace(/\/$/, "");
  // If using the API fallback, it expects /legal/:type
  if (!POLICY_URL) return `${base}/${type.toUpperCase()}`;
  // If using the separate site, we serve /terms and /privacy at root.
  return `${base}/${type}`;
};
