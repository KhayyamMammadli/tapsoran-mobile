import React from "react";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme";
import { AuthProvider } from "./src/state/AuthContext";
import { BadgeProvider } from "./src/state/BadgeContext";
import { PreferencesProvider } from "./src/state/PreferencesContext";
import { AppNavigator } from "./src/AppNavigator";

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <PreferencesProvider>
        <AuthProvider>
          <BadgeProvider>
            <AppNavigator />
          </BadgeProvider>
        </AuthProvider>
      </PreferencesProvider>
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
