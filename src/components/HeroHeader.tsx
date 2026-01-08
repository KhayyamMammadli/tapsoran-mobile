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
        borderRadius: 22,
        padding: 18,
        backgroundColor: theme.colors.primary,
        overflow: "hidden",
      }}
    >
      {/* Decorative "glass" blobs (no extra deps) */}
      <View
        style={{
          position: "absolute",
          right: -34,
          top: -34,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: "rgba(255,255,255,0.16)",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: -40,
          bottom: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(255,255,255,0.10)",
        }}
      />

      {/* subtle corner highlight */}
      <View
        style={{
          position: "absolute",
          right: 14,
          bottom: 14,
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      />

      <Image
        source={require("../../assets/logo.png")}
        style={{ width: 170, height: 44, resizeMode: "contain" }}
      />

      <Text style={{ color: "#fff", marginTop: 10, fontSize: 22, fontWeight: "900" }}>
        {title}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.88)", lineHeight: 20, marginTop: 4, maxWidth: 520 }}>
        {subtitle}
      </Text>
    </View>
  );
}
