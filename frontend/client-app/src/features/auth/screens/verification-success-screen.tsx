import React from "react";
import {
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { BUSINESS_NAME } from "@/constants";
import type { RootStackParamList } from "@/app/navigation/types";

const CONTENT_MAX_WIDTH = 420;

export function VerificationSuccessScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height } = useWindowDimensions();

  const isWideViewport = Platform.OS === "web" && height >= 640;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isWideViewport ? "center" : "center",
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <View
          className="w-full self-center"
          style={{ maxWidth: CONTENT_MAX_WIDTH }}
        >
          <View className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full border border-success/30 bg-success/10">
              <CheckCircle2 size={40} color="#16A34A" strokeWidth={2} />
            </View>

            <Text
              variant="h1"
              className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground"
            >
              Email verified
            </Text>
            <Text
              tone="muted"
              className="mt-2 text-center text-sm leading-relaxed"
            >
              Your email address has been verified successfully. You can now
              sign in to your {BUSINESS_NAME} account.
            </Text>

            <Button
              size="control"
              label="Back to sign in"
              fullWidth
              className="mt-8"
              onPress={() => navigation.navigate("Login")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
