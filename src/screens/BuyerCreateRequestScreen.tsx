import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { Screen } from "../components/Screen";
import { Button, Card, HelperText, RadioButton, Text, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { retryGet } from "../lib/http";
import { Category, RequestScope } from "../types";
import { API_URL } from "../config";

export function BuyerCreateRequestScreen() {
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<RequestScope>("CATEGORY_SELLERS");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [catErr, setCatErr] = useState<string | null>(null);

  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sending, setSending] = useState(false);

  const loadCategories = useCallback(async () => {
    setCatErr(null);
    try {
      const data = await retryGet<Category[]>("/categories", {
        retries: 3,
        baseDelayMs: 1200,
        params: { t: Date.now() },
      });
      setCategories(data || []);
      setCategoryId((prev) => prev || data?.[0]?.id || "");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Kateqoriyalar yüklənmədi";
      setCatErr(String(msg));
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

  const pickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const submit = async () => {
    setSending(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("categoryId", categoryId);
      form.append("scope", scope);

      if (image) {
        // @ts-ignore
        form.append("image", {
          uri: image.uri,
          name: "photo.jpg",
          type: "image/jpeg",
        });
      }

      const { api } = await import("../lib/api");
      await api.post("/requests", form, { headers: { "Content-Type": "multipart/form-data" } });
      setTitle("");
      setImage(null);
      alert("Sorğu göndərildi");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Sorğu göndərilmədi");
    } finally {
      setSending(false);
    }
  };

  const previewUri = useMemo(() => (image ? image.uri : null), [image]);

  return (
    <ScrollView>
      <Screen>
        <Text variant="headlineMedium">Sorğu yarat</Text>

        <TextInput mode="outlined" label="Məhsul adı" value={title} onChangeText={setTitle} />

        <Card>
          <Card.Title title="Göndərmə tipi" />
          <Card.Content>
            <RadioButton.Group onValueChange={(v) => setScope(v as any)} value={scope}>
              <RadioButton.Item label="Bütün satıcılara" value="ALL_SELLERS" />
              <RadioButton.Item label="Yalnız seçilən kateqoriya satıcılarına" value="CATEGORY_SELLERS" />
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title="Kateqoriya" />
          <Card.Content>
            {catErr ? (
              <View style={{ gap: 8 }}>
                <HelperText type="error" visible>
                  {catErr}
                </HelperText>
                <Button onPress={loadCategories}>Yenilə</Button>
              </View>
            ) : null}

            <RadioButton.Group onValueChange={setCategoryId} value={categoryId}>
              {categories.map((c) => (
                <RadioButton.Item key={c.id} label={c.name} value={c.id} />
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title="Şəkil (optional)" />
          <Card.Content>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={{ width: "100%", height: 220, borderRadius: 5 }} />
            ) : null}
          </Card.Content>
          <Card.Actions>
            <Button onPress={pickImage}>Kamera</Button>
            <Button onPress={pickFromGallery}>Qalereya</Button>
            {image ? <Button onPress={() => setImage(null)}>Sil</Button> : null}
          </Card.Actions>
        </Card>

        <Button mode="contained" loading={sending} disabled={!title || !categoryId} onPress={submit}>
          Sorğunu göndər
        </Button>

        <Text variant="bodySmall" style={{ opacity: 0.7 }}>
          Server URL: {API_URL}
        </Text>
      </Screen>
    </ScrollView>
  );
}
