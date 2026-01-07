import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Screen } from "../components/Screen";
import { HeroHeader } from "../components/HeroHeader";
import { api } from "../lib/api";
import { useNavigation } from "@react-navigation/native";

type MyRequest = {
  id: string;
  title: string;
  imageUrl?: string | null;
  scope: "ALL_SELLERS" | "CATEGORY_SELLERS";
  createdAt: string;
  category?: { id: string; name: string };
  accepted?: null | {
    id: string;
    createdAt: string;
    seller?: { id: string; fullName: string; avatarUrl?: string | null };
    conversation?: { id: string } | null;
  };
};

export function BuyerHomeScreen() {
  const theme = useTheme();
  const nav = useNavigation<any>();

  const [rows, setRows] = React.useState<MyRequest[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<MyRequest[]>("/requests/mine");
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <HeroHeader
        title="Sorğularım"
        subtitle="Yeni sorğu yaratmaq üçün aşağıdakı + düyməsinə toxunun."      />

      <ScrollView
        contentContainerStyle={{ gap: 12, paddingBottom: 14 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {rows.length === 0 ? (
          <Card mode="contained" style={{ borderRadius: 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleMedium">Hələ sorğunuz yoxdur</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Aşağıdakı + düyməsi ilə ilk sorğunu yaradın.
              </Text>
              <Button mode="outlined" onPress={load}>Yenilə</Button>
            </Card.Content>
          </Card>
        ) : (
          rows.map((r) => {
            const accepted = !!r.accepted;
            const conversationId = r.accepted?.conversation?.id;
            return (
              <Card
                key={r.id}
                mode="contained"
                onPress={() => {
                  if (conversationId) nav.navigate("Chat", { conversationId });
                }}
                style={{
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  opacity: conversationId ? 1 : 0.98,
                }}
              >
                <Card.Content style={{ gap: 8 }}>
                  <Text variant="titleMedium">{r.title}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {r.category?.name ? <Chip>{r.category.name}</Chip> : null}
                    <Chip>{r.scope === "ALL_SELLERS" ? "Bütün satıcılar" : "Kateqoriya satıcıları"}</Chip>
                    {accepted ? (
                      <Chip icon="check" textStyle={{ color: theme.colors.onPrimary }} style={{ backgroundColor: theme.colors.primary }}>
                        Qəbul edilib
                      </Chip>
                    ) : (
                      <Chip icon="clock-outline">Gözləyir</Chip>
                    )}
                  </View>

                  {accepted ? (
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                      Satıcı: {r.accepted?.seller?.fullName || "-"}
                    </Text>
                  ) : (
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                      Satıcı sorğunu qəbul etdikdə buradan birbaşa çata keçə biləcəksiniz.
                    </Text>
                  )}

                  {conversationId ? (
                    <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>
                      Çata keçmək üçün toxun
                    </Text>
                  ) : null}
                </Card.Content>
              </Card>
            );
          })
        )}

        <Card mode="contained" style={{ borderRadius: 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }}>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">Necə işləyir?</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              1) + düyməsi ilə sorğu yaradın{`\n`}
              2) Satıcılar sorğunu qəbul etsin{`\n`}
              3) Çatda razılaşın və alış edin
            </Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={{ borderRadius: 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }}>
          <Card.Content style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleMedium">Məsləhət</Text>
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Daha tez cavab almaq üçün məhsulun şəklini əlavə et və doğru kateqoriya seç.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </Screen>
  );
}
