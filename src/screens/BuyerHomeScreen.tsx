import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Card, Text, TextInput, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Screen } from "../components/Screen";
import { HeroHeader } from "../components/HeroHeader";
import { ServiceCard } from "../components/ServiceCard";

export function BuyerHomeScreen() {
  const nav = useNavigation<any>();
  const theme = useTheme();

  return (
    <Screen>
      <HeroHeader
        title="Alıcı kabineti"
        subtitle="Sorğu yarat, uyğun satıcılardan təklif al və chat ilə əlaqə qur."      />

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">Sürətli axtarış</Text>
          <TextInput
            mode="outlined"
            placeholder="Məs: iPhone 15, Soyuducu, Kondisioner..."
            left={<TextInput.Icon icon="magnify" />}
          />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Məhsul adını yaz, sonra “Sorğu” bölməsində göndər.
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={{ marginTop: 4 }}>
        Xidmətlər
      </Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Sorğu yarat"
            subtitle="Ad və ya şəkil ilə"            badge="Yeni"
            onPress={() => nav.navigate("BuyerRequest")}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Chatlər"
            subtitle="Mesajları yoxla"            onPress={() => nav.navigate("BuyerChats")}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Sorğularım"
            subtitle="Status və tarix"            onPress={() => nav.navigate("BuyerRequest")}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ServiceCard
            title="Profil"
            subtitle="Hesab ayarları"            onPress={() => nav.navigate("BuyerProfile")}
          />
        </View>
      </View>

      <Card mode="elevated" style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium">Məsləhət</Text>
          </View>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Daha tez cavab almaq üçün məhsulun şəklini əlavə et və doğru kateqoriya seç.
          </Text>
        </Card.Content>
      </Card>
    </Screen>
  );
}
