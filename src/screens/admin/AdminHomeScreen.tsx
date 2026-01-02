import React from "react";
import { View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { api } from "../../lib/api";
import { useFocusEffect } from "@react-navigation/native";

type Stats = { users: number; categories: number; requests: number; conversations: number };

export function AdminHomeScreen() {
  const theme = useTheme();
  const [stats, setStats] = React.useState<Stats | null>(null);

  const load = React.useCallback(async () => {
    const r = await api.get<Stats>("/admin/stats");
    setStats(r.data);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: theme.colors.background }}>
      <Card style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleLarge" style={{ fontWeight: "900" }}>
            Super Admin
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            İstifadəçilər, kateqoriyalar və chat nəzarəti.
          </Text>
        </Card.Content>
      </Card>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1, borderRadius: 18 }}>
          <Card.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Users</Text>
            <Text variant="headlineMedium" style={{ fontWeight: "900" }}>{stats?.users ?? "—"}</Text>
          </Card.Content>
        </Card>
        <Card style={{ flex: 1, borderRadius: 18 }}>
          <Card.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Chats</Text>
            <Text variant="headlineMedium" style={{ fontWeight: "900" }}>{stats?.conversations ?? "—"}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1, borderRadius: 18 }}>
          <Card.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Requests</Text>
            <Text variant="headlineMedium" style={{ fontWeight: "900" }}>{stats?.requests ?? "—"}</Text>
          </Card.Content>
        </Card>
        <Card style={{ flex: 1, borderRadius: 18 }}>
          <Card.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Categories</Text>
            <Text variant="headlineMedium" style={{ fontWeight: "900" }}>{stats?.categories ?? "—"}</Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}
