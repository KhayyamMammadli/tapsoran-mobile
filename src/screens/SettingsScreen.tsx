import React from "react";
import { Alert, Linking, View } from "react-native";
import { Avatar, Button, Card, Divider, List, Text, useTheme } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../components/Screen";
import { useAuth } from "../state/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { API_URL, policyLink } from "../config";

function joinUrl(base: string, path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export function SettingsScreen() {
  const { user, logout, updateUser } = useAuth();
  const theme = useTheme();
  const navigation: any = useNavigation();

  const roleLabel = user?.role === "BUYER" ? "Alıcı" : user?.role === "SELLER" ? "Satıcı" : "Admin";

  const openLegal = (type: "privacy" | "terms") => {
    Linking.openURL(policyLink(type)).catch(() => Alert.alert("Xəta", "Səhifə açıla bilmədi."));
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İcazə tələb olunur", "Şəkil seçmək üçün qalereya icazəsi verməlisiniz.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    // Upload avatar to backend so every user keeps their own image.
    const name = asset.fileName || `avatar-${Date.now()}.jpg`;
    const mime = asset.mimeType || "image/jpeg";

    const form = new FormData();
    // @ts-ignore
    form.append("avatar", { uri: asset.uri, name, type: mime });

    try {
      const up = await api.post("/me/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
      await updateUser({ avatarUrl: up.data.avatarUrl });
    } catch (e: any) {
      Alert.alert("Xəta", e?.response?.data?.error || "Profil şəkli yüklənmədi");
    }
  };

  const removeAvatar = async () => {
    Alert.alert("Şəkli sil", "Profil şəklini silmək istəyirsiniz?", [
      { text: "Ləğv", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/me/avatar");
            await updateUser({ avatarUrl: null });
          } catch (e: any) {
            Alert.alert("Xəta", e?.response?.data?.error || "Şəkil silinmədi");
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {user?.avatarUrl ? (
              <Avatar.Image size={64} source={{ uri: joinUrl(API_URL, user.avatarUrl) || undefined }} />
            ) : (
              <Avatar.Text
                size={64}
                label={(user?.fullName?.trim()?.[0] || "U").toUpperCase()}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium">{user?.fullName}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>{user?.email}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Rol: {roleLabel}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button mode="contained" onPress={pickAvatar} style={{ flex: 1, borderRadius: 16 }}>
              Şəkil seç
            </Button>
            <Button
              mode="outlined"
              onPress={removeAvatar}
              disabled={!user?.avatarUrl}
              style={{ flex: 1, borderRadius: 16 }}
            >
              Şəkli sil
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 12 }} />

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ padding: 0 }}>
          <List.Item
            title="Ayarlar"
            description="Çat yazı tipi, bildirişlər, lokasiya"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              const parent = navigation.getParent?.();
              (parent ?? navigation).navigate("Preferences");
            }}
          />
          <Divider />

          <List.Accordion
            title="Kömək"
            description="Necə işləyir və məsləhətlər"
            left={(props) => <List.Icon {...props} icon="help-circle-outline" />}
          >
            <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 12, gap: 8 }}>
              <Text variant="titleSmall">Necə işləyir?</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                1) Alıcı: + düyməsi ilə sorğu yaradın (şəkil əlavə etmək məcburi deyil).
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                2) Satıcılar sorğunu qəbul etdikdə əlaqə məlumatları avtomatik görünəcək.
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                3) Məhsulu aldıqdan sonra sorğunu tamamlayıb satıcıya rəy və reytinq verə bilərsiniz.
              </Text>

              <Divider />

              <Text variant="titleSmall">Məsləhətlər</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                • Doğru kateqoriya seçin ki, sorğu yalnız uyğun satıcılara getsin.
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                • Şəkil əlavə etsəniz, satıcı məhsulu daha dəqiq anlayır və daha tez cavab verir.
              </Text>
            </View>
          </List.Accordion>

          <Divider />
          <List.Item
            title="İstifadəçi qaydaları"
            description="Şərtlər və qaydalar"
            left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            onPress={() => openLegal("terms")}
          />
          <Divider />
          <List.Item
            title="Məxfilik siyasəti"
            description="Məxfilik və şəxsi məlumatlar"
            left={(props) => <List.Icon {...props} icon="shield-account-outline" />}
            onPress={() => openLegal("privacy")}
          />
          <Divider />
          <List.Item
            title="Çıxış"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={logout}
          />
        </Card.Content>
      </Card>
    </Screen>
  );
}
