import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Card, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Screen } from "../components/Screen";
import { HeroHeader } from "../components/HeroHeader";
import { ServiceCard } from "../components/ServiceCard";

export function SellerHomeScreen() {
  const nav = useNavigation<any>();
  const theme = useTheme();

  return (
    <Screen>
      <HeroHeader
        title="Satıcı kabineti"
        subtitle="Yeni sorğuları izləyin, uyğun olanları qəbul edin və alıcı ilə əlaqə qurun."      />

      <Text variant="titleMedium" style={{ marginTop: 4 }}>
        Panel
      </Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Sorğular (Feed)"
            subtitle="Uyğun sorğuları gör"            badge="Aktiv"
            onPress={() => nav.navigate("SellerFeed")}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Chatlər"
            subtitle="Alıcılarla yazış"            onPress={() => nav.navigate("SellerChats")}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Profil"
            subtitle="Kateqoriya və tip"            onPress={() => nav.navigate("SellerProfile")}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Məsləhətlər"
            subtitle="İşinizi sürətləndirin"            onPress={() => nav.navigate("SellerFeed")}
          />
        </View>
      </View>

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="check-decagram-outline" size={18} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium">Qayda</Text>
          </View>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Sorğunu qəbul etdikdən sonra alıcıya tez yazın — cavab sürəti satış şansını artırır.
          </Text>
        </Card.Content>
      </Card>
    </Screen>
  );
}
