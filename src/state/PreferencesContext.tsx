import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { DEFAULT_PREFS, type ChatFont, getPrefs, setPrefs, type Prefs } from "../lib/prefsStore";
import { applyNotificationBehavior } from "../lib/push";

type PrefsState = Prefs & {
  loading: boolean;
  setChatFont: (v: ChatFont) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNotificationSound: (v: boolean) => void;
  setNotificationSoundKey: (v: Prefs["notificationSoundKey"]) => void;
  setLocationEnabled: (v: boolean) => void;
  setAvatarUri: (uri: string | null) => void;
  chatFontFamily: string | undefined;
};

const Ctx = createContext<PrefsState | null>(null);

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("PreferencesContext missing");
  return v;
}

function mapChatFontFamily(chatFont: ChatFont): string | undefined {
  if (chatFont === "SYSTEM") return undefined;
  if (chatFont === "MONO") return Platform.OS === "ios" ? "Courier" : "monospace";
  // SERIF
  return Platform.OS === "ios" ? "Georgia" : "serif";
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [prefs, setLocal] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      const p = await getPrefs();
      setLocal(p);
      // Apply notification behavior on startup
      applyNotificationBehavior({
        notificationsEnabled: p.notificationsEnabled,
        notificationSound: p.notificationSound,
        notificationSoundKey: p.notificationSoundKey,
      });
      setLoading(false);
    })();
  }, []);

  const update = (next: Partial<Prefs>) => {
    setLocal((prev) => {
      const merged = { ...prev, ...next };
      void setPrefs(merged);
      // Notification behavior depends on prefs (keep in sync)
      if ("notificationsEnabled" in next || "notificationSound" in next) {
        applyNotificationBehavior({
          notificationsEnabled: merged.notificationsEnabled,
          notificationSound: merged.notificationSound,
        });
      }
      return merged;
    });
  };

  const value = useMemo<PrefsState>(() => {
    const chatFontFamily = mapChatFontFamily(prefs.chatFont);
    return {
      ...prefs,
      loading,
      chatFontFamily,
      setChatFont: (v) => update({ chatFont: v }),
      setNotificationsEnabled: (v) => update({ notificationsEnabled: v }),
      setNotificationSound: (v) => update({ notificationSound: v }),
      setNotificationSoundKey: (v) => update({ notificationSoundKey: v }),
      setLocationEnabled: (v) => update({ locationEnabled: v }),
      setAvatarUri: (uri) => update({ avatarUri: uri }),
    };
  }, [prefs, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
