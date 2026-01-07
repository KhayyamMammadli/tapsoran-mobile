import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, setAuthErrorHandler } from "../lib/api";
import { Alert } from "react-native";
import { clearToken, clearUser, getToken, getUser, setToken, setUser, User } from "../lib/authStore";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { registerForPushNotificationsAsync } from "../lib/push";
import { usePrefs } from "./PreferencesContext";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: "BUYER" | "SELLER") => Promise<void>;
  /**
   * Register SHOULD NOT auto-login.
   * After success, UI should switch user to Login screen.
   */
  register: (payload: { role: "BUYER" | "SELLER"; fullName: string; email: string; password: string; categoryId?: string }) => Promise<void>;
  /** Update current user object (e.g. after avatar upload). Persists to secure storage. */
  updateUser: (patch: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthContext missing");
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { notificationsEnabled, notificationSound, notificationSoundKey } = usePrefs();
  const [token, setTok] = useState<string | null>(null);
  const [user, setUsr] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const blockOnceRef = useRef(false);

  const wireSocket = (t: string) => {
    const s = connectSocket(t);

    // Force logout if admin blocks the account while the user is online.
    s.off("userBlocked");
    s.on("userBlocked", (payload: any) => {
      if (blockOnceRef.current) return;
      blockOnceRef.current = true;

      const reason = payload?.reason ? `Səbəb: ${payload.reason}` : "Hesabınız bloklandı.";
      Alert.alert("Hesab bloklandı", `${reason}\n\nGirişiniz dayandırıldı.`, [
        {
          text: "OK",
          onPress: () => {
            void logout();
            blockOnceRef.current = false;
          },
        },
      ]);
    });

    // If the socket handshake fails due to blocked status, logout too.
    s.off("connect_error");
    s.on("connect_error", (e: any) => {
      const msg = String(e?.message || "").toLowerCase();
      if (msg.includes("blocked")) {
        if (blockOnceRef.current) return;
        blockOnceRef.current = true;
        Alert.alert("Hesab bloklandı", "Hesabınız bloklandığı üçün giriş dayandırıldı.", [
          {
            text: "OK",
            onPress: () => {
              void logout();
              blockOnceRef.current = false;
            },
          },
        ]);
      }
    });

    return s;
  };

  useEffect(() => {
    (async () => {
      const t = await getToken();
      const u = await getUser();
      setTok(t);
      setUsr(u);
      if (t) wireSocket(t);
      setLoading(false);
    })();
  }, []);

  // Register device for push notifications after login and send token to backend
  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      // If user disabled notifications, clear token on backend (best-effort)
      if (!notificationsEnabled) {
        try {
          await api.patch("/me/push-settings", {
            enabled: false,
            token: null,
            soundEnabled: notificationSound,
            soundKey: notificationSoundKey,
          });
        } catch {
          // ignore
        }
        return;
      }

      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) return;

      try {
        await api.patch("/me/push-settings", {
          enabled: true,
          token: pushToken,
          soundEnabled: notificationSound,
          soundKey: notificationSoundKey,
        });
      } catch {
        // ignore
      }
    })();
  }, [token, user?.id, notificationsEnabled, notificationSound, notificationSoundKey]);


  useEffect(() => {
    setAuthErrorHandler((info) => {
      if (info.type === "BLOCKED") {
        if (blockOnceRef.current) return;
        blockOnceRef.current = true;
        const reason = info.reason ? `Səbəb: ${info.reason}` : "Hesabınız bloklandı.";
        Alert.alert("Hesab bloklandı", `${reason}\n\nGirişiniz dayandırıldı.`, [
          {
            text: "OK",
            onPress: () => {
              void logout();
              blockOnceRef.current = false;
            },
          },
        ]);
      } else if (info.type === "UNAUTHORIZED") {
        // Token expired / invalid; take user back to login.
        void logout();
      }
    });

    return () => setAuthErrorHandler(null);
  }, []);

  // NOTE: Backend enforces role for non-super-admin users.
  // Mobile must send the selected role (BUYER/SELLER) during login.
  const login = async (email: string, password: string, role: "BUYER" | "SELLER") => {
    const res = await api.post("/auth/login", { email, password, role });
    await setToken(res.data.token);
    await setUser(res.data.user);
    setTok(res.data.token);
    setUsr(res.data.user);
    disconnectSocket();
    wireSocket(res.data.token);
  };

  const register = async (payload: { role: "BUYER" | "SELLER"; fullName: string; email: string; password: string; categoryId?: string }) => {
    // IMPORTANT: registration should NOT auto-login.
    // Backend may return token/user, but we intentionally ignore it.
    await api.post("/auth/register", payload);
  };

  const updateUser = async (patch: Partial<User>) => {
    setUsr((prev) => {
      const next = { ...(prev || ({} as User)), ...patch } as User;
      void setUser(next);
      return next;
    });
  };

  const logout = async () => {
    disconnectSocket();
    await clearToken();
    await clearUser();
    setTok(null);
    setUsr(null);
  };

  const value = useMemo(() => ({ token, user, loading, login, register, updateUser, logout }), [token, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
