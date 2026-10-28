import React from "react";
import { View, useWindowDimensions } from "react-native";
import { BrandLogo } from "@/components/shared/brand-logo";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { APP_FULL_NAME, APP_NAME, BUSINESS_NAME } from "@/constants";
import type { RootStackParamList } from "@/app/navigation/types";

const CONTENT_MAX_WIDTH = 420;

export function WelcomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height } = useWindowDimensions();

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <View
        className="flex-1 w-full self-center justify-between px-6 py-6"
        style={{ maxWidth: CONTENT_MAX_WIDTH }}
      >
        {/* Main Content Area */}
        <View className="flex-1 items-center justify-center py-8">
          {/* Brand Logo */}
          <View className="items-center justify-center">
            <BrandLogo size={120} />
          </View>

          {/* Brand Titles */}
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

          {/* Marketing Subtitle */}
          <Text
            tone="muted"
            className="mt-6 text-center text-base leading-relaxed px-2"
          >
            Welcome to {APP_NAME}. Manage customers, bookings, and inventory in
            one place.
          </Text>
        </View>

        {/* Bottom Actions Area */}
        <View className="gap-3 w-full pb-2">
          {/* Primary Action Button - Fixed Solid Color */}
          <Button
            size="control"
            label="Log in"
            fullWidth
            onPress={() => navigation.navigate("Login")}
            accessibilityLabel="Log in"
            className="bg-primary opacity-100"
          />

          {/* Secondary Action Button - Flat Outline */}
          <Button
            size="control"
            label="Create account"
            variant="outline"
            fullWidth
            onPress={() => navigation.navigate("Register")}
            accessibilityLabel="Create account"
            className="border-border/80"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}