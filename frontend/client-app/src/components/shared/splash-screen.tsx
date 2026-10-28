import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Text } from "@/components/ui/text";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/constants";

export function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View className="flex-1 items-center justify-center bg-[#FFFFFF]">
      <Animated.View style={{ opacity, alignItems: "center" }}>
        <BrandLogo size={120} />
        <Text
          weight="semibold"
          className="mt-6 text-2xl tracking-tight text-foreground text-center"
        >
          {BUSINESS_NAME}
        </Text>
        <Text
          variant="small"
          tone="muted"
          className="mt-1 text-center font-medium"
        >
          {APP_FULL_NAME}
        </Text>
      </Animated.View>
    </View>
  );
}
