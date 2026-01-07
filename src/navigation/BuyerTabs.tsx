import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { HeaderNotifButton } from "../components/HeaderNotifButton";
import { HeaderChatActions } from "../components/HeaderChatActions";
import { HeaderChatButton } from "../components/HeaderChatButton";
import { BuyerTabBar } from "../components/BuyerTabBar";

import { BuyerHomeScreen } from "../screens/BuyerHomeScreen";
import { ConversationsScreen } from "../screens/ConversationsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export function BuyerTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <BuyerTabBar {...props} />}
      screenOptions={({ navigation, route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerRight: () => {
          // In chat screens, show a small "menu" button (preferences) next to the notifications bell.
          const parent = navigation.getParent();
          const go = (name: string) => (parent ?? (navigation as any)).navigate(name);
          if (route.name === "BuyerChats") {
            return <HeaderChatActions onPressPreferences={() => go("Preferences")} onPressNotifications={() => go("Notifications")} />;
          }
          // Chats moved from bottom menu to header (left of the notifications bell)
          return (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 10 }}>
              <HeaderChatButton onPress={() => (navigation as any).navigate("BuyerChats")} />
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
        name="BuyerHome"
        component={BuyerHomeScreen}
        options={{
          title: "Sorğularım",
          tabBarLabel: "Sorğular",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="BuyerChats"
        component={ConversationsScreen}
        options={{
          title: "Chatlər",
          headerShown: false,
          // Hide from bottom menu (Chat is now in the header)
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <Tab.Screen
        name="BuyerProfile"
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
