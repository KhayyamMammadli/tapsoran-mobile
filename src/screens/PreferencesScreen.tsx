import React from "react";
import { Alert, View } from "react-native";
import { Button, List, Switch, SegmentedButtons, Text, useTheme } from "react-native-paper";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
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
    notificationSoundKey,
    setNotificationSoundKey,
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
      

        {notificationsEnabled && notificationSound && (
          <View style={{ marginTop: 8, paddingLeft: 12, paddingRight: 12 }}>
            <Text variant="labelLarge" style={{ marginBottom: 6 }}>
              Bildiriş səsi seçimi
            </Text>
            <SegmentedButtons
              value={notificationSoundKey}
              onValueChange={(v) => setNotificationSoundKey(v as any)}
              buttons={[
                { value: "DEFAULT", label: "Standart" },
                { value: "CHIME", label: "Çınqıltı" },
                { value: "DING", label: "Zəng" },
                { value: "POP", label: "Pop" },
              ]}
            />
            <Button
              mode="outlined"
              style={{ marginTop: 10, borderRadius: 5 }}
              onPress={async () => {
                try {
                  const map: any = {
                    DEFAULT: { channelId: "default", sound: undefined },
                    CHIME: { channelId: "sound_chime", sound: "chime.wav" },
                    DING: { channelId: "sound_ding", sound: "ding.wav" },
                    POP: { channelId: "sound_pop", sound: "pop.wav" },
                  };
                  const cfg = map[notificationSoundKey] || map.DEFAULT;
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Test bildirişi",
                      body: "Seçilən bildiriş səsi yoxlanılır.",
                      sound: cfg.sound,
                    },
                    trigger: { seconds: 1, channelId: cfg.channelId } as any,
                  });
                } catch {
                  Alert.alert("Xəta", "Bildiriş səsi test edilə bilmədi.");
                }
              }}
            >
              Səsi yoxla
            </Button>
          </View>
        )}
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
