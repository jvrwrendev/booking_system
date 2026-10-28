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
import { BrandLogo } from "@/components/shared/brand-logo";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/constants";
import type { RootStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";
const PRIMARY_ICON = "#0F172A";
const PRIMARY = "#16A34A";
const DANGER = "#DC2626";
const CONTENT_MAX_WIDTH = 440;
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

  const isWideViewport = Platform.OS === "web" && height >= 700;
  const codeExpired = expiresIn <= 0;
  const expiringSoon = expiresIn > 0 && expiresIn <= 60;
  const shownCode = codeExpired ? "" : code;
  const codeComplete = shownCode.length === CODE_LENGTH;
  const buttonDisabled = !codeComplete || codeExpired;
  const progress = Math.max(
    0,
    Math.min(100, (expiresIn / CODE_TTL_SECONDS) * 100),
  );

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
    const value = (submittedCode ?? shownCode).trim();

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
          : "A code was sent recently. Please use it or wait for the cooldown.",
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
            paddingVertical: 28,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            className="w-full self-center"
            style={{ maxWidth: CONTENT_MAX_WIDTH }}
          >
            {/* Top bar */}
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => navigation.navigate("Login")}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background active:bg-secondary"
              >
                <ArrowLeft size={18} color={PRIMARY_ICON} />
              </Pressable>

              <View className="flex-row items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
                <ShieldCheck size={13} color={PRIMARY} />
                <Text
                  variant="small"
                  weight="semibold"
                  className="text-[11px] text-primary"
                >
                  Secure verification
                </Text>
              </View>
            </View>

            {/* Brand */}
            <View className="mt-5 flex-row items-center gap-3">
              <BrandLogo size={44} />
              <View className="flex-1">
                <Text weight="semibold" className="text-base tracking-tight">
                  {BUSINESS_NAME}
                </Text>
                <Text variant="small" tone="muted" className="mt-0.5 text-xs">
                  {APP_FULL_NAME}
                </Text>
              </View>
            </View>

            {/* Title */}
            <View className="mt-7">
              <Text
                variant="h1"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                Check your email
              </Text>
              <Text tone="muted" className="mt-2 text-sm leading-relaxed">
                We sent a six-digit verification code to:
              </Text>
              <View
                className="mt-3 flex-row items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5"
                style={{ alignSelf: "flex-start", maxWidth: "100%" }}
              >
                <Mail size={14} color={MUTED_ICON} />
                <Text
                  variant="small"
                  weight="semibold"
                  numberOfLines={1}
                  className="shrink text-xs"
                >
                  {email || "your email address"}
                </Text>
              </View>
            </View>

            {/* Verification panel */}
            <View className="mt-6 rounded-2xl border border-border bg-background p-5 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Clock3
                    size={14}
                    color={codeExpired || expiringSoon ? DANGER : MUTED_ICON}
                  />
                  <Text variant="small" tone="muted" className="text-xs">
                    {codeExpired ? "Code expired" : "Code expires in"}
                  </Text>
                </View>
                <Text
                  variant="small"
                  weight="semibold"
                  tone={codeExpired || expiringSoon ? "danger" : "default"}
                  className="text-xs tabular-nums"
                >
                  {codeExpired ? "0:00" : formatCountdown(expiresIn)}
                </Text>
              </View>

              <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <View
                  className={
                    codeExpired || expiringSoon ? "bg-danger" : "bg-primary"
                  }
                  style={{ width: `${progress}%`, height: "100%" }}
                />
              </View>

              <View className="mt-6">
                <OtpInput
                  value={shownCode}
                  onChange={(value) => {
                    setCode(value);
                    setError(null);
                    setResendMessage(null);
                  }}
                  length={CODE_LENGTH}
                  editable={!verifying && !codeExpired}
                  hasError={Boolean(error)}
                  focusKey={focusKey}
                  onComplete={(value) => {
                    void onVerify(value);
                  }}
                />
              </View>

              {error ? (
                <View
                  accessibilityRole="alert"
                  className="mt-4 flex-row items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 p-3"
                >
                  <AlertCircle
                    size={15}
                    color={DANGER}
                    style={{ marginTop: 1 }}
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
                <View className="mt-4 flex-row items-start gap-2.5 rounded-xl border border-success/20 bg-success/5 p-3">
                  <CheckCircle2
                    size={15}
                    color={PRIMARY}
                    style={{ marginTop: 1 }}
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
                className={cn("mt-5", buttonDisabled && "bg-secondary")}
                textClassName={
                  buttonDisabled ? "text-muted-foreground" : undefined
                }
                label={codeExpired ? "Code expired" : "Verify email"}
                onPress={() => {
                  void onVerify();
                }}
                loading={verifying}
                disabled={buttonDisabled || verifying}
                fullWidth
              />
            </View>

            {/* Resend */}
            <View className="mt-5 flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
              <Text variant="small" tone="muted" className="text-sm">
                Didn&apos;t receive the code?
              </Text>
              <Pressable
                onPress={() => {
                  void onResend();
                }}
                disabled={cooldown > 0 || resending}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Resend verification code"
                accessibilityState={{
                  disabled: cooldown > 0 || resending,
                  busy: resending,
                }}
              >
                <Text
                  variant="small"
                  weight="semibold"
                  tone={cooldown > 0 ? "muted" : "primary"}
                  className="text-sm"
                >
                  {resending
                    ? "Sending…"
                    : cooldown > 0
                      ? `Resend in ${formatCountdown(cooldown)}`
                      : codeExpired
                        ? "Send a new code"
                        : "Resend code"}
                </Text>
              </Pressable>
            </View>

            {/* Security note */}
            <View className="mt-6 flex-row items-start gap-2.5 rounded-xl border border-border/70 bg-secondary/40 p-3.5">
              <Lock size={14} color={MUTED_ICON} style={{ marginTop: 1.5 }} />
              <Text
                variant="small"
                tone="muted"
                className="flex-1 text-xs leading-5"
              >
                For your security, the code expires after 10 minutes, allows
                five attempts, and can be used only once. Never share it with
                anyone.
              </Text>
            </View>

            <View className="mt-5 items-center">
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
