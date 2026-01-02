import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { api } from "../lib/api";
import { Conversation } from "../types";
import { useNavigation } from "@react-navigation/native";
import { useBadges } from "../state/BadgeContext";

export function ConversationsScreen() {
  const [items, setItems] = useState<Conversation[]>([]);
  const nav = useNavigation<any>();
  const { markMessageNotifsRead } = useBadges();

  const load = async () => {
    const res = await api.get("/conversations");
    setItems(res.data);
  };

  useEffect(() => {
    const onFocus = () => {
      load();
      // When user enters Chats, mark message notifications as read
      markMessageNotifsRead().catch(() => {
        // ignore
      });
    };

    const unsub = nav.addListener("focus", onFocus);
    onFocus();

    return unsub;
  }, [nav, markMessageNotifsRead]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 8 }}>Chatlər</Text>

      <FlatList style={{ flex: 1 }}
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Card>
            <Card.Title title={`Conversation`} subtitle={new Date(item.createdAt).toLocaleString()} />
            <Card.Actions>
              <Button mode="contained" onPress={() => nav.navigate("Chat", { conversationId: item.id })}>
                Aç
              </Button>
            </Card.Actions>
          </Card>
        )}
      />
    </View>
  );
}
