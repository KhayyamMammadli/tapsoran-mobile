import React from "react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export function TabIcon({
  name,
  color,
  size,
  showDot,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  size: number;
  showDot?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={{ width: size + 10, height: size + 10, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons name={name} color={color} size={size} />
      {showDot ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.error,
          }}
        />
      ) : null}
    </View>
  );
}
