import React from "react";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme";
import { AuthProvider } from "./src/state/AuthContext";
import { BadgeProvider } from "./src/state/BadgeContext";
import { AppNavigator } from "./src/AppNavigator";

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <BadgeProvider>
          <AppNavigator />
        </BadgeProvider>
      </AuthProvider>
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
