import React from "react";
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "./state/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { PreferencesScreen } from "./screens/PreferencesScreen";
import { ActivityIndicator, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { BuyerTabs } from "./navigation/BuyerTabs";
import { SellerTabs } from "./navigation/SellerTabs";
import { AdminTabs } from "./navigation/AdminTabs";
import { AdminChatDetailScreen } from "./screens/admin/AdminChatDetailScreen";
import { HeaderNotifButton } from "./components/HeaderNotifButton";
import { BuyerCreateRequestScreen } from "./screens/BuyerCreateRequestScreen";
import { HeaderChatActions } from "./components/HeaderChatActions";

const Root = createNativeStackNavigator();

export function AppNavigator() {
  const { token, user, loading } = useAuth();
  const theme = useTheme();

  const navTheme = {
    ...NavDefaultTheme,
    colors: {
      ...NavDefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
      primary: theme.colors.primary,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Yüklənir...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Root.Navigator>
        {!token || !user ? (
          <Root.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Root.Screen
              name="Tabs"
              component={user.role === "BUYER" ? BuyerTabs : user.role === "SELLER" ? SellerTabs : AdminTabs}
              options={{ headerShown: false }}
            />
            <Root.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                title: "Bildirişlər",
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
                headerShadowVisible: false,
              }}
            />

            <Root.Screen
              name="Preferences"
              component={PreferencesScreen}
              options={{
                title: "Ayarlar",
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
                headerShadowVisible: false,
              }}
            />

            <Root.Screen
              name="AdminChatDetail"
              component={AdminChatDetailScreen}
              options={({ navigation }) => ({
                title: "Çat (Admin)",
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
                headerShadowVisible: false,
                headerRight: () => (
                  <HeaderNotifButton onPress={() => (navigation as any).navigate("Notifications")} />
                ),
              })}
            />

            <Root.Screen
              name="BuyerCreateRequest"
              component={BuyerCreateRequestScreen}
              options={({ navigation }) => ({
                title: "Sorğu yarat",
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
                headerShadowVisible: false,
                headerRight: () => (
                  <HeaderNotifButton onPress={() => (navigation as any).navigate("Notifications")} />
                ),
              })}
            />

            <Root.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
