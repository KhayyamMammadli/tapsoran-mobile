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

  // Android: (re)configure channel. Safe to call multiple times.
  if (Platform.OS === "android") {
    void Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      sound: notificationSound ? "default" : undefined,
    });
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
