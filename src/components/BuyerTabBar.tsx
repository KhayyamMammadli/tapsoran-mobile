import React from "react";
import { Pressable, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Buyer bottom bar with a centered (+) action button.
 * The (+) opens the "Sorğu yarat" screen from the root stack.
 */
export function BuyerTabBar(props: BottomTabBarProps) {
  const theme = useTheme();
  const { state, navigation } = props;
  const insets = useSafeAreaInsets();

  const goRoot = (screen: string) => {
    const parent = navigation.getParent();
    (parent ?? (navigation as any)).navigate(screen);
  };

  const goTab = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(name as never);
    }
  };

  const isFocused = (name: string) => state.routes[state.index]?.name === name;

  const Item = ({
    name,
    label,
    icon,
    slotStyle,
  }: {
    name: string;
    label: string;
    icon: React.ReactNode;
    slotStyle?: any;
  }) => {
    const focused = isFocused(name);
    const color = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;
    return (
      <Pressable
        onPress={() => goTab(name)}
        style={({ pressed }) => [
          {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          },
          slotStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={{ position: "relative" }}>{icon}</View>
        <Text style={{ fontSize: 11, marginTop: 2, color }}>{label}</Text>
      </Pressable>
    );
  };

  // Keep the bar above Android navigation buttons / iOS home indicator.
  const bottomOffset = 12 + Math.max(insets.bottom, 0);

  return (
    <View style={{ position: "absolute", left: 16, right: 16, bottom: bottomOffset }}>
      <View
        style={{
          height: 66,
          backgroundColor: theme.colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
          flexDirection: "row",
          alignItems: "center",
          overflow: "hidden",
          // Android shadow
          elevation: 14,
        }}
      >
        {/* Left: Requests */}
        <Item
          name="BuyerHome"
          label="Sorğular"
          icon={<MaterialCommunityIcons name="format-list-bulleted" color={isFocused("BuyerHome") ? theme.colors.primary : theme.colors.onSurfaceVariant} size={24} />}
        />

        {/* Spacer slot to keep the (+) visually centered */}
        <View style={{ flex: 1 }} />

        {/* Right: Profile */}
        <Item
          name="BuyerProfile"
          label="Profil"
          icon={<MaterialCommunityIcons name="account-circle" color={isFocused("BuyerProfile") ? theme.colors.primary : theme.colors.onSurfaceVariant} size={24} />}
        />
      </View>

      {/* Center (+) action */}
      <View
        style={{
          position: "absolute",
          left: "50%",
          transform: [{ translateX: -28 }, { translateY: -18 }],
        }}
      >
        <Pressable
          onPress={() => goRoot("BuyerCreateRequest")}
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary,
            borderWidth: 6,
            borderColor: theme.colors.surface,
            opacity: pressed ? 0.85 : 1,
            elevation: 12,
          })}
          accessibilityRole="button"
          accessibilityLabel="Sorğu yarat"
        >
          <MaterialCommunityIcons name="plus" color={theme.colors.onPrimary} size={28} />
        </Pressable>
      </View>
    </View>
  );
}
