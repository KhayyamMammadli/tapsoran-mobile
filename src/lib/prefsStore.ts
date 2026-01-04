import * as SecureStore from "expo-secure-store";

const PREFS_KEY = "br_prefs_v1";

export type ChatFont = "SYSTEM" | "SERIF" | "MONO";

export type NotificationSound = "DEFAULT" | "CHIME" | "DING" | "POP";

export type Prefs = {
  chatFont: ChatFont;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  notificationSoundKey: NotificationSound;
  locationEnabled: boolean;
  avatarUri: string | null;
};

export const DEFAULT_PREFS: Prefs = {
  chatFont: "SYSTEM",
  notificationsEnabled: true,
  notificationSound: true,
  notificationSoundKey: "DEFAULT",
  locationEnabled: false,
  avatarUri: null,
};

export async function getPrefs(): Promise<Prefs> {
  const raw = await SecureStore.getItemAsync(PREFS_KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setPrefs(prefs: Prefs) {
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
}
