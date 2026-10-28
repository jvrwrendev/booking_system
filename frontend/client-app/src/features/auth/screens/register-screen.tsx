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
import { BrandLogo } from "@/components/shared/brand-logo";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  Eye,
  EyeOff,
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
import { pickProfileImage } from "@/lib/image-picker";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/constants";
import type { Role } from "@/types/role";
import type { RootStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";
const PRIMARY_ICON = "#0F172A";
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
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
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
    submitted && password.length < 8
      ? "Password must be at least 8 characters."
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
    password.length >= 8 &&
    confirmPassword === password &&
    !submitting;

  const resetFeedback = () => setError(null);

  const onChangeRole = (value: Role) => {
    setRole(value);
    setSubmitted(false);
    setError(null);
  };

  const onChangePhoto = async () => {
    const { uri, error: pickError } = await pickProfileImage();
    if (pickError) {
      setError(pickError);
      return;
    }
    if (uri) {
      setError(null);
      setAvatar(uri);
    }
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
      avatar: role === "AGENT" ? avatar : undefined,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Registration failed. Please try again.");
      return;
    }

    // Registration succeeded — the account is not active until the email is
    // verified. Send the user to the verification screen.
    navigation.navigate("VerifyEmail", { email: email.trim().toLowerCase() });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1">
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
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="mb-6 h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </Pressable>

            {/* Header Section */}
            <View className="mb-8 items-center">
              <BrandLogo size={48} />
              <Text weight="semibold" className="mt-3 text-base tracking-tight">
                {BUSINESS_NAME}
              </Text>
              <Text variant="small" tone="muted" className="mt-0.5 text-xs">
                {APP_FULL_NAME}
              </Text>
            </View>

            {/* Title Section */}
            <View className="mb-6">
              <Text variant="h1" className="text-2xl font-bold tracking-tight">
                Create account
              </Text>
              <Text tone="muted" className="mt-1 text-sm leading-relaxed">
                Select your role and enter your details to get started.
              </Text>
            </View>

            {/* Role Switcher (Flat Segmented Control) */}
            <View className="mb-6">
              <Text
                variant="label"
                tone="muted"
                className="mb-2 text-xs font-medium uppercase tracking-wider"
              >
                Account Role
              </Text>
              <View className="flex-row rounded-lg border border-border p-1">
                {roleOptions.map((option) => {
                  const selected = role === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => onChangeRole(option.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, selected }}
                      className={cn(
                        "flex-1 flex-row items-center justify-center gap-2 rounded-md py-2.5",
                        selected ? "border border-border" : "border-transparent"
                      )}
                    >
                      {option.value === "AGENT" ? (
                        <UserRound
                          size={16}
                          color={selected ? PRIMARY_ICON : MUTED_ICON}
                        />
                      ) : (
                        <Building2
                          size={16}
                          color={selected ? PRIMARY_ICON : MUTED_ICON}
                        />
                      )}
                      <Text
                        weight={selected ? "semibold" : "regular"}
                        className={cn(
                          "text-sm",
                          selected ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Profile Photo (agents) */}
            {role === "AGENT" ? (
              <View className="mb-6 items-center">
                <View className="relative">
                  <Avatar
                    name={name || "?"}
                    size="xl"
                    uri={avatar}
                    className="border border-border"
                  />
                  <Pressable
                    onPress={() => {
                      void onChangePhoto();
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Add profile photo"
                    className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border border-border bg-background active:bg-accent/10"
                  >
                    <Camera size={15} color={PRIMARY_ICON} />
                  </Pressable>
                </View>
                <View className="mt-3 flex-row items-center gap-2">
                  <Button
                    label={avatar ? "Change photo" : "Add photo"}
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onPress={() => {
                      void onChangePhoto();
                    }}
                  />
                  {avatar ? (
                    <Button
                      label="Remove"
                      variant="ghost"
                      size="sm"
                      disabled={submitting}
                      onPress={() => setAvatar(undefined)}
                    />
                  ) : null}
                </View>
                <Text variant="small" tone="muted" className="mt-2 text-center">
                  Optional — you can add it later from your profile.
                </Text>
              </View>
            ) : null}

            {/* Form Section */}
            <View className="gap-4">
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
                label="Email address"
                accessibilityLabel="Email address"
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
                placeholder="At least 8 characters"
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
                <View className="flex-row items-center gap-2 rounded-md border border-destructive/20 p-3">
                  <AlertCircle size={16} color="#DC2626" />
                  <Text
                    variant="small"
                    tone="danger"
                    className="flex-1 text-xs"
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <View className="mt-2">
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
            </View>

            {/* Footer Navigation Link */}
            <View className="mt-8 items-center">
              <Pressable
                onPress={() => navigation.navigate("Login")}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Go to sign in"
              >
                <Text variant="small" tone="muted">
                  Already have an account?{" "}
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
