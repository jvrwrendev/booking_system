import React, { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Leaf,
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
import { Card } from "@/components/ui/card";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/constants";
import type { RootStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";

const demoAccounts = [
  {
    label: "Agent",
    email: "roberto.garcia@agrivet.ph",
    password: "password",
  },
  {
    label: "Branch",
    email: "davao@agrivet.ph",
    password: "password",
  },
];

const CONTENT_MAX_WIDTH = 420;

export function LoginScreen() {
  const { login } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const emailError = submitted ? validateEmail(email) : undefined;
  const passwordError =
    submitted && !password ? "Password is required." : undefined;
  const canSubmit = Boolean(email.trim()) && password.length > 0 && !submitting;

  const selectedDemo = demoAccounts.find(
    (acc) => acc.email === email.trim()
  )?.label;

  const isWideViewport = Platform.OS === "web" && height >= 640;

  const resetFeedback = () => {
    setError(null);
    setForgot(false);
  };

  const onEmailChange = (value: string) => {
    setEmail(value);
    resetFeedback();
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    resetFeedback();
  };

  const applyDemoAccount = (account: (typeof demoAccounts)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setSubmitted(false);
    resetFeedback();
    Keyboard.dismiss();
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
      setError(result.error ?? "Login failed. Please try again.");
    }
    // Navigation handled by root navigator based on auth state
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: isWideViewport ? "center" : "flex-start",
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            className="w-full self-center"
            style={{ maxWidth: CONTENT_MAX_WIDTH }}
          >
            <Card className="p-6">
              <View className="items-center">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Leaf size={24} color="#FFFFFF" />
                </View>
                <Text weight="semibold" className="mt-3 tracking-tight">
                  {BUSINESS_NAME}
                </Text>
                <Text variant="small" tone="muted" className="mt-1 text-[11px]">
                  {APP_FULL_NAME}
                </Text>
              </View>

              <View className="mt-8">
                <Text variant="h1" className="tracking-tight">
                  Welcome back
                </Text>
                <Text tone="muted" className="mt-1.5 leading-relaxed">
                  Sign in to manage your customers, bookings, and orders.
                </Text>
              </View>

              <View className="mt-8 gap-5">
                <Input
                  size="control"
                  label="Email"
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={onEmailChange}
                  error={emailError}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="you@agrivet.ph"
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
                      <Text variant="small" weight="medium" tone="primary">
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
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? "Hide password" : "Show password"
                      }
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

                {error ? (
                  <View className="flex-row items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5">
                    <AlertCircle
                      size={14}
                      color="#DC2626"
                      style={{ marginTop: 2 }}
                    />
                    <Text variant="small" tone="danger" className="flex-1">
                      {error}
                    </Text>
                  </View>
                ) : forgot ? (
                  <View className="flex-row items-start gap-2.5 rounded-md border border-info/30 bg-info/5 px-3 py-2.5">
                    <Info size={14} color="#2563EB" style={{ marginTop: 2 }} />
                    <Text variant="small" tone="info" className="flex-1">
                      Contact your Agrivet administrator to reset your password.
                    </Text>
                  </View>
                ) : null}

                <Button
                  size="control"
                  label="Sign in"
                  onPress={() => {
                    void onSubmit();
                  }}
                  loading={submitting}
                  disabled={!canSubmit}
                  fullWidth
                />
              </View>

              <View className="mt-6 items-center">
                <Pressable
                  onPress={() => navigation.navigate("Register")}
                  hitSlop={8}
                  accessibilityRole="link"
                  accessibilityLabel="Create an account"
                >
                  <Text variant="small" tone="muted">
                    Don&apos;t have an account?{" "}
                    <Text variant="small" weight="medium" tone="primary">
                      Create an account
                    </Text>
                  </Text>
                </Pressable>
              </View>
            </Card>

            <View className="mt-6">
              <Text variant="label" tone="muted" className="text-center">
                Demo accounts
              </Text>
              <Text variant="small" tone="muted" className="mt-1.5 text-center">
                Tap a role to fill its credentials.
              </Text>
              <View className="mt-3 flex-row gap-3">
                {demoAccounts.map((account) => {
                  const selected = selectedDemo === account.label;
                  return (
                    <Pressable
                      key={account.email}
                      onPress={() => applyDemoAccount(account)}
                      accessibilityRole="button"
                      accessibilityLabel={`Fill demo ${account.label} credentials`}
                      className={cn(
                        "flex-1 items-center rounded-md border px-3 py-3",
                        "active:opacity-80 hover:opacity-90",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      )}
                    >
                      <Text
                        weight="semibold"
                        tone={selected ? "primary" : "default"}
                      >
                        {account.label}
                      </Text>
                      <Text
                        variant="small"
                        tone="muted"
                        numberOfLines={1}
                        className="mt-0.5"
                      >
                        {account.email}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
