import React, { useState } from "react";
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
  Building2,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserRound,
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
import type { Role } from "@/types/role";
import type { RootStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";
const CONTENT_MAX_WIDTH = 420;

const roleOptions: { value: Role; label: string; description: string }[] = [
  {
    value: "AGENT",
    label: "Agent",
    description: "Manage customers and create bookings on their behalf.",
  },
  {
    value: "BRANCH",
    label: "Branch",
    description: "Order inventory and monitor order progress.",
  },
];

export function RegisterScreen() {
  const { register } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height } = useWindowDimensions();

  const [role, setRole] = useState<Role>("AGENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isWideViewport = Platform.OS === "web" && height >= 640;
  const nameLabel = role === "AGENT" ? "Full name" : "Branch name";

  const nameError =
    submitted && !name.trim() ? `${nameLabel} is required.` : undefined;
  const emailError = submitted ? validateEmail(email) : undefined;
  const contactError =
    submitted && !contactNumber.trim()
      ? "Contact number is required."
      : undefined;
  const addressError =
    submitted && role === "BRANCH" && !address.trim()
      ? "Address is required."
      : undefined;
  const passwordError =
    submitted && password.length < 6
      ? "Password must be at least 6 characters."
      : undefined;
  const confirmError =
    submitted && confirmPassword !== password
      ? "Passwords do not match."
      : undefined;

  const canSubmit =
    Boolean(name.trim()) &&
    validateEmail(email) === undefined &&
    Boolean(contactNumber.trim()) &&
    (role === "AGENT" || Boolean(address.trim())) &&
    password.length >= 6 &&
    confirmPassword === password &&
    !submitting;

  const resetFeedback = () => setError(null);

  const onChangeRole = (value: Role) => {
    setRole(value);
    setSubmitted(false);
    setError(null);
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitted(true);
    setError(null);

    if (!canSubmit) {
      Keyboard.dismiss();
      return;
    }

    setSubmitting(true);
    const result = await register({
      role,
      name: name.trim(),
      email: email.trim(),
      contactNumber: contactNumber.trim(),
      address: address.trim(),
      password,
      confirmPassword,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Registration failed. Please try again.");
    }
    // On success the auth provider sets the user and the root navigator
    // swaps to the role home screen.
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
                  Create your account
                </Text>
                <Text tone="muted" className="mt-1.5 leading-relaxed">
                  Register as an agent or a branch to get started.
                </Text>
              </View>

              <View className="mt-8">
                <Text variant="label" tone="muted" className="mb-1.5">
                  Register as
                </Text>
                <View className="gap-3">
                  {roleOptions.map((option) => {
                    const selected = role === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => onChangeRole(option.value)}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: selected,
                          selected,
                        }}
                        accessibilityLabel={`Register as ${option.label}`}
                        className={cn(
                          "flex-row items-center gap-3 rounded-md border p-3",
                          "active:opacity-80 hover:opacity-90",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background"
                        )}
                      >
                        <View
                          className={cn(
                            "h-9 w-9 items-center justify-center rounded-md",
                            selected ? "bg-primary" : "bg-secondary"
                          )}
                        >
                          {option.value === "AGENT" ? (
                            <UserRound
                              size={18}
                              color={selected ? "#FFFFFF" : MUTED_ICON}
                            />
                          ) : (
                            <Building2
                              size={18}
                              color={selected ? "#FFFFFF" : MUTED_ICON}
                            />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text weight="semibold">{option.label}</Text>
                          <Text
                            variant="small"
                            tone="muted"
                            className="mt-0.5 leading-relaxed"
                          >
                            {option.description}
                          </Text>
                        </View>
                        <View
                          className={cn(
                            "h-5 w-5 items-center justify-center rounded-full border",
                            selected ? "border-primary" : "border-border"
                          )}
                        >
                          {selected && (
                            <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="mt-6 gap-5">
                <Input
                  size="control"
                  label={nameLabel}
                  accessibilityLabel={nameLabel}
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    resetFeedback();
                  }}
                  error={nameError}
                  autoCapitalize="words"
                  textContentType="name"
                  autoComplete="name"
                  placeholder={
                    role === "AGENT"
                      ? "Juan Dela Cruz"
                      : "Quezon City Main Branch"
                  }
                  leftIcon={
                    role === "AGENT" ? (
                      <UserRound size={18} color={MUTED_ICON} />
                    ) : (
                      <Building2 size={18} color={MUTED_ICON} />
                    )
                  }
                />

                <Input
                  size="control"
                  label="Email"
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    resetFeedback();
                  }}
                  error={emailError}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  placeholder="you@agrivet.ph"
                  leftIcon={<Mail size={18} color={MUTED_ICON} />}
                />

                <Input
                  size="control"
                  label="Contact number"
                  accessibilityLabel="Contact number"
                  value={contactNumber}
                  onChangeText={(value) => {
                    setContactNumber(value);
                    resetFeedback();
                  }}
                  error={contactError}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  placeholder="+63 917 555 0000"
                  leftIcon={<Phone size={18} color={MUTED_ICON} />}
                />

                {role === "BRANCH" && (
                  <Input
                    size="control"
                    label="Address"
                    accessibilityLabel="Address"
                    value={address}
                    onChangeText={(value) => {
                      setAddress(value);
                      resetFeedback();
                    }}
                    error={addressError}
                    autoCapitalize="words"
                    textContentType="fullStreetAddress"
                    autoComplete="street-address"
                    placeholder="123 EDSA, Quezon City"
                    leftIcon={<MapPin size={18} color={MUTED_ICON} />}
                  />
                )}

                <Input
                  size="control"
                  label="Password"
                  accessibilityLabel="Password"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    resetFeedback();
                  }}
                  error={passwordError}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
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
                />

                <Input
                  size="control"
                  label="Confirm password"
                  accessibilityLabel="Confirm password"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    resetFeedback();
                  }}
                  error={confirmError}
                  secureTextEntry={!showConfirmPassword}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  leftIcon={<Lock size={18} color={MUTED_ICON} />}
                  rightIcon={
                    <Pressable
                      onPress={() => setShowConfirmPassword((s) => !s)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color={MUTED_ICON} />
                      ) : (
                        <Eye size={18} color={MUTED_ICON} />
                      )}
                    </Pressable>
                  }
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
                ) : null}

                <Button
                  size="control"
                  label="Create account"
                  onPress={() => {
                    void onSubmit();
                  }}
                  loading={submitting}
                  fullWidth
                />
              </View>
            </Card>

            <View className="mt-6 items-center">
              <Pressable
                onPress={() => navigation.navigate("Login")}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Go to sign in"
              >
                <Text variant="small" tone="muted">
                  Already have an account?{" "}
                  <Text variant="small" weight="medium" tone="primary">
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
