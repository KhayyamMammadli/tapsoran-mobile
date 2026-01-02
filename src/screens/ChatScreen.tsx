import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { api } from "../lib/api";
import { Message } from "../types";
import { getSocket } from "../lib/socket";
import { useAuth } from "../state/AuthContext";
import { Screen } from "../components/Screen";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export function ChatScreen({ route }: Props) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const theme = useTheme();

  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const load = async () => {
    const res = await api.get(`/conversations/${conversationId}/messages`);
    setMsgs(res.data);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  };

  useEffect(() => {
    load();
  }, [conversationId]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const onNew = (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      setMsgs((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    };

    s.on("new_message", onNew);
    return () => {
      s.off("new_message", onNew);
    };
  }, [conversationId]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      await api.post(`/conversations/${conversationId}/messages`, { text: t });
    } catch (e: any) {
      alert(e?.response?.data?.error || "Mesaj getmədi");
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(x) => x.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            const bg = mine ? theme.colors.primary : theme.colors.surface;
            const fg = mine ? "#fff" : theme.colors.onSurface;

            return (
              <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%" }}>
                <Card
                  mode="elevated"
                  style={{
                    borderRadius: 18,
                    backgroundColor: bg,
                  }}
                >
                  <Card.Content style={{ paddingVertical: 10, paddingHorizontal: 12, gap: 4 }}>
                    <Text style={{ color: fg }}>{item.text}</Text>
                    <Text style={{ color: mine ? "rgba(255,255,255,0.8)" : theme.colors.onSurfaceVariant, fontSize: 11 }}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </Card.Content>
                </Card>
              </View>
            );
          }}
        />

        <View style={{ flexDirection: "row", gap: 8, paddingTop: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            mode="outlined"
            placeholder="Mesaj..."
            value={text}
            onChangeText={setText}
          />
          <Button mode="contained" onPress={send} style={{ borderRadius: 16 }}>
            Göndər
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
