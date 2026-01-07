import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { HeaderNotifButton } from "../components/HeaderNotifButton";
import { HeaderChatActions } from "../components/HeaderChatActions";
import { HeaderChatButton } from "../components/HeaderChatButton";

import { SellerHomeScreen } from "../screens/SellerHomeScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export function SellerTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ navigation, route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerRight: () => {
          const parent = navigation.getParent();
          const go = (name: string) => (parent ?? (navigation as any)).navigate(name);
          if (route.name === "SellerChats") {
            return <HeaderChatActions onPressPreferences={() => go("Preferences")} onPressNotifications={() => go("Notifications")} />;
          }
          // Chats moved from bottom menu to header (left of the notifications bell)
          return (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 6 }}>
              <HeaderChatButton onPress={() => (navigation as any).navigate("SellerChats")} />
              <HeaderNotifButton onPress={() => go("Notifications")} />
            </View>
          );
        },
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
          headerShown: false,
          // Hide from bottom menu; Chats is accessed from the header (next to notifications)
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
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
