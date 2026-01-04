import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
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
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthContext missing");
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { notificationsEnabled } = usePrefs();
  const [token, setTok] = useState<string | null>(null);
  const [user, setUsr] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      const u = await getUser();
      setTok(t);
      setUsr(u);
      if (t) connectSocket(t);
      setLoading(false);
    })();
  }, []);

  // Register device for push notifications after login and send token to backend
  useEffect(() => {
    if (!token || !user) return;
    if (!notificationsEnabled) return;

    (async () => {
      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) return;

      try {
        await api.post("/me/push-token", { token: pushToken });
      } catch {
        // ignore
      }
    })();
  }, [token, user?.id, notificationsEnabled]);

  // NOTE: Backend enforces role for non-super-admin users.
  // Mobile must send the selected role (BUYER/SELLER) during login.
  const login = async (email: string, password: string, role: "BUYER" | "SELLER") => {
    const res = await api.post("/auth/login", { email, password, role });
    await setToken(res.data.token);
    await setUser(res.data.user);
    setTok(res.data.token);
    setUsr(res.data.user);
    disconnectSocket();
    connectSocket(res.data.token);
  };

  const register = async (payload: { role: "BUYER" | "SELLER"; fullName: string; email: string; password: string; categoryId?: string }) => {
    // IMPORTANT: registration should NOT auto-login.
    // Backend may return token/user, but we intentionally ignore it.
    await api.post("/auth/register", payload);
  };

  const logout = async () => {
    disconnectSocket();
    await clearToken();
    await clearUser();
    setTok(null);
    setUsr(null);
  };

  const value = useMemo(() => ({ token, user, loading, login, register, logout }), [token, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
