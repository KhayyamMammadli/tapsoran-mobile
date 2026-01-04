import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { useBadges } from "../state/BadgeContext";
import { TabIcon } from "../components/TabIcon";
import { HeaderNotifButton } from "../components/HeaderNotifButton";

import { SellerHomeScreen } from "../screens/SellerHomeScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export function SellerTabs() {
  const theme = useTheme();
  const { unreadChats } = useBadges();

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
          bottom: 12,
          borderRadius: 5,
          height: 62,
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
        name="SellerChats"
        component={ConversationsScreen}
        options={{
          title: "Chatlər",
          tabBarLabel: "Çat",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="message-text" color={color} size={size} showDot={unreadChats > 0} />
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
