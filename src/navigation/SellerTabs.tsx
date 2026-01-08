import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { HeaderNotifButton } from "../components/HeaderNotifButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SellerHomeScreen } from "../screens/SellerHomeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export function SellerTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = 12 + Math.max(insets.bottom, 0);

  return (
    <Tab.Navigator
      screenOptions={({ navigation, route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerRight: () => {
          const parent = navigation.getParent();
          const go = (name: string) => (parent ?? (navigation as any)).navigate(name);
          return (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 6 }}>
              <HeaderNotifButton onPress={() => go("Notifications")} />
            </View>
          );
        },
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: bottomOffset,
          borderRadius: 22,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
          borderTopWidth: 0,
          elevation: 14,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      })}
    >
      <Tab.Screen
        name="SellerHome"
        component={SellerHomeScreen}
        options={{
          title: "Sorğular",
          tabBarLabel: "Sorğular",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SellerProfile"
        component={SettingsScreen}
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
