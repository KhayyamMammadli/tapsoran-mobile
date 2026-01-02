import React from "react";
import { Image, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export function HeroHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 18,
        backgroundColor: theme.colors.primary,
        overflow: "hidden",
      }}
    >
      {/* Decorative bubbles */}
      <View
        style={{
          position: "absolute",
          right: -30,
          top: -30,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: "rgba(255,255,255,0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: -40,
          bottom: -50,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "rgba(255,255,255,0.10)",
        }}
      />

      <Image
        source={require("../../assets/logo.png")}
        style={{ width: 180, height: 48, resizeMode: "contain" }}
      />

      <Text variant="titleLarge" style={{ color: "#fff", marginTop: 8 }}>
        {title}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.88)", lineHeight: 20, marginTop: 2 }}>
        {subtitle}
      </Text>
    </View>
  );
}
