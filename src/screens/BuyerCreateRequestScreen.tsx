import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Button,
  Card,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SelectField } from "../components/SelectField";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../components/Screen";
import { HeroHeader } from "../components/HeroHeader";
import { Image3DPreview } from "../components/Image3DPreview";
import { retryGet } from "../lib/http";
import { Category, RequestScope } from "../types";
import { useToast } from "../state/ToastContext";

export function BuyerCreateRequestScreen() {
  const theme = useTheme();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<RequestScope>("CATEGORY_SELLERS");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [catLoading, setCatLoading] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);

  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sending, setSending] = useState(false);

  const loadCategories = useCallback(async () => {
    setCatErr(null);
    setCatLoading(true);
    try {
      const data = await retryGet<Category[]>("/categories", {
        retries: 3,
        baseDelayMs: 1000,
        params: { t: Date.now() },
      });

      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      setCategoryId((prev) => prev || list?.[0]?.id || "");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Kateqoriyalar yüklənmədi";
      setCatErr(String(msg));
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İcazə tələb olunur", "Kamera ilə şəkil çəkmək üçün icazə verməlisiniz.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: true });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İcazə tələb olunur", "Qalereyadan şəkil seçmək üçün icazə verməlisiniz.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.75, allowsEditing: true });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    if (scope === "CATEGORY_SELLERS" && !categoryId) return;

    setSending(true);
    try {
      const form = new FormData();
      form.append("title", t);
      form.append("scope", scope);
      // categoryId is required only for CATEGORY_SELLERS
      if (scope === "CATEGORY_SELLERS") form.append("categoryId", categoryId);

      if (image?.uri) {
        // @ts-ignore
        form.append("image", {
          uri: image.uri,
          name: image.fileName || "photo.jpg",
          type: image.mimeType || "image/jpeg",
        });
      }

      const { api } = await import("../lib/api");
      await api.post("/requests", form, { headers: { "Content-Type": "multipart/form-data" } });

      setTitle("");
      setImage(null);
      toast.show("Sorğu göndərildi. Uyğun satıcı qəbul etdikdə sizə bildiriş gələcək.");
    } catch (e: any) {
      toast.show(e?.response?.data?.error || "Sorğu göndərilmədi");
    } finally {
      setSending(false);
    }
  };

  const previewUri = useMemo(() => (image ? image.uri : null), [image]);
  const canSubmit = title.trim().length >= 2 && (scope === "ALL_SELLERS" || !!categoryId);

  return (
    <Screen>
      <HeroHeader
        title="Sorğu yarat"
        subtitle="Məhsulu qısa və dəqiq yaz. Şəkil əlavə etsən, daha tez cavab alacaqsan."
      />

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">Məhsul</Text>
          <TextInput
            mode="outlined"
            label="Məhsul adı (məs: iPhone 13 128GB)"
            value={title}
            onChangeText={setTitle}
            left={<TextInput.Icon icon="magnify" />}
          />
        </Card.Content>
      </Card>

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">Kimə göndərilsin?</Text>
          <SegmentedButtons
            value={scope}
            onValueChange={(v) => setScope(v as RequestScope)}
            buttons={[
              { value: "CATEGORY_SELLERS", label: "Kateqoriya" },
              { value: "ALL_SELLERS", label: "Hamı" },
            ]}
          />

          {scope === "CATEGORY_SELLERS" ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Kateqoriya seç</Text>
                <Button mode="text" compact onPress={loadCategories} loading={catLoading}>
                  Yenilə
                </Button>
              </View>

              {catErr ? (
                <HelperText type="error" visible>
                  {catErr}
                </HelperText>
              ) : null}

              <SelectField
                label="Kateqoriya"
                value={categoryId}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                placeholder={catLoading ? "Yüklənir..." : "Kateqoriya seçin"}
                disabled={catLoading || categories.length === 0}
                onChange={(v) => setCategoryId(v)}
              />

              {!catLoading && categories.length === 0 && !catErr ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Kateqoriya tapılmadı. Yenilə düyməsini yoxla.
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Sorğunuz bütün satıcılara gedəcək.
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="image" size={18} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium">Şəkil (istəyə görə)</Text>
          </View>

          {previewUri ? (
            <Image3DPreview uri={previewUri} height={220} borderRadius={18} />
          ) : (
            <View
              style={{
                height: 150,
                borderRadius: 18,
                backgroundColor: theme.colors.surfaceVariant,
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <MaterialCommunityIcons name="camera-plus-outline" size={30} color={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Şəkil əlavə et</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button mode="outlined" onPress={pickFromCamera} style={{ flex: 1, borderRadius: 16 }} icon="camera">
              Kamera
            </Button>
            <Button mode="outlined" onPress={pickFromGallery} style={{ flex: 1, borderRadius: 16 }} icon="image">
              Qalereya
            </Button>
          </View>

          {image ? (
            <Button mode="text" onPress={() => setImage(null)} icon="close" textColor={theme.colors.error}>
              Şəkli sil
            </Button>
          ) : null}
        </Card.Content>
      </Card>

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">Hazırsan?</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Dəqiq başlıq + uyğun kateqoriya = daha tez cavab.
          </Text>
          <Button
            mode="contained"
            onPress={submit}
            loading={sending}
            disabled={!canSubmit}
            style={{ borderRadius: 16, paddingVertical: 6 }}
            icon="send"
          >
            Sorğunu göndər
          </Button>
        </Card.Content>
      </Card>
    </Screen>
  );
}
