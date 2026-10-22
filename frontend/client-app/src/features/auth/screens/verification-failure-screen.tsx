import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import type { RootStackParamList } from "@/app/navigation/types";

const CONTENT_MAX_WIDTH = 420;
const RESEND_COOLDOWN_SECONDS = 60;

type FailureRoute = RouteProp<RootStackParamList, "VerificationFailure">;

export function VerificationFailureScreen() {
  const { resendVerification } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<FailureRoute>();
  const { height } = useWindowDimensions();

  const email = route.params?.email ?? "";
  const reason =
    route.params?.message ?? "We could not verify your email address.";

  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const isWideViewport = Platform.OS === "web" && height >= 640;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onResend = async () => {
    if (resending || cooldown > 0 || !email) return;
    setResending(true);
    setError(null);
    setResendMessage(null);

    const result = await resendVerification(email);
    setResending(false);

    if (result.success) {
      setResendMessage(
        result.sent
          ? "A new verification code has been sent. Check your inbox."
          : "A code was sent recently. Please use it or wait for the cooldown."
      );
      setCooldown(result.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
    } else {
      setError(result.error ?? "Could not resend the verification code.");
    }
  };

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
            <View className="h-20 w-20 items-center justify-center rounded-full border border-danger/20 bg-danger/10">
              <XCircle size={40} color="#DC2626" strokeWidth={2} />
            </View>

            <Text
              variant="h1"
              className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground"
            >
              Verification failed
            </Text>
            <Text
              tone="muted"
              className="mt-2 text-center text-sm leading-relaxed"
            >
              {reason}
            </Text>

            {error ? (
              <View className="mt-4 w-full flex-row items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 p-3.5">
                <AlertCircle
                  size={16}
                  color="#DC2626"
                  style={{ marginTop: 2 }}
                />
                <Text
                  variant="small"
                  tone="danger"
                  className="flex-1 text-xs leading-5"
                >
                  {error}
                </Text>
              </View>
            ) : resendMessage ? (
              <View className="mt-4 w-full flex-row items-start gap-2.5 rounded-xl border border-success/20 bg-success/5 p-3.5">
                <CheckCircle2
                  size={16}
                  color="#16A34A"
                  style={{ marginTop: 2 }}
                />
                <Text
                  variant="small"
                  tone="success"
                  className="flex-1 text-xs leading-5"
                >
                  {resendMessage}
                </Text>
              </View>
            ) : null}

            {email ? (
              <View className="mt-6 w-full gap-3">
                <Button
                  size="control"
                  label={
                    cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Request a new code"
                  }
                  fullWidth
                  loading={resending}
                  disabled={cooldown > 0}
                  onPress={() => {
                    void onResend();
                  }}
                />
                <Button
                  size="control"
                  variant="outline"
                  label="Try again"
                  fullWidth
                  onPress={() =>
                    navigation.navigate("VerifyEmail", { email })
                  }
                />
              </View>
            ) : null}

            <Pressable
              onPress={() => navigation.navigate("Login")}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel="Back to sign in"
              className="mt-6"
            >
              <Text variant="small" tone="muted" className="text-center">
                Back to{" "}
                <Text variant="small" weight="semibold" tone="primary">
                  Sign in
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
