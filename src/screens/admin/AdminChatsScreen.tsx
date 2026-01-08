import React from "react";
import { View, FlatList } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";
import { api } from "../../lib/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export function AdminChatsScreen() {
  const theme = useTheme();
  const nav = useNavigation<any>();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<any[]>("/admin/conversations");
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

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ gap: 12, paddingBottom: 90 }}
        renderItem={({ item }) => (
          <Card mode="elevated" style={{ borderRadius: 22 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text style={{ fontWeight: "900" }}>Çat</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Chip compact>{item.userA?.fullName || item.userAId}</Chip>
                <Chip compact>{item.userB?.fullName || item.userBId}</Chip>
              </View>
              <Button mode="contained" onPress={() => nav.navigate("AdminChatDetail", { id: item.id })}>
                Bax
              </Button>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 16 }}>—</Text>
        }
      />
    </View>
  );
}
