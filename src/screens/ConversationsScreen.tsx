import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Avatar, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../lib/api";
import { Conversation } from "../types";
import { useBadges } from "../state/BadgeContext";
import { useAuth } from "../state/AuthContext";
import { API_URL } from "../config";

function joinUrl(base: string, path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function previewText(c: Conversation) {
  const m = c.messages?.[0];
  if (!m) return "";
  if (m.type === "IMAGE") return m.text ? `📷 ${m.text}` : "📷 Şəkil";
  if (m.type === "AUDIO") return "🎤 Səs mesajı";
  if (m.type === "SYSTEM") return m.text ? `⚠️ ${m.text}` : "⚠️ Sistem mesajı";
  return (m.text || "").trim();
}

export function ConversationsScreen() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [q, setQ] = useState("");
  const nav = useNavigation<any>();
  const { markMessageNotifsRead } = useBadges();
  const { user } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const load = async () => {
    const res = await api.get("/conversations");
    setItems(res.data);
  };

  useEffect(() => {
    const onFocus = () => {
      load();
      markMessageNotifsRead().catch(() => {});
    };

    const unsub = nav.addListener("focus", onFocus);
    onFocus();
    return unsub;
  }, [nav, markMessageNotifsRead]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    const meId = user?.id;
    return items.filter((c) => {
      const other = c.userA?.id === meId ? c.userB : c.userA;
      const name = (other?.fullName || "").toLowerCase();
      const prev = previewText(c).toLowerCase();
      return name.includes(s) || prev.includes(s);
    });
  }, [items, q, user?.id]);

  // Creative but clean: brand-colored header + soft search pill
  const headerBg = theme.colors.primary;
  const bg = theme.dark ? "#0B141A" : theme.colors.background;
  const rowBorder = theme.dark ? "#1F2C34" : theme.colors.outlineVariant;
  const sub = theme.dark ? "#AEBAC1" : theme.colors.onSurfaceVariant;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={["bottom"]}>
      <View style={[styles.header, { backgroundColor: headerBg, paddingTop: Math.max(insets.top, 0) }]}>
        <View style={styles.headerRow}>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800", flex: 1 }}>Mesajlar</Text>
          <IconButton icon="dots-vertical" size={20} onPress={() => {}} iconColor="#FFFFFF" style={{ margin: 0 }} />
        </View>

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Axtar..."
          left={<TextInput.Icon icon="magnify" />}
          dense
          mode="flat"
          style={styles.search}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          theme={{ colors: { onSurfaceVariant: sub } }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(x) => x.id}
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: rowBorder, marginLeft: 86, opacity: 0.8 }} />
        )}
        contentContainerStyle={{ paddingBottom: 18 }}
        renderItem={({ item }) => {
          const meId = user?.id;
          const other = item.userA?.id === meId ? item.userB : item.userA;
          const name = other?.fullName || "İstifadəçi";
          const avatar = joinUrl(API_URL, other?.avatarUrl ?? null);
          const timeIso = item.messages?.[0]?.createdAt || item.createdAt;

          return (
            <Pressable
              onPress={() => nav.navigate("Chat", { conversationId: item.id })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
            >
              {avatar ? (
                <Avatar.Image size={54} source={{ uri: avatar }} />
              ) : (
                <Avatar.Text
                  size={54}
                  label={initials(name)}
                  style={{ backgroundColor: theme.dark ? "#1F2C34" : theme.colors.surfaceVariant }}
                  labelStyle={{ color: theme.dark ? "#E9EDEF" : theme.colors.onSurface }}
                />
              )}

              <View style={styles.mid}>
                <View style={styles.topLine}>
                  <Text numberOfLines={1} style={[styles.name, { color: theme.dark ? "#E9EDEF" : theme.colors.onSurface }]}>
                    {name}
                  </Text>
                  <Text style={[styles.time, { color: sub }]}>{fmtTime(timeIso)}</Text>
                </View>

                <Text numberOfLines={1} style={[styles.preview, { color: sub }]}>
                  {previewText(item) || ""}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 10 },
  search: {
    marginTop: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  mid: { flex: 1 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { flex: 1, fontSize: 16, fontWeight: "700" },
  time: { fontSize: 12 },
  preview: { marginTop: 4, fontSize: 13 },
});
