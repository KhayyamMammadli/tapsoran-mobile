import React from "react";
import { View, FlatList } from "react-native";
import { useTheme, Text, Card, Button, Chip } from "react-native-paper";
import { api } from "../lib/api";
import type { NotificationItem } from "../types";
import { useFocusEffect } from "@react-navigation/native";
import { useBadges } from "../state/BadgeContext";

export function NotificationsScreen() {
  const theme = useTheme();
  const { syncFromNotifications } = useBadges();
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<NotificationItem[]>("/notifications");
      setItems(r.data);
      // Update tab badge counts from the same payload (avoid extra request)
      syncFromNotifications(r.data || []);
    } finally {
      setLoading(false);
    }
  }, [syncFromNotifications]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    await load();
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: theme.colors.background }}>
      <Card style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleLarge" style={{ fontWeight: "900" }}>
            Bildirişlər
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Bloklama səbəbi və digər sistem bildirişləri burada görünəcək.
          </Text>
          <Button mode="contained" onPress={markAllRead} disabled={!items.some((x) => !x.readAt)}>
            Hamısını oxundu et
          </Button>
        </Card.Content>
      </Card>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ gap: 12, paddingBottom: 90 }}
        renderItem={({ item }) => (
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {!item.readAt ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.error,
                      }}
                    />
                  ) : null}
                  <Text style={{ fontWeight: "900" }}>{item.title}</Text>
                </View>

                <Chip
                  compact
                  style={!item.readAt ? { backgroundColor: theme.colors.errorContainer } : undefined}
                  textStyle={!item.readAt ? { color: theme.colors.onErrorContainer } : undefined}
                >
                  {item.readAt ? "Oxundu" : "Yeni"}
                </Chip>
              </View>
              <Text>{item.body}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 16 }}>
            Bildiriş yoxdur
          </Text>
        }
      />
    </View>
  );
}
