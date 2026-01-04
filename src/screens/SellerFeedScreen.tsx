import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { api } from "../lib/api";
import { RequestItem } from "../types";
import { getSocket } from "../lib/socket";
import { useNavigation } from "@react-navigation/native";

export function SellerFeedScreen() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const nav = useNavigation<any>();

  const load = async () => {
    const res = await api.get("/requests/feed");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const onNew = (req: RequestItem) => {
      setItems((prev) => [req, ...prev]);
    };

    s.on("new_request", onNew);
    return () => {
      s.off("new_request", onNew);
    };
  }, []);

  const accept = async (requestId: string) => {
    try {
      const res = await api.post(`/requests/${requestId}/accept`);
      const convId = res.data.conversation?.id;
      if (convId) nav.navigate("Chat", { conversationId: convId });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Qəbul alınmadı");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 8 }}>Sorğu axını</Text>

      <FlatList style={{ flex: 1 }}
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Card>
            <Card.Title title={item.title} subtitle={`Kateqoriya: ${item.category?.name || ""}`} />
            <Card.Content>
              <Text>Alıcı: {item.buyer?.fullName || "—"}</Text>
              <Text>Əhatə: {item.scope === "ALL_SELLERS" ? "Bütün satıcılar" : "Kateqoriya satıcıları"}</Text>
              {item.accepted ? <Text style={{ marginTop: 6 }}>Vəziyyət: Qəbul edilib</Text> : null}
            </Card.Content>
            {!item.accepted ? (
              <Card.Actions>
                <Button mode="contained" onPress={() => accept(item.id)}>Qəbul et</Button>
              </Card.Actions>
            ) : null}
          </Card>
        )}
      />
    </View>
  );
}
