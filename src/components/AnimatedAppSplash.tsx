import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

/**
 * App start splash (in-app) – shown briefly on launch.
 * - Full-screen brand color background
 * - Centered "TapSoran" typed left-to-right (typewriter) with blinking caret
 */
export function AnimatedAppSplash() {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const caretOpacity = useRef(new Animated.Value(1)).current;
  const [idx, setIdx] = useState(0);

  const full = "TapSoran";
  const shown = full.slice(0, idx);

  const bg = theme.colors.primary;
  const fg = (theme.colors as any).onPrimary || "#FFFFFF";

  useEffect(() => {
    const enter = Animated.timing(opacity, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(caretOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(caretOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );

    enter.start(() => blink.start());

    let timer: any;
    let interval: any;

    const start = () => {
      setIdx(0);
      let i = 0;
      interval = setInterval(() => {
        i += 1;
        setIdx(i);
        if (i >= full.length) {
          clearInterval(interval);
          timer = setTimeout(start, 900);
        }
      }, 85);
    };

    start();

    return () => {
      opacity.stopAnimation();
      caretOpacity.stopAnimation();
      if (interval) clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [opacity, caretOpacity]);

  const titleStyle = useMemo(
    () => ({
      color: fg,
      fontSize: 40,
      letterSpacing: 0.6,
      fontWeight: "800" as const,
    }),
    [fg]
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ opacity, flexDirection: "row", alignItems: "center" }}>
        <Text style={titleStyle}>{shown}</Text>
        <Animated.View style={{ opacity: caretOpacity }}>
          <Text style={titleStyle}>|</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
