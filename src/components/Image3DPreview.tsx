import React, { useMemo, useRef } from "react";
import { Animated, Image, PanResponder, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

type Props = {
  uri: string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Lightweight "3D" preview for an image (parallax/tilt).
 * This is NOT a true 3D model. It's a UX-friendly 3D-like view that works offline.
 */
export function Image3DPreview({ uri, height = 220, borderRadius = 18, style }: Props) {
  const theme = useTheme();
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_evt, g) => {
          // clamp to keep it subtle
          const x = Math.max(-24, Math.min(24, g.dx));
          const y = Math.max(-24, Math.min(24, g.dy));
          tilt.setValue({ x, y });
        },
        onPanResponderRelease: () => {
          Animated.spring(tilt, {
            toValue: { x: 0, y: 0 },
            // Keep this on the JS driver because `shadowOffset` is not supported
            // by the native animated module on Android.
            useNativeDriver: false,
            friction: 6,
            tension: 80,
          }).start();
        },
      }),
    [tilt]
  );

  const rotateY = tilt.x.interpolate({ inputRange: [-24, 24], outputRange: ["-10deg", "10deg"] });
  const rotateX = tilt.y.interpolate({ inputRange: [-24, 24], outputRange: ["10deg", "-10deg"] });

  const shadow = tilt.x.interpolate({ inputRange: [-24, 24], outputRange: [-8, 8] });

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        {
          height,
          borderRadius,
          overflow: "hidden",
          backgroundColor: theme.colors.surfaceVariant,
          transform: [{ perspective: 900 }, { rotateX }, { rotateY }],
          // subtle depth
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: shadow as any, height: 10 },
        } as any,
        style,
      ]}
    >
      <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
    </Animated.View>
  );
}
