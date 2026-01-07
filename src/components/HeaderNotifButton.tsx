import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useBadges } from "../state/BadgeContext";
import { TabIcon } from "./TabIcon";

/**
 * Header right notification bell with unread dot.
 * We use this instead of a bottom tab item for notifications.
 */
export function HeaderNotifButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const { unreadNotifs } = useBadges();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        borderRadius: 18,
      })}
      accessibilityRole="button"
      accessibilityLabel="Bildirişlər"
    >
      <View
        style={{
          padding: 4,
          borderRadius: 18,
          backgroundColor: theme.colors.surface,
        }}
      >
        <TabIcon name="bell-outline" color={theme.colors.onSurface} size={24} showDot={unreadNotifs > 0} />
      </View>
    </Pressable>
  );
}
