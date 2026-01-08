import React from "react";
import { Alert, View } from "react-native";
import { Button, List, Switch, SegmentedButtons, Text, useTheme } from "react-native-paper";
import Constants from "expo-constants";
import { Screen } from "../components/Screen";
import { usePrefs } from "../state/PreferencesContext";

export function PreferencesScreen() {
  const theme = useTheme();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationSound,
    setNotificationSound,
    notificationSoundKey,
    setNotificationSoundKey,
  } = usePrefs();

  // NOTE: Chat and location settings are temporarily hidden.

  return (
    <Screen>
      <Text variant="headlineSmall" style={{ marginBottom: 10 }}>
        Ayarlar
      </Text>

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
              style={{ marginTop: 10, borderRadius: 16 }}
              onPress={async () => {
                try {
                  const map: any = {
                    DEFAULT: { channelId: "default", sound: undefined },
                    CHIME: { channelId: "sound_chime", sound: "chime.wav" },
                    DING: { channelId: "sound_ding", sound: "ding.wav" },
                    POP: { channelId: "sound_pop", sound: "pop.wav" },
                  };
                  const cfg = map[notificationSoundKey] || map.DEFAULT;
                  const isExpoGo = Constants.appOwnership === "expo";
                  if (isExpoGo) {
                    Alert.alert("Push bildirişləri", "Expo Go-də (SDK 53+) remote push bildirişləri dəstəklənmir. Push üçün development build (EAS dev client) və ya APK istifadə edin.");
                    return;
                  }
                  const Notifications = await import("expo-notifications");
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

    </Screen>
  );
}