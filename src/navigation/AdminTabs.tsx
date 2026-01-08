import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
// Chat is temporarily hidden, so we don't need chat badges.
import { HeaderNotifButton } from "../components/HeaderNotifButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminHomeScreen } from "../screens/admin/AdminHomeScreen";
import { AdminUsersScreen } from "../screens/admin/AdminUsersScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export function AdminTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = 12 + Math.max(insets.bottom, 0);

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        // Notifications are shown as a header bell (top-right), not a bottom tab.
        headerRight: () => (
          <HeaderNotifButton
            onPress={() => {
              const parent = navigation.getParent();
              (parent ?? (navigation as any)).navigate("Notifications");
            }}
          />
        ),
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
          elevation: 10,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      })}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{
          title: "Admin",
          tabBarLabel: "Ana",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-account" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{
          title: "İstifadəçilər",
          tabBarLabel: "İstifadəçilər",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminProfile"
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
