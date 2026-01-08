import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { Button, Card, Text, ActivityIndicator, useTheme, Portal, Dialog, TextInput } from "react-native-paper";
import { Screen } from "../components/Screen";
import { HeroHeader } from "../components/HeroHeader";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import type { RequestItem } from "../types";
import { useToast } from "../state/ToastContext";
import { API_URL } from "../config";
import { Image3DPreview } from "../components/Image3DPreview";
import { ReportUserDialog } from "../components/ReportUserDialog";
import * as ImagePicker from "expo-image-picker";

const PAGE_SIZE = 5;

function joinUrl(base: string, path?: string | null) {
  if (!path) return null;
  const b = base.replace(/\/$/, "");
  const p = String(path).startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export function SellerHomeScreen() {
  const theme = useTheme();
  const toast = useToast();

  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptId, setAcceptId] = useState<string | null>(null);
  const [acceptItem, setAcceptItem] = useState<RequestItem | null>(null);
  const [note, setNote] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptImage, setAcceptImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; fullName?: string } | null>(null);
  const [reportRequestId, setReportRequestId] = useState<string | null>(null);

  const loadPage = useCallback(
    async ({ skip, append }: { skip: number; append: boolean }) => {
      try {
        const res = await api.get<RequestItem[]>("/requests/feed", {
          params: { take: PAGE_SIZE, skip },
        });

      // Backward-compatible fallback: if backend ignores pagination and returns more,
      // we still keep only the expected slice for smooth lazy-load UI.
      const page = Array.isArray(res.data) ? res.data : [];
      const slice = page.length > PAGE_SIZE ? page.slice(0, PAGE_SIZE) : page;

        setError(null);
        setHasMore(slice.length === PAGE_SIZE);
        setItems((prev) => (append ? [...prev, ...slice] : slice));
      } catch (e: any) {
        const msg = e?.response?.data?.error || "Sorğular yüklənmədi";
        setError(String(msg));
        // Stop infinite scrolling on errors
        setHasMore(false);
        if (!append) setItems([]);
      }
    },
    []
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    if (items.length === 0) return;
    if (!hasMore || loadingMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      await loadPage({ skip: items.length, append: true });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, refreshing, loadPage, items.length, items.length]);

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

  const openAccept = useCallback((request: RequestItem) => {
    setAcceptId(request.id);
    setAcceptItem(request);
    setNote("");
    setAcceptImage(null);
    setAcceptOpen(true);
  }, []);

  const pickAcceptCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İcazə tələb olunur", "Kamera ilə şəkil çəkmək üçün icazə verməlisiniz.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: true });
    if (!result.canceled) setAcceptImage(result.assets[0]);
  }, []);

  const pickAcceptGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İcazə tələb olunur", "Qalereyadan şəkil seçmək üçün icazə verməlisiniz.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.75, allowsEditing: true });
    if (!result.canceled) setAcceptImage(result.assets[0]);
  }, []);

  const doAccept = useCallback(async () => {
    if (!acceptId) return;
    const n = note.trim();
    if (n.length < 2) {
      toast.show("Qısa qeyd yazın");
      return;
    }
    setAccepting(true);
    try {
      const form = new FormData();
      form.append("note", n);
      if (acceptImage?.uri) {
        // @ts-ignore
        form.append("image", {
          uri: acceptImage.uri,
          name: acceptImage.fileName || "seller.jpg",
          type: acceptImage.mimeType || "image/jpeg",
        });
      }
      await api.post(`/requests/${acceptId}/accept`, form, { headers: { "Content-Type": "multipart/form-data" } });
      setAcceptOpen(false);
      setAcceptId(null);
      setAcceptItem(null);
      setAcceptImage(null);
      await loadInitial();
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Sorğu qəbul edilə bilmədi";
      toast.show(String(msg));
    } finally {
      setAccepting(false);
    }
  }, [acceptId, note, acceptImage, loadInitial]);

  const header = useMemo(
    () => (
      <View style={{ gap: 12 }}>
        <HeroHeader
          title="Satıcı kabineti"
          subtitle="Sizə uyğun sorğuları burada görə bilərsiniz. Sorğunu qəbul etdikdən sonra alıcı sizin əlaqə məlumatlarınızı görəcək." 
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
    <>
    {/* NOTE: This screen uses FlatList (VirtualizedList). It must NOT be wrapped
        in a ScrollView (Screen's default behavior), otherwise RN warns and
        windowing/infinite scroll can break. */}
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
              mode="elevated"
              style={{ borderRadius: 22 }}
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
                {item.imageUrl ? (
                  <View style={{ marginTop: 8 }}>
                    {joinUrl(API_URL, item.imageUrl) ? (
                      <Image3DPreview uri={joinUrl(API_URL, item.imageUrl)!} height={180} borderRadius={16} />
                    ) : null}
                    <Text style={{ marginTop: 6, color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                      3D görüntü: şəkli barmağınla hərəkət etdir.
                    </Text>
                  </View>
                ) : null}
                {item.accepted ? (
                  <Text style={{ marginTop: 6, color: theme.colors.primary }}>Status: Qəbul edilib</Text>
                ) : null}
              </Card.Content>
              {!item.accepted ? (
                <Card.Actions>
                  <Button mode="contained" onPress={() => openAccept(item)} style={{ borderRadius: 16 }}>
                    Qəbul et
                  </Button>
                  <Button
                    mode="text"
                    icon="alert-circle-outline"
                    onPress={() => {
                      setReportTarget({ id: item.buyerId, fullName: item.buyer?.fullName });
                      setReportRequestId(item.id);
                      setReportOpen(true);
                    }}
                    disabled={!item.buyerId}
                  >
                    Şikayət
                  </Button>
                </Card.Actions>
              ) : null}
              {item.accepted ? (
                <Card.Actions>
                  <Button
                    mode="text"
                    icon="alert-circle-outline"
                    onPress={() => {
                      setReportTarget({ id: item.buyerId, fullName: item.buyer?.fullName });
                      setReportRequestId(item.id);
                      setReportOpen(true);
                    }}
                    disabled={!item.buyerId}
                  >
                    Şikayət
                  </Button>
                </Card.Actions>
              ) : null}
            </Card>
          )}
          ListEmptyComponent={
            error ? (
              <Text style={{ color: theme.colors.error, textAlign: "center", marginTop: 16 }}>
                Xəta: {error}
              </Text>
            ) : (
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginTop: 16 }}>
                Hələlik sizə uyğun sorğu yoxdur.
              </Text>
            )
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
    <Portal>
      <Dialog
        visible={acceptOpen}
        onDismiss={() => {
          if (accepting) return;
          setAcceptOpen(false);
          setAcceptId(null);
          setAcceptItem(null);
          setAcceptImage(null);
        }}
        style={{ borderRadius: 26 }}
      >
        <Dialog.Title>
          <Text variant="titleLarge" style={{ fontWeight: "900" }}>
            Sorğunu qəbul et
          </Text>
        </Dialog.Title>

        <Dialog.Content>
          {acceptItem ? (
            <View
              style={{
                padding: 12,
                borderRadius: 18,
                backgroundColor: theme.colors.surfaceVariant,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontWeight: "900" }} numberOfLines={2}>
                {acceptItem.title}
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                {acceptItem.category?.name ? `Kateqoriya: ${acceptItem.category.name}` : "Kateqoriya: —"}
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                Alıcı: {acceptItem.buyer?.fullName || "—"}
              </Text>
            </View>
          ) : null}

          <Text style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
            Qısa, aydın qeyd yazın. Alıcı bu qeydi və sizin əlaqə məlumatlarınızı görəcək.
          </Text>

          <TextInput
            mode="outlined"
            label="Qeyd (məs: qiymət, çatdırılma, stok)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />

          <View style={{ height: 12 }} />

          <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: "800" }}>
            Şəkil (istəyə bağlı)
          </Text>

          {acceptImage?.uri ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              <Image3DPreview uri={acceptImage.uri} height={180} borderRadius={18} />
              <Button mode="text" onPress={() => setAcceptImage(null)} icon="close" textColor={theme.colors.error}>
                Şəkli sil
              </Button>
            </View>
          ) : (
            <View style={{ marginTop: 8, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.outlineVariant }}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Şəkil əlavə etsən, alıcı həm şəkli, həm də 3D effekti görəcək.
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Button mode="outlined" onPress={pickAcceptCamera} style={{ flex: 1, borderRadius: 16 }} icon="camera">
              Kamera
            </Button>
            <Button mode="outlined" onPress={pickAcceptGallery} style={{ flex: 1, borderRadius: 16 }} icon="image">
              Qalereya
            </Button>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            onPress={() => {
              if (accepting) return;
              setAcceptOpen(false);
              setAcceptId(null);
              setAcceptItem(null);
              setAcceptImage(null);
            }}
            disabled={accepting}
          >
            Ləğv et
          </Button>
          <Button mode="contained" onPress={doAccept} loading={accepting} disabled={accepting} style={{ borderRadius: 16 }}>
            Qəbul et
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>

    {reportTarget ? (
      <ReportUserDialog
        visible={reportOpen}
        onDismiss={() => {
          setReportOpen(false);
          setReportTarget(null);
          setReportRequestId(null);
        }}
        targetUser={reportTarget}
        requestId={reportRequestId}
      />
    ) : null}
    </>
  );
}
