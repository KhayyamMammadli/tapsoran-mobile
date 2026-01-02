import { Platform } from "react-native";

/**
 * API_URL necə seçilməlidir:
 * - iOS simulator: http://localhost:4000
 * - Android emulator: http://10.0.2.2:4000
 * - Real telefon: http://<PC_LAN_IP>:4000 (məs: http://192.168.1.10:4000)
 *
 * Default olaraq:
 * - iOS: localhost
 * - Android: 10.0.2.2
 */
export const API_URL = Platform.select({
  ios: "http://localhost:4000",
  android: "http://10.0.2.2:4000",
  default: "http://localhost:4000",
}) as string;
