import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";
import { Screen } from "../components/Screen";
import { HeroHeader } from "../components/HeroHeader";
import { api } from "../lib/api";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    sellerNote?: string | null;
    seller?: { id: string; fullName: string; avatarUrl?: string | null; phone?: string | null; whatsapp?: string | null };
  };
};

export function BuyerHomeScreen() {
  const theme = useTheme();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const insets = useSafeAreaInsets();

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

  // Extra bottom padding so the last card is never hidden behind the floating bottom bar.
  const bottomPad = 120 + Math.max(insets.bottom, 0);

  return (
    <Screen scroll={false}>
      <HeroHeader
        title="Sorğularım"
        subtitle="Sorğularınızı burada izləyin." />

      <ScrollView
        contentContainerStyle={{ gap: 12, paddingBottom: bottomPad }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        showsVerticalScrollIndicator={false}
      >
        {rows.length === 0 ? (
          <Card mode="elevated" style={{ borderRadius: 22 }}>
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
            return (
              <Card
                key={r.id}
                mode="elevated"
                onPress={() => {
                  nav.navigate("BuyerRequestDetail", { requestId: r.id });
                }}
                style={{
                  borderRadius: 22,
                  opacity: 0.98,
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
                      Satıcı sorğunu qəbul etdikdə buradan detallara baxa biləcəksiniz.
                    </Text>
                  )}

                  <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>
                    Detallara baxmaq üçün toxun
                  </Text>
                </Card.Content>
              </Card>
            );
          })
        )}

      </ScrollView>
    </Screen>
  );
}
