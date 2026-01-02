import React from "react";
import { Screen } from "../components/Screen";
import { Button, Text } from "react-native-paper";
import { useAuth } from "../state/AuthContext";

export function SettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen>
      <Text variant="headlineMedium">Profil</Text>
      <Text>Ad: {user?.fullName}</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Rol: {user?.role}</Text>

      <Button mode="contained" onPress={logout}>Çıxış</Button>
    </Screen>
  );
}
