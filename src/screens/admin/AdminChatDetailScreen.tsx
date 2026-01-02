import React from "react";
import { View, FlatList } from "react-native";
import { Button, Card, Text, TextInput, useTheme, Chip } from "react-native-paper";
import { api } from "../../lib/api";

export function AdminChatDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { id } = route.params;

  const [conv, setConv] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/conversations/${id}/messages`);
      setConv(r.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const [reasonOpen, setReasonOpen] = React.useState(false);
  const [blockUserId, setBlockUserId] = React.useState<string | null>(null);
  const [blockUserLabel, setBlockUserLabel] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  const block = async () => {
    if (!blockUserId) return;
    await api.patch(`/admin/users/${blockUserId}/block`, { reason: reason.trim() });
    setReasonOpen(false);
    setReason("");
    await load();
  };

  if (!conv) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <Text>{loading ? "Yüklənir..." : "Tapılmadı"}</Text>
      </View>
    );
  }

  const a = conv.userA;
  const b = conv.userB;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 16, gap: 10 }}>
        <Card style={{ borderRadius: 18 }}>
          <Card.Content style={{ gap: 8 }}>
            <Text style={{ fontWeight: "900" }}>İştirakçılar</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Chip compact>{a.fullName}</Chip>
              <Chip compact>{b.fullName}</Chip>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                mode="contained"
                buttonColor={theme.colors.error}
                onPress={() => { setBlockUserId(a.id); setBlockUserLabel(a.fullName); setReason(""); setReasonOpen(true); }}
              >
                {a.fullName} blokla
              </Button>
              <Button
                mode="contained"
                buttonColor={theme.colors.error}
                onPress={() => { setBlockUserId(b.id); setBlockUserLabel(b.fullName); setReason(""); setReasonOpen(true); }}
              >
                {b.fullName} blokla
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>

      <FlatList
        data={conv.messages || []}
        keyExtractor={(m: any) => m.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 140 }}
        renderItem={({ item }: any) => (
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ gap: 6 }}>
              <Text style={{ fontWeight: "900" }}>{item.sender?.fullName || item.senderId}</Text>
              <Text>{item.text}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>Mesaj yoxdur</Text>}
      />

      {reasonOpen ? (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 90 }}>
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ gap: 10 }}>
              <Text style={{ fontWeight: "900" }}>Blok səbəbi: {blockUserLabel}</Text>
              <TextInput
                mode="outlined"
                placeholder="Səbəbi yaz"
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
                  onPress={block}
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
