import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { NotificationItem } from "../types";
import { useAuth } from "./AuthContext";

type BadgeState = {
  unreadNotifs: number;
  unreadChats: number;
  refresh: () => Promise<void>;
  markMessageNotifsRead: () => Promise<void>;
  /** Update counters from already-fetched notifications list */
  syncFromNotifications: (items: NotificationItem[]) => void;
};

const Ctx = createContext<BadgeState | null>(null);

export function useBadges() {
  const v = useContext(Ctx);
  if (!v) throw new Error("BadgeContext missing");
  return v;
}

function compute(items: NotificationItem[]) {
  const unread = items.filter((n) => !n.readAt).length;
  const unreadChats = items.filter((n) => !n.readAt && n.type === "MESSAGE").length;
  return { unread, unreadChats };
}

export function BadgeProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const lastUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !user) {
      setUnreadNotifs(0);
      setUnreadChats(0);
      return;
    }

    const r = await api.get<NotificationItem[]>("/notifications");
    const c = compute(r.data || []);
    setUnreadNotifs(c.unread);
    setUnreadChats(c.unreadChats);
  }, [token, user]);

  const syncFromNotifications = useCallback((items: NotificationItem[]) => {
    const c = compute(items || []);
    setUnreadNotifs(c.unread);
    setUnreadChats(c.unreadChats);
  }, []);

  const markMessageNotifsRead = useCallback(async () => {
    if (!token || !user) return;
    await api.post("/notifications/read-type", { type: "MESSAGE" });
    await refresh();
  }, [token, user, refresh]);

  // When auth changes, refresh once
  useEffect(() => {
    const currentUserId = user?.id || null;
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId;
      refresh().catch(() => {
        // ignore
      });
    }
  }, [user?.id, refresh]);

  // Real-time updates via socket
  useEffect(() => {
    if (!token || !user) return;
    const s = getSocket();
    if (!s) return;

    const onNew = (n: NotificationItem) => {
      if (n?.readAt) return;
      setUnreadNotifs((p) => p + 1);
      if (n?.type === "MESSAGE") setUnreadChats((p) => p + 1);
    };

    s.on("new_notification", onNew);
    return () => {
      s.off("new_notification", onNew);
    };
  }, [token, user?.id]);

  const value = useMemo(
    () => ({ unreadNotifs, unreadChats, refresh, markMessageNotifsRead, syncFromNotifications }),
    [unreadNotifs, unreadChats, refresh, markMessageNotifsRead, syncFromNotifications]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
