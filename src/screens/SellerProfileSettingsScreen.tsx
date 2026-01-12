import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Checkbox, Divider, Text, TextInput, useTheme } from "react-native-paper";
import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { useToast } from "../state/ToastContext";

type Category = { id: string; name: string };

type SellerProfile = {
  id: string;
  city: string | null;
  district: string | null;
  sellerMinPrice: number | null;
  sellerMaxPrice: number | null;
  sellerCondition: "ANY" | "NEW" | "USED";
  isPremium: boolean;
  categoryIds: string[];
};

function toNullableInt(v: string): number | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.trunc(n));
}

export function SellerProfileSettingsScreen() {
  const theme = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [city, setCity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, profRes] = await Promise.all([
        api.get<Category[]>("/categories"),
        api.get<SellerProfile>("/me/seller-profile"),
      ]);

      setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);

      const p = profRes.data;
      setSelectedIds(Array.isArray(p?.categoryIds) ? p.categoryIds : []);
      setCity(p?.city || "");
      setDistrict(p?.district || "");
      setMinPrice(typeof p?.sellerMinPrice === "number" ? String(p.sellerMinPrice) : "");
      setMaxPrice(typeof p?.sellerMaxPrice === "number" ? String(p.sellerMaxPrice) : "");
    } catch (e: any) {
      Alert.alert("Xəta", e?.response?.data?.error || "Profil yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCategory = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return Array.from(s);
    });
  }, []);

  const onSave = useCallback(async () => {
    if (saving) return;

    const uniqueIds = Array.from(new Set(selectedIds)).filter(Boolean);
    if (!uniqueIds.length) {
      Alert.alert("Kateqoriya", "Ən az 1 kateqoriya seçin.");
      return;
    }

    const min = toNullableInt(minPrice);
    const max = toNullableInt(maxPrice);
    if (min !== null && max !== null && min > max) {
      Alert.alert("Qiymət aralığı", "Minimum qiymət maksimumdan böyük ola bilməz.");
      return;
    }

    setSaving(true);
    try {
      await api.patch("/me/seller-profile", {
        categoryIds: uniqueIds,
        city: city.trim() ? city.trim() : null,
        district: district.trim() ? district.trim() : null,
        sellerMinPrice: min,
        sellerMaxPrice: max,
      });
      toast.show("Saxlandı ✅");
    } catch (e: any) {
      Alert.alert("Xəta", e?.response?.data?.error || "Saxlanmadı");
    } finally {
      setSaving(false);
    }
  }, [city, district, maxPrice, minPrice, saving, selectedIds, toast]);

  if (loading) {
    return (
      <Screen>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Yüklənir...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 12 }}>
          <Text variant="titleMedium">Lokasiya</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              mode="outlined"
              label="Şəhər"
              value={city}
              onChangeText={setCity}
              style={{ flex: 1 }}
              outlineStyle={{ borderRadius: 16 }}
            />
            <TextInput
              mode="outlined"
              label="Rayon"
              value={district}
              onChangeText={setDistrict}
              style={{ flex: 1 }}
              outlineStyle={{ borderRadius: 16 }}
            />
          </View>

          <Divider />

          <Text variant="titleMedium">Qiymət aralığı (AZN)</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              mode="outlined"
              label="Minimum"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              style={{ flex: 1 }}
              outlineStyle={{ borderRadius: 16 }}
            />
            <TextInput
              mode="outlined"
              label="Maksimum"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              style={{ flex: 1 }}
              outlineStyle={{ borderRadius: 16 }}
            />
          </View>

          <Divider />

          <Text variant="titleMedium">Kateqoriyalar</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Sorğular yalnız seçdiyiniz kateqoriyalara görə sizə göndəriləcək.
          </Text>

          <ScrollView style={{ maxHeight: 360 }}>
            {categories.map((c) => (
              <Checkbox.Item
                key={c.id}
                label={c.name}
                status={selectedSet.has(c.id) ? "checked" : "unchecked"}
                onPress={() => toggleCategory(c.id)}
              />
            ))}
          </ScrollView>

          <Button
            mode="contained"
            onPress={onSave}
            loading={saving}
            disabled={saving}
            style={{ borderRadius: 16, marginTop: 4 }}
          >
            Saxla
          </Button>
        </Card.Content>
      </Card>
    </Screen>
  );
}
