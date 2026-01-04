import React from "react";
import { Pressable, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export function ServiceCard({
  title,
  subtitle,
  icon,
  badge,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress}>
      <Card
        mode="contained"
        style={{ borderRadius: 5, borderWidth: 1, borderColor: theme.colors.outlineVariant }}
      >
        <Card.Content style={{ gap: 8, paddingVertical: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 5,
                backgroundColor: theme.colors.surfaceVariant,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name={icon as any} size={22} color={theme.colors.primary} />
            </View>

            {badge ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: "rgba(10,86,194,0.10)",
                }}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>{badge}</Text>
              </View>
            ) : null}
          </View>

          <Text variant="titleMedium">{title}</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>{subtitle}</Text>
        </Card.Content>
      </Card>
    </Pressable>
  );
}
