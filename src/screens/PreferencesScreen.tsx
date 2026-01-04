import React from "react";
import { Alert, View } from "react-native";
import { List, Switch, SegmentedButtons, Text, useTheme } from "react-native-paper";
import * as Location from "expo-location";
import { Screen } from "../components/Screen";
import { usePrefs } from "../state/PreferencesContext";

export function PreferencesScreen() {
  const theme = useTheme();
  const {
    chatFont,
    setChatFont,
    chatFontFamily,
    notificationsEnabled,
    setNotificationsEnabled,
    notificationSound,
    setNotificationSound,
    locationEnabled,
    setLocationEnabled,
  } = usePrefs();

  const toggleLocation = async (next: boolean) => {
    if (!next) {
      setLocationEnabled(false);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Lokasiya icazəsi",
        "Lokasiyanı aktivləşdirmək üçün icazə verməlisiniz. Telefon ayarlarından icazə verə bilərsiniz."
      );
      setLocationEnabled(false);
      return;
    }
    setLocationEnabled(true);
  };

  return (
    <Screen>
      <Text variant="headlineSmall" style={{ marginBottom: 10 }}>
        Ayarlar
      </Text>

      <List.Section>
        <List.Subheader>Çat</List.Subheader>
        <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
          <SegmentedButtons
            value={chatFont}
            onValueChange={(v) => setChatFont(v as any)}
            buttons={[
              { value: "SYSTEM", label: "Standart" },
              { value: "SERIF", label: "Serif" },
              { value: "MONO", label: "Mono" },
            ]}
          />
          <Text style={{ marginTop: 10, color: theme.colors.onSurfaceVariant, fontFamily: chatFontFamily }}>
            Nümunə: Bu, çat yazısıdır.
          </Text>
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader>Bildirişlər</List.Subheader>
        <List.Item
          title="Bildirişləri aktiv et"
          right={() => (
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          )}
        />

        <List.Item
          title="Bildiriş səsi"
          description={notificationsEnabled ? undefined : "Bildirişlər söndürülüb"}
          right={() => (
            <Switch
              value={notificationSound}
              onValueChange={setNotificationSound}
              disabled={!notificationsEnabled}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Lokasiya</List.Subheader>
        <List.Item
          title="Lokasiyanı aktiv et"
          description={locationEnabled ? "Aktivdir" : "Söndürülüb"}
          right={() => <Switch value={locationEnabled} onValueChange={toggleLocation} />}
        />
      </List.Section>
    </Screen>
  );
}
