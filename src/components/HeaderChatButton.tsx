import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useBadges } from "../state/BadgeContext";
import { TabIcon } from "./TabIcon";

/**
 * Header chat button with unread dot.
 * Used when Chats is not shown as a bottom tab.
 */
export function HeaderChatButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const { unreadChats } = useBadges();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        borderRadius: 18,
      })}
      accessibilityRole="button"
      accessibilityLabel="Çat"
    >
      <View
        style={{
          padding: 4,
          borderRadius: 18,
          backgroundColor: theme.colors.surface,
        }}
      >
        <TabIcon name="chat-processing-outline" color={theme.colors.onSurface} size={24} showDot={unreadChats > 0} />
      </View>
    </Pressable>
  );
}
