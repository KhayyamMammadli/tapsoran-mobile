import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useBadges } from "../state/BadgeContext";
import { TabIcon } from "./TabIcon";

/**
 * Chat header actions: a small preferences/menu icon + notifications bell.
 * The bell shows an unread dot if there are unread notifications.
 */
export function HeaderChatActions({
  onPressPreferences,
  onPressNotifications,
}: {
  onPressPreferences: () => void;
  onPressNotifications: () => void;
}) {
  const theme = useTheme();
  const { unreadNotifs } = useBadges();

  const btnStyle = ({ pressed }: { pressed: boolean }) => ({
    opacity: pressed ? 0.7 : 1,
    borderRadius: 18,
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Pressable
        onPress={onPressNotifications}
        hitSlop={10}
        style={(s) => [btnStyle(s), { marginRight: 10 }]}
        accessibilityRole="button"
        accessibilityLabel="Bildirişlər"
      >
        <View style={{ padding: 4, borderRadius: 18, backgroundColor: theme.colors.surface }}>
          <TabIcon name="bell" color={theme.colors.onSurface} size={24} showDot={unreadNotifs > 0} />
        </View>
      </Pressable>

      <Pressable
        onPress={onPressPreferences}
        hitSlop={10}
        style={btnStyle}
        accessibilityRole="button"
        accessibilityLabel="Çat ayarları"
      >
        <View style={{ padding: 4, borderRadius: 18, backgroundColor: theme.colors.surface }}>
          <TabIcon name="tune-variant" color={theme.colors.onSurface} size={24} />
        </View>
      </Pressable>
    </View>
  );
}
