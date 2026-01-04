import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { Button, Card, Text, ActivityIndicator, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Screen } from "../components/Screen";
import { HeroHeader } from "../components/HeroHeader";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { RequestItem } from "../types";

const PAGE_SIZE = 5;

export function SellerHomeScreen() {
  const theme = useTheme();
  const nav = useNavigation<any>();

  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(
    async ({ skip, append }: { skip: number; append: boolean }) => {
      const res = await api.get<RequestItem[]>("/requests/feed", {
        params: { take: PAGE_SIZE, skip },
      });

      // Backward-compatible fallback: if backend ignores pagination and returns more,
      // we still keep only the expected slice for smooth lazy-load UI.
      const page = Array.isArray(res.data) ? res.data : [];
      const slice = page.length > PAGE_SIZE ? page.slice(0, PAGE_SIZE) : page;

      setHasMore(slice.length === PAGE_SIZE);
      setItems((prev) => (append ? [...prev, ...slice] : slice));
    },
    []
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      await loadPage({ skip: 0, append: false });
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage({ skip: 0, append: false });
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      await loadPage({ skip: items.length, append: true });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, refreshing, loadPage, items.length]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

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

  const accept = useCallback(
    async (requestId: string) => {
      try {
        const res = await api.post(`/requests/${requestId}/accept`);
        const convId = res.data?.conversation?.id;
        if (convId) nav.navigate("Chat", { conversationId: convId });
        await loadInitial();
      } catch (e: any) {
        const msg = e?.response?.data?.error || "Sorğu qəbul edilə bilmədi";
        alert(msg);
      }
    },
    [nav, loadInitial]
  );

  const header = useMemo(
    () => (
      <View style={{ gap: 12 }}>
        <HeroHeader
          title="Satıcı kabineti"
          subtitle="Sizə uyğun sorğuları burada görə bilərsiniz. Sorğunu qəbul etdikdən sonra alıcı ilə yazışma başlaya bilər." 
        />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="titleMedium">Gələn sorğular</Text>
          <Button mode="text" onPress={onRefresh} compact>
            Yenilə
          </Button>
        </View>
      </View>
    ),
    [onRefresh]
  );

  return (
    // NOTE: This screen uses FlatList (VirtualizedList). It must NOT be wrapped
    // in a ScrollView (Screen's default behavior), otherwise RN warns and
    // windowing/infinite scroll can break.
    <Screen scroll={false}>
      {loading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>Yüklənir...</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 110 }}
          ListHeaderComponent={header}
          onEndReachedThreshold={0.35}
          onEndReached={onLoadMore}
          renderItem={({ item }) => (
            <Card
              mode="contained"
              style={{ borderRadius: 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }}
            >
              <Card.Title
                title={item.title}
                subtitle={`Kateqoriya: ${item.category?.name || "—"}`}
              />
              <Card.Content style={{ gap: 4 }}>
                <Text>Alıcı: {item.buyer?.fullName || "—"}</Text>
                <Text>
                  Əhatə: {item.scope === "ALL_SELLERS" ? "Bütün satıcılar" : "Kateqoriya satıcıları"}
                </Text>
                {item.accepted ? (
                  <Text style={{ marginTop: 6, color: theme.colors.primary }}>Status: Qəbul edilib</Text>
                ) : null}
              </Card.Content>
              {!item.accepted ? (
                <Card.Actions>
                  <Button mode="contained" onPress={() => accept(item.id)}>
                    Qəbul et
                  </Button>
                </Card.Actions>
              ) : null}
            </Card>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 16 }}>
              Hələlik sizə uyğun sorğu yoxdur.
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : !hasMore && items.length > 0 ? (
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 8 }}>
                Hamısı göstərildi
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}
