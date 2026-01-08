import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Button, Card, Chip, Text, useTheme, ActivityIndicator, Dialog, Portal, TextInput, IconButton } from "react-native-paper";
import { Screen } from "../components/Screen";
import { Image3DPreview } from "../components/Image3DPreview";
import { ReportUserDialog } from "../components/ReportUserDialog";
import { api } from "../lib/api";
import { useToast } from "../state/ToastContext";
import { API_URL } from "../config";

type RouteParams = { requestId: string };

type RequestDetail = {
  id: string;
  title: string;
  imageUrl?: string | null;
  scope: "ALL_SELLERS" | "CATEGORY_SELLERS";
  createdAt: string;
  completedAt?: string | null;
  category?: { id: string; name: string };
  review?: null | { id: string; rating: number; comment?: string | null; createdAt: string };
  accepted?: null | {
    id: string;
    createdAt: string;
    sellerNote?: string | null;
    sellerImageUrl?: string | null;
    seller?: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
    };
  };
};

function joinUrl(base: string, path?: string | null) {
  if (!path) return null;
  const b = base.replace(/\/$/, "");
  const p = String(path).startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function digitsOnly(s: string) {
  return (s || "").replace(/[^0-9]/g, "");
}

export function BuyerRequestDetailScreen() {
  const theme = useTheme();
  const toast = useToast();
  const route = useRoute<any>();
  const { requestId } = (route.params || {}) as RouteParams;

  const [item, setItem] = React.useState<RequestDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [completing, setCompleting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const r = await api.get<RequestDetail>(`/requests/${requestId}`);
      setItem(r.data);
    } catch (e: any) {
      toast.show(e?.response?.data?.error || "Sorğu məlumatı yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, [requestId, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const phone = item?.accepted?.seller?.phone || "";
  const whatsapp = item?.accepted?.seller?.whatsapp || "";

  const callPhone = async () => {
    if (!phone) return;
    const url = `tel:${phone}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      toast.show("Zəng tətbiqi açıla bilmədi");
      return;
    }
    Linking.openURL(url).catch(() => toast.show("Zəng açıla bilmədi"));
  };

  const openWhatsApp = async () => {
    if (!whatsapp) return;
    const num = digitsOnly(whatsapp);
    // Prefer universal wa.me (works even if WhatsApp scheme is blocked)
    const url = `https://wa.me/${num}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      toast.show("WhatsApp link açıla bilmədi");
      return;
    }
    Linking.openURL(url).catch(() => toast.show("WhatsApp açıla bilmədi"));
  };

  const openCompleteDialog = () => {
    setRating(5);
    setComment("");
    setCompleteOpen(true);
  };

  const submitComplete = async () => {
    if (!item) return;
    setCompleting(true);
    try {
      await api.post(`/requests/${item.id}/complete`, {
        rating,
        comment: comment.trim(),
      });
      toast.show("Sorğu tamamlandı");
      setCompleteOpen(false);
      await load();
    } catch (e: any) {
      toast.show(e?.response?.data?.error || "Tamamlamaq mümkün olmadı");
    } finally {
      setCompleting(false);
    }
  };

  if (loading && !item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>Yüklənir...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <Screen>
        <Card mode="elevated" style={{ borderRadius: 22 }}>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">Sorğu tapılmadı</Text>
            <Button mode="outlined" onPress={load}>Yenidən yoxla</Button>
          </Card.Content>
        </Card>
      </Screen>
    );
  }

  const accepted = !!item.accepted;
  const completed = !!item.completedAt;
  const seller = item.accepted?.seller || null;
  const reqImage = joinUrl(API_URL, item.imageUrl || null);
  const sellerImage = joinUrl(API_URL, item.accepted?.sellerImageUrl || null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        <Card mode="elevated" style={{ borderRadius: 22 }}>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>{item.title}</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {item.category?.name ? <Chip>{item.category.name}</Chip> : null}
              <Chip>{item.scope === "ALL_SELLERS" ? "Bütün satıcılar" : "Kateqoriya satıcıları"}</Chip>
              {completed ? (
                <Chip icon="check-decagram" textStyle={{ color: theme.colors.onPrimary }} style={{ backgroundColor: theme.colors.primary }}>
                  Tamamlandı
                </Chip>
              ) : accepted ? (
                <Chip icon="check" textStyle={{ color: theme.colors.onPrimary }} style={{ backgroundColor: theme.colors.primary }}>
                  Qəbul edilib
                </Chip>
              ) : (
                <Chip icon="clock-outline">Gözləyir</Chip>
              )}
            </View>

            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        {reqImage ? (
          <Card mode="elevated" style={{ borderRadius: 22 }}>
            <Card.Content style={{ gap: 10 }}>
              <Text variant="titleMedium">Şəkil</Text>
              <Image3DPreview uri={reqImage} height={240} borderRadius={18} />
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                3D görüntü: şəkli barmağınla hərəkət etdir.
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {accepted ? (
          <>
            <Card mode="elevated" style={{ borderRadius: 22 }}>
              <Card.Content style={{ gap: 8 }}>
                <Text variant="titleMedium">Satıcı</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.accepted?.seller?.fullName || "—"}
                </Text>

                {item.accepted?.sellerNote ? (
                  <Card mode="elevated" style={{ borderRadius: 18, backgroundColor: theme.colors.surfaceVariant }}>
                    <Card.Content>
                      <Text style={{ fontWeight: "800" }}>Satıcının qeydi</Text>
                      <Text style={{ marginTop: 6 }}>{item.accepted.sellerNote}</Text>
                    </Card.Content>
                  </Card>
                ) : null}

                {sellerImage ? (
                  <Card mode="elevated" style={{ borderRadius: 18, backgroundColor: theme.colors.surfaceVariant }}>
                    <Card.Content style={{ gap: 8 }}>
                      <Text style={{ fontWeight: "800" }}>Satıcının göndərdiyi şəkil (3D)</Text>
                      <Image3DPreview uri={sellerImage} height={220} borderRadius={16} />
                      <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                        3D görüntü: şəkli barmağınla hərəkət etdir.
                      </Text>
                    </Card.Content>
                  </Card>
                ) : null}

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                  {!completed ? (
                    <Button
                      mode="contained-tonal"
                      icon="check-decagram"
                      onPress={openCompleteDialog}
                      disabled={completing}
                      style={{ borderRadius: 16 }}
                    >
                      Sorğunu tamamla
                    </Button>
                  ) : null}
                  <Button
                    mode="contained"
                    onPress={callPhone}
                    disabled={!phone}
                    style={{ borderRadius: 16 }}
                  >
                    Zəng et
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={openWhatsApp}
                    disabled={!whatsapp}
                    style={{ borderRadius: 16 }}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    mode="text"
                    icon="alert-circle-outline"
                    onPress={() => setReportOpen(true)}
                    disabled={!seller}
                    style={{ borderRadius: 16 }}
                  >
                    Şikayət et
                  </Button>
                </View>

                {completed && item.review ? (
                  <Card mode="elevated" style={{ borderRadius: 18, backgroundColor: theme.colors.surfaceVariant, marginTop: 10 }}>
                    <Card.Content style={{ gap: 8 }}>
                      <Text style={{ fontWeight: "900" }}>Sizin reyiniz</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <IconButton key={i} icon={i < item.review!.rating ? "star" : "star-outline"} size={18} disabled />
                        ))}
                        <Text style={{ color: theme.colors.onSurfaceVariant }}>{item.review.rating}/5</Text>
                      </View>
                      {item.review.comment ? <Text>{item.review.comment}</Text> : null}
                      <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                        {new Date(item.review.createdAt).toLocaleString()}
                      </Text>
                    </Card.Content>
                  </Card>
                ) : null}

                {!phone && !whatsapp ? (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Satıcı əlaqə məlumatı əlavə etməyib.
                  </Text>
                ) : (
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    Telefon: {phone || "—"}{"\n"}WhatsApp: {whatsapp || "—"}
                  </Text>
                )}

                {sellerImage ? (
                  <Card mode="elevated" style={{ borderRadius: 18, backgroundColor: theme.colors.surfaceVariant, marginTop: 10 }}>
                    <Card.Content style={{ gap: 10 }}>
                      <Text style={{ fontWeight: "800" }}>Satıcının göndərdiyi şəkil</Text>
                      <Image3DPreview uri={sellerImage} height={240} borderRadius={18} />
                      <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                        3D görüntü: şəkli barmağınla hərəkət etdir.
                      </Text>
                    </Card.Content>
                  </Card>
                ) : null}
              </Card.Content>
            </Card>
          </>
        ) : (
          <Card mode="elevated" style={{ borderRadius: 22 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleMedium">Status</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Hələ heç bir satıcı sorğunu qəbul etməyib.
              </Text>
              <Button mode="outlined" onPress={load} style={{ borderRadius: 16 }}>
                Yenilə
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      {seller ? (
        <ReportUserDialog
          visible={reportOpen}
          onDismiss={() => setReportOpen(false)}
          targetUser={{ id: seller.id, fullName: seller.fullName }}
          requestId={item.id}
        />
      ) : null}

      <Portal>
        <Dialog visible={completeOpen} onDismiss={() => (!completing ? setCompleteOpen(false) : null)} style={{ borderRadius: 22 }}>
          <Dialog.Title>Sorğunu tamamla</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10 }}>
              Satıcı haqqında rey və reytinq ver.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const v = i + 1;
                const filled = v <= rating;
                return (
                  <IconButton
                    key={v}
                    icon={filled ? "star" : "star-outline"}
                    onPress={() => setRating(v)}
                    disabled={completing}
                  />
                );
              })}
              <Text style={{ color: theme.colors.onSurfaceVariant }}>{rating}/5</Text>
            </View>
            <TextInput
              label="Qeyd (istəyə bağlı)"
              value={comment}
              onChangeText={setComment}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ marginTop: 6 }}
              editable={!completing}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCompleteOpen(false)} disabled={completing}>Ləğv et</Button>
            <Button mode="contained" onPress={submitComplete} loading={completing} disabled={completing}>
              Təsdiqlə
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}
