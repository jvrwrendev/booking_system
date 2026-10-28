import React, { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type TextInputInstance,
} from "react-native";
import { BrandLogo } from "@/components/shared/brand-logo";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { cn, validateEmail } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/constants";
import type { RootStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";
const PRIMARY_COLOR = "#0F172A";

const CONTENT_MAX_WIDTH = 420;

export function LoginScreen() {
  const { login, resendVerification } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const passwordRef = useRef<TextInputInstance>(null);

  const emailError = submitted ? validateEmail(email) : undefined;
  const passwordError =
    submitted && !password ? "Password is required." : undefined;

  const isWideViewport = Platform.OS === "web" && height >= 640;

  const resetFeedback = () => {
    setError(null);
    setForgot(false);
    setUnverified(false);
    setResendMessage(null);
  };

  const onEmailChange = (value: string) => {
    setEmail(value);
    resetFeedback();
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    resetFeedback();
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitted(true);
    setForgot(false);
    setError(null);

    if (validateEmail(email) || !password) {
      Keyboard.dismiss();
      return;
    }

    setSubmitting(true);
    const result = await login({ email: email.trim(), password });
    setSubmitting(false);
    if (!result.success) {
      setUnverified(result.code === "EMAIL_NOT_VERIFIED");
      setError(result.error ?? "Login failed. Please try again.");
    }
  };

  const onResendVerification = async () => {
    if (resending) return;
    setResending(true);
    setResendMessage(null);
    const result = await resendVerification(email.trim());
    setResending(false);
    if (result.success) {
      setResendMessage(
        "A verification code has been sent. Check your inbox, then sign in."
      );
    } else {
      setError(result.error ?? "Could not resend the verification email.");
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
            {/* Navigation Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background active:bg-accent/10"
              >
                <ArrowLeft size={18} color={PRIMARY_COLOR} />
              </Pressable>
            </View>

            {/* Brand Header */}
            <View className="items-center py-2">
              <BrandLogo size={80} />
              <Text
                weight="semibold"
                className="mt-3 text-xl tracking-tight text-foreground"
              >
                {BUSINESS_NAME}
              </Text>
              <Text
                variant="small"
                tone="muted"
                className="mt-0.5 text-center font-medium"
              >
                {APP_FULL_NAME}
              </Text>
            </View>

            {/* Title Section */}
            <View className="mt-8">
              <Text
                variant="h1"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                Welcome back
              </Text>
              <Text tone="muted" className="mt-1 text-base leading-relaxed">
                Sign in to manage your customers, bookings, and orders.
              </Text>
            </View>

            {/* Form Area */}
            <View className="mt-6 gap-5">
              <Input
                size="control"
                label="Email address"
                accessibilityLabel="Email address"
                value={email}
                onChangeText={onEmailChange}
                error={emailError}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="name@agrivet.ph"
                leftIcon={<Mail size={18} color={MUTED_ICON} />}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Input
                inputRef={passwordRef}
                size="control"
                label="Password"
                accessibilityLabel="Password"
                labelAction={
                  <Pressable
                    onPress={() => {
                      setForgot((f) => !f);
                      setError(null);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Forgot password"
                  >
                    <Text
                      variant="small"
                      weight="medium"
                      tone="primary"
                      className="text-xs"
                    >
                      Forgot password?
                    </Text>
                  </Pressable>
                }
                value={password}
                onChangeText={onPasswordChange}
                error={passwordError}
                secureTextEntry={!showPassword}
                textContentType="password"
                placeholder="••••••••"
                leftIcon={<Lock size={18} color={MUTED_ICON} />}
                rightIcon={
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="p-1"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={MUTED_ICON} />
                    ) : (
                      <Eye size={18} color={MUTED_ICON} />
                    )}
                  </Pressable>
                }
                returnKeyType="go"
                submitBehavior="submit"
                onSubmitEditing={() => {
                  void onSubmit();
                }}
              />

              {/* Feedback Banners */}
              <Pressable
                onPress={() => setRememberMe((r) => !r)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                accessibilityLabel="Remember me"
                className="flex-row items-center gap-2.5 active:opacity-80"
              >
                <View
                  className={cn(
                    "h-5 w-5 items-center justify-center rounded-md border",
                    rememberMe
                      ? "border-primary bg-primary"
                      : "border-input bg-background"
                  )}
                >
                  {rememberMe ? (
                    <Text className="text-[12px] font-bold leading-none text-white">
                      ✓
                    </Text>
                  ) : null}
                </View>
                <Text variant="small" tone="muted">
                  Remember me
                </Text>
              </Pressable>

              {error ? (
                <View className="gap-3 rounded-xl border border-danger/20 bg-danger/5 p-3.5">
                  <View className="flex-row items-start gap-2.5">
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
                  {unverified ? (
                    <>
                      <Button
                        label="Resend verification email"
                        variant="outline"
                        size="sm"
                        loading={resending}
                        disabled={resending}
                        onPress={() => {
                          void onResendVerification();
                        }}
                      />
                      {resendMessage ? (
                        <Text
                          variant="small"
                          tone="success"
                          className="text-xs leading-5"
                        >
                          {resendMessage}
                        </Text>
                      ) : null}
                    </>
                  ) : null}
                </View>
              ) : forgot ? (
                <View className="flex-row items-start gap-2.5 rounded-xl border border-info/20 bg-info/5 p-3.5">
                  <Info size={16} color="#2563EB" style={{ marginTop: 2 }} />
                  <Text
                    variant="small"
                    tone="info"
                    className="flex-1 text-xs leading-5"
                  >
                    Contact your Agrivet administrator to reset your password.
                  </Text>
                </View>
              ) : null}

              {/* Submit Action - Fixed solid visual state */}
              <Button
                size="control"
                label="Sign in"
                onPress={() => {
                  void onSubmit();
                }}
                loading={submitting}
                fullWidth
                className="mt-1 bg-primary opacity-100"
              />
            </View>

            {/* Registration Navigation */}
            <View className="mt-6 items-center pt-2">
              <Pressable
                onPress={() => navigation.navigate("Register")}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Create an account"
              >
                <Text variant="small" tone="muted" className="text-center">
                  Don&apos;t have an account?{" "}
                  <Text variant="small" weight="semibold" tone="primary">
                    Create an account
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
