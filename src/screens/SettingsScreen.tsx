import React from "react";
import { Alert, View } from "react-native";
import { Avatar, Button, Card, Divider, List, Text, useTheme } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../components/Screen";
import { useAuth } from "../state/AuthContext";
import { usePrefs } from "../state/PreferencesContext";
import { useNavigation } from "@react-navigation/native";

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { avatarUri, setAvatarUri } = usePrefs();
  const navigation: any = useNavigation();

  const roleLabel = user?.role === "BUYER" ? "Alıcı" : user?.role === "SELLER" ? "Satıcı" : "Admin";

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
    const uri = res.assets?.[0]?.uri;
    if (uri) setAvatarUri(uri);
  };

  const removeAvatar = async () => {
    Alert.alert("Şəkli sil", "Profil şəklini silmək istəyirsiniz?", [
      { text: "Ləğv", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => setAvatarUri(null) },
    ]);
  };

  return (
    <Screen>
      <Card style={{ borderRadius: 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {avatarUri ? (
              <Avatar.Image size={64} source={{ uri: avatarUri }} />
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
            <Button mode="contained" onPress={pickAvatar} style={{ flex: 1, borderRadius: 5 }}>
              Şəkil seç
            </Button>
            <Button
              mode="outlined"
              onPress={removeAvatar}
              disabled={!avatarUri}
              style={{ flex: 1, borderRadius: 5 }}
            >
              Şəkli sil
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 12 }} />

      <Card style={{ borderRadius: 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }}>
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
