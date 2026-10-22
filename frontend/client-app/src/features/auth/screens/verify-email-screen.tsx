import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Mail,
  MailCheck,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { BUSINESS_NAME } from "@/constants";
import type { RootStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";
const PRIMARY_ICON = "#0F172A";
const CONTENT_MAX_WIDTH = 420;
const RESEND_COOLDOWN_SECONDS = 60;
const CODE_TTL_SECONDS = 10 * 60;
const CODE_LENGTH = 6;

type VerifyEmailRoute = RouteProp<RootStackParamList, "VerifyEmail">;

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VerifyEmailScreen() {
  const { verifyEmail, resendVerification, user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<VerifyEmailRoute>();
  const { height } = useWindowDimensions();

  const email = route.params?.email ?? user?.email ?? "";

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(CODE_TTL_SECONDS);
  const [focusKey, setFocusKey] = useState(0);

  const isWideViewport = Platform.OS === "web" && height >= 640;
  const codeComplete = code.length === CODE_LENGTH;
  const codeExpired = expiresIn <= 0;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetCode = () => {
    setCode("");
    setFocusKey((value) => value + 1);
  };

  const onVerify = async (submittedCode?: string) => {
    if (verifying) return;
    const value = (submittedCode ?? code).trim();

    if (value.length !== CODE_LENGTH) {
      setError("Enter the full six-digit code from your email.");
      setResendMessage(null);
      return;
    }

    Keyboard.dismiss();
    setError(null);
    setResendMessage(null);
    setVerifying(true);

    const result = await verifyEmail(email, value);
    setVerifying(false);

    if (result.success) {
      navigation.reset({
        index: 0,
        routes: [{ name: "VerificationSuccess" }],
      });
      return;
    }

    setError(result.error ?? "We could not verify your email address.");
    resetCode();
  };

  const onResend = async () => {
    if (resending || cooldown > 0) return;
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
      setExpiresIn(result.expiresInSeconds ?? CODE_TTL_SECONDS);
      resetCode();
    } else {
      setError(result.error ?? "Could not resend the verification code.");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: isWideViewport ? "center" : "flex-start",
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            className="w-full self-center"
            style={{ maxWidth: CONTENT_MAX_WIDTH }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                onPress={() => navigation.navigate("Login")}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                className="h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background active:bg-accent/10"
              >
                <ArrowLeft size={18} color={PRIMARY_ICON} />
              </Pressable>
            </View>

            <View className="items-center py-2">
              <View className="h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <MailCheck size={30} color="#16A34A" />
              </View>
            </View>

            <View className="mt-6">
              <Text
                variant="h1"
                className="text-center text-2xl font-bold tracking-tight text-foreground"
              >
                Check your inbox
              </Text>
              <Text
                tone="muted"
                className="mt-2 text-center text-sm leading-relaxed"
              >
                We sent a six-digit verification code to
              </Text>
              <Text
                weight="semibold"
                className="mt-1 text-center text-sm text-foreground"
              >
                {email || "your email address"}
              </Text>
              <Text
                tone="muted"
                className="mt-3 text-center text-sm leading-relaxed"
              >
                Enter the code below to verify your {BUSINESS_NAME} account.
              </Text>
            </View>

            <View
              className={`mt-5 flex-row items-center justify-center gap-1.5 self-center rounded-full border px-3 py-1 ${
                codeExpired
                  ? "border-danger/20 bg-danger/5"
                  : "border-border/70 bg-secondary/40"
              }`}
            >
              <Clock3
                size={13}
                color={codeExpired ? "#DC2626" : MUTED_ICON}
              />
              <Text
                variant="small"
                tone={codeExpired ? "danger" : "muted"}
                className="text-xs"
              >
                {codeExpired
                  ? "Code expired — request a new one"
                  : `Code expires in ${formatCountdown(expiresIn)}`}
              </Text>
            </View>

            <View className="mt-6">
              <OtpInput
                value={code}
                onChange={(value) => {
                  setCode(value);
                  setError(null);
                  setResendMessage(null);
                }}
                length={CODE_LENGTH}
                editable={!verifying}
                hasError={Boolean(error)}
                focusKey={focusKey}
                onComplete={(value) => {
                  void onVerify(value);
                }}
              />
            </View>

            <View className="mt-5 gap-5">
              {error ? (
                <View className="flex-row items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 p-3.5">
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
                <View className="flex-row items-start gap-2.5 rounded-xl border border-success/20 bg-success/5 p-3.5">
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

              <Button
                size="control"
                label="Verify email"
                onPress={() => {
                  void onVerify();
                }}
                loading={verifying}
                disabled={!codeComplete || verifying || codeExpired}
                fullWidth
              />

              <Button
                size="control"
                variant="outline"
                label={
                  cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend verification code"
                }
                onPress={() => {
                  void onResend();
                }}
                loading={resending}
                disabled={cooldown > 0 || verifying}
                fullWidth
              />
            </View>

            <View className="mt-6 items-center">
              <Pressable
                onPress={() => navigation.navigate("Login")}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Back to sign in"
              >
                <Text variant="small" tone="muted" className="text-center">
                  Already verified?{" "}
                  <Text variant="small" weight="semibold" tone="primary">
                    Sign in
                  </Text>
                </Text>
              </Pressable>
            </View>

            <View className="mt-8 flex-row items-start gap-2 rounded-xl border border-border/60 bg-secondary/40 p-3.5">
              <Mail size={15} color={MUTED_ICON} style={{ marginTop: 2 }} />
              <Text
                variant="small"
                tone="muted"
                className="flex-1 text-xs leading-5"
              >
                Can&apos;t find the email? Check your spam folder, or resend the
                code after the cooldown. The code can be used only once.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
