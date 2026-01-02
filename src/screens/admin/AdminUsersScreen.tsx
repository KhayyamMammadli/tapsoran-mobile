import React from "react";
import { View, FlatList, Alert } from "react-native";
import { Button, Card, Chip, Text, TextInput, useTheme } from "react-native-paper";
import { api } from "../../lib/api";
import type { User } from "../../types";
import { useFocusEffect } from "@react-navigation/native";

export function AdminUsersScreen() {
  const theme = useTheme();
  const [items, setItems] = React.useState<User[]>([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<User[]>("/admin/users");
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const filtered = items.filter((u) => {
    const t = `${u.fullName} ${u.email}`.toLowerCase();
    return t.includes(q.trim().toLowerCase());
  });

  const block = async (id: string, reason: string) => {
    await api.patch(`/admin/users/${id}/block`, { reason });
    await load();
  };

  const unblock = async (id: string) => {
    await api.patch(`/admin/users/${id}/unblock`);
    await load();
  };

  const removeUser = async (id: string) => {
    await api.delete(`/admin/users/${id}`);
    await load();
  };

  // simple prompt-less reason UI (minimal): uses built-in prompt on web only; for RN we make inline reason field per item via modal.
  const [reasonOpen, setReasonOpen] = React.useState(false);
  const [target, setTarget] = React.useState<User | null>(null);
  const [reason, setReason] = React.useState("");

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Card style={{ borderRadius: 18, marginBottom: 12 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleLarge" style={{ fontWeight: "900" }}>
            İstifadəçilər
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Axtar (ad / email)"
            value={q}
            onChangeText={setQ}
          />
        </Card.Content>
      </Card>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ gap: 12, paddingBottom: 90 }}
        renderItem={({ item }) => (
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text style={{ fontWeight: "900" }} numberOfLines={1}>
                {item.fullName}
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                {item.email}
              </Text>

              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Chip compact>{item.role}</Chip>
                {item.blocked ? <Chip compact>BLOCKED</Chip> : <Chip compact>ACTIVE</Chip>}
              </View>

              {item.blocked ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  <Text style={{ fontWeight: "800" }}>Səbəb:</Text> {item.blockedReason || "-"}
                </Text>
              ) : null}

              <View style={{ flexDirection: "row", gap: 10 }}>
                {item.blocked ? (
                  <Button style={{ flex: 1 }} mode="contained" onPress={() => unblock(item.id)}>
                    Blokdan çıxar
                  </Button>
                ) : (
                  <Button
                    style={{ flex: 1 }}
                    mode="contained"
                    buttonColor={theme.colors.error}
                    onPress={() => {
                      setTarget(item);
                      setReason("");
                      setReasonOpen(true);
                    }}
                  >
                    Blokla
                  </Button>
                )}

                <Button
                  style={{ flex: 1 }}
                  mode="outlined"
                  textColor={theme.colors.error}
                  disabled={item.role === "SUPER_ADMIN"}
                  onPress={() => {
                    Alert.alert(
                      "İstifadəçini sil",
                      `${item.fullName}\n${item.email}\n\nBu əməliyyat geri qaytarılmır. İstifadəçinin sorğuları, chat-ləri, mesajları və bildirişləri silinəcək.`,
                      [
                        { text: "Ləğv", style: "cancel" },
                        {
                          text: "Sil",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await removeUser(item.id);
                            } catch {
                              Alert.alert("Xəta", "Silmək alınmadı");
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  Sil
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 16 }}>
            —
          </Text>
        }
      />

      {/* Reason bottom card (simple modal substitute) */}
      {reasonOpen ? (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 90,
          }}
        >
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ gap: 10 }}>
              <Text style={{ fontWeight: "900" }}>
                Blok səbəbi: {target?.fullName}
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Məs: Qaydaları pozdu..."
                value={reason}
                onChangeText={setReason}
                multiline
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button style={{ flex: 1 }} onPress={() => setReasonOpen(false)}>
                  Ləğv
                </Button>
                <Button
                  style={{ flex: 1 }}
                  mode="contained"
                  buttonColor={theme.colors.error}
                  disabled={!reason.trim()}
                  onPress={async () => {
                    if (!target) return;
                    await block(target.id, reason.trim());
                    setReasonOpen(false);
                  }}
                >
                  Blokla
                </Button>
              </View>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                Bu səbəb user-ə bildiriş kimi gedəcək.
              </Text>
            </Card.Content>
          </Card>
        </View>
      ) : null}
    </View>
  );
}
