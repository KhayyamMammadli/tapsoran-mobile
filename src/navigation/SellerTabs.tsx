import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { useBadges } from "../state/BadgeContext";
import { TabIcon } from "../components/TabIcon";

import { SellerHomeScreen } from "../screens/SellerHomeScreen";
import { SellerFeedScreen } from "../screens/SellerFeedScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export function SellerTabs() {
  const theme = useTheme();
  const { unreadChats, unreadNotifs } = useBadges();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
          borderRadius: 18,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 10,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}
    >
      <Tab.Screen
        name="SellerHome"
        component={SellerHomeScreen}
        options={{
          title: "Ana səhifə",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SellerFeed"
        component={SellerFeedScreen}
        options={{
          title: "Sorğular",
          tabBarLabel: "Feed",
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
          tabBarLabel: "Chat",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="message-text" color={color} size={size} showDot={unreadChats > 0} />
          ),
        }}
      />
      <Tab.Screen
  name="SellerNotifs"
  component={NotificationsScreen}
  options={{
    title: "Bildirişlər",
    tabBarLabel: "Notif",
    tabBarIcon: ({ color, size }) => (
      <TabIcon name="bell" color={color} size={size} showDot={unreadNotifs > 0} />
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
