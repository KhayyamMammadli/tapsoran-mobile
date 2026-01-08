import React from "react";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { theme } from "./src/theme";
import { AuthProvider } from "./src/state/AuthContext";
import { BadgeProvider } from "./src/state/BadgeContext";
import { PreferencesProvider } from "./src/state/PreferencesContext";
import { ToastProvider } from "./src/state/ToastContext";
import { AppNavigator } from "./src/AppNavigator";

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <ToastProvider>
          <PreferencesProvider>
            <AuthProvider>
              <BadgeProvider>
                <AppNavigator />
              </BadgeProvider>
            </AuthProvider>
          </PreferencesProvider>
        </ToastProvider>
      </SafeAreaProvider>
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
