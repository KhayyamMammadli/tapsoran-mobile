import { Platform } from "react-native";
import Constants from "expo-constants";

let notificationsEnabled = true;
let notificationSound = true;

const defaultChannelId = "default";

/**
 * Expo Go (SDK 53+) no longer supports remote push notifications via expo-notifications.
 * We keep the app running by turning push features into no-ops in Expo Go.
 */
function isExpoGo() {
  return Constants.appOwnership === "expo";
}

async function loadNotifications() {
  // Dynamically import to avoid triggering Expo Go runtime errors/warnings at module load time.
  return await import("expo-notifications");
}

/**
 * Keep notification presentation (foreground) in sync with user settings.
 * NOTE: This affects foreground notifications; background behavior is defined by OS/push payload.
 */
export function applyNotificationBehavior(opts: { notificationsEnabled: boolean; notificationSound: boolean }) {
  notificationsEnabled = opts.notificationsEnabled;
  notificationSound = opts.notificationSound;

  if (isExpoGo()) return;

  // fire-and-forget: do not block UI
  void (async () => {
    const Notifications = await loadNotifications();

    // Android: configure channels (sound selection works via channelId on Android 8+).
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync(defaultChannelId, {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          sound: notificationSound ? undefined : null,
        });
      } catch {
        // ignore
      }
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => {
        if (!notificationsEnabled) {
          return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: notificationSound,
          shouldSetBadge: false,
        };
      },
    });
  })();
}

/**
 * Register for push notifications (returns Expo push token if available).
 * In Expo Go this returns null.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo()) return null;

  try {
    const Notifications = await loadNotifications();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any).easConfig?.projectId ||
      (Constants as any).expoConfig?.extra?.eas?.projectId;

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
