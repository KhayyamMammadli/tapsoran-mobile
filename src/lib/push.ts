import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

let notificationsEnabled = true;
let notificationSound = true;

/**
 * Keep notification presentation (foreground) in sync with user settings.
 * NOTE: This affects foreground notifications; background behavior is defined by OS/push payload.
 */
export function applyNotificationBehavior(opts: { notificationsEnabled: boolean; notificationSound: boolean }) {
  notificationsEnabled = opts.notificationsEnabled;
  notificationSound = opts.notificationSound;

  // Android: configure channels (sound selection works via channelId on Android 8+).
  if (Platform.OS === "android") {
    defaultChannelId =
      !notificationSound ? "silent" :
      notificationSoundKey === "CHIME" ? "sound_chime" :
      notificationSoundKey === "DING" ? "sound_ding" :
      notificationSoundKey === "POP" ? "sound_pop" : "default";

    const channels = [
      { id: "default", name: "Əsas bildirişlər", sound: "default" as any },
      { id: "silent", name: "Səssiz bildirişlər", sound: undefined as any },
      { id: "sound_chime", name: "Bildirişlər (Çınqıltı)", sound: "chime.wav" as any },
      { id: "sound_ding", name: "Bildirişlər (Zəng)", sound: "ding.wav" as any },
      { id: "sound_pop", name: "Bildirişlər (Pop)", sound: "pop.wav" as any },
    ];

    for (const c of channels) {
      void Notifications.setNotificationChannelAsync(c.id, {
        name: c.name,
        importance: Notifications.AndroidImportance.MAX,
        sound: c.sound,
      });
    }
  }
}

// Show notifications even when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: notificationsEnabled,
    shouldPlaySound: notificationsEnabled && notificationSound,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Expo Go (SDK 53+) doesn't support remote push on Android. Skip to avoid crashes/log spam.
    if ((Constants as any).appOwnership === "expo") return null;

    // Android requires a channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: notificationSound ? "default" : undefined,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    // In newer Expo SDKs, providing projectId is recommended/required for EAS builds.
    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const tokenRes = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenRes.data;
  } catch {
    return null;
  }
}


export function getDefaultNotificationChannelId() {
  return defaultChannelId;
}
