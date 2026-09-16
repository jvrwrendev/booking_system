import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type ScrollViewInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  UserRound,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { cn, formatAddress, validateEmail } from "@/lib/utils";
import { isMindanaoRegion } from "@/lib/psgc-api";
import { AddressSelector } from "@/components/shared/address-selector";
import {
  WizardHeader,
  type WizardStep,
} from "@/components/shared/wizard-header";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types/role";
import type { AddressParts } from "@/types/auth";
import type { RootStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";
const CONTENT_MAX_WIDTH = 420;

type RegisterStep = "account" | "details" | "contact" | "security";

const STEPS: WizardStep<RegisterStep>[] = [
  { key: "account", label: "Account" },
  { key: "details", label: "Details" },
  { key: "contact", label: "Contact" },
  { key: "security", label: "Security" },
];

const STEP_ORDER: RegisterStep[] = [
  "account",
  "details",
  "contact",
  "security",
];

const STEP_META: Record<
  RegisterStep,
  { title: string; description: string }
> = {
  account: {
    title: "Choose your account",
    description:
      "Select the account type that fits how you'll use Agrivet.",
  },
  details: {
    title: "Your details",
    description:
      "Add the name and owner details for the account you selected.",
  },
  contact: {
    title: "Contact & address",
    description:
      "Add your contact details and complete your Mindanao address.",
  },
  security: {
    title: "Secure your account",
    description:
      "Create a password and review your details before registering.",
  },
};

const EMPTY_ADDRESS: AddressParts = {
  street: "",
  purok: "",
  barangay: { code: "", name: "" },
  city: { code: "", name: "" },
  province: { code: "", name: "" },
  region: { code: "", name: "" },
};

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
  const scrollRef = useRef<ScrollViewInstance>(null);

  const [step, setStep] = useState<RegisterStep>("account");
  const [attempted, setAttempted] = useState<Record<RegisterStep, boolean>>({
    account: false,
    details: false,
    contact: false,
    security: false,
  });
  const [role, setRole] = useState<Role>("AGENT");
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [addressParts, setAddressParts] =
    useState<AddressParts>(EMPTY_ADDRESS);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const stepMeta = STEP_META[step];
  const nameLabel = role === "AGENT" ? "Full name" : "Branch name";

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  const nameError =
    attempted.details && !name.trim() ? `${nameLabel} is required.` : undefined;
  const ownerNameError =
    attempted.details && role === "BRANCH" && !ownerName.trim()
      ? "Owner's full name is required."
      : undefined;
  const emailError = attempted.contact ? validateEmail(email) : undefined;
  const contactError =
    attempted.contact && !contactNumber.trim()
      ? "Contact number is required."
      : undefined;
  const addressComplete =
    Boolean(addressParts.street.trim()) &&
    Boolean(addressParts.purok.trim()) &&
    Boolean(addressParts.barangay.name.trim()) &&
    Boolean(addressParts.city.name.trim()) &&
    Boolean(addressParts.province.name.trim()) &&
    Boolean(addressParts.region.name.trim()) &&
    isMindanaoRegion(addressParts.region);
  const addressError =
    attempted.contact && !addressComplete
      ? "Complete the address and select a region within Mindanao."
      : undefined;
  const passwordError =
    attempted.security && password.length < 8
      ? "Password must be at least 8 characters."
      : undefined;
  const confirmError =
    attempted.security && confirmPassword !== password
      ? "Passwords do not match."
      : undefined;
  const termsError =
    attempted.security && !acceptedTerms
      ? "Please agree to the Terms of Service and Privacy Policy."
      : undefined;

  const detailsValid =
    Boolean(name.trim()) &&
    (role !== "BRANCH" || Boolean(ownerName.trim()));
  const contactValid =
    validateEmail(email) === undefined &&
    Boolean(contactNumber.trim()) &&
    addressComplete;
  const securityValid =
    password.length >= 8 &&
    confirmPassword === password &&
    acceptedTerms;
  const canSubmit =
    detailsValid && contactValid && securityValid && !submitting;

  const resetFeedback = () => setError(null);

  const markAttempted = (target: RegisterStep) => {
    setAttempted((previous) =>
      previous[target] ? previous : { ...previous, [target]: true },
    );
  };

  const onChangeRole = (value: Role) => {
    setRole(value);
    setError(null);
  };

  const onBack = () => {
    setError(null);
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStep(STEP_ORDER[stepIndex - 1]);
  };

  const onContinue = () => {
    markAttempted(step);
    setError(null);

    const valid =
      step === "account"
        ? true
        : step === "details"
          ? detailsValid
          : step === "contact"
            ? contactValid
            : securityValid;

    if (!valid) {
      Keyboard.dismiss();
      return;
    }

    if (stepIndex < STEP_ORDER.length - 1) {
      Keyboard.dismiss();
      setStep(STEP_ORDER[stepIndex + 1]);
    }
  };

  const onSubmit = async () => {
    if (submitting) return;

    setAttempted({
      account: true,
      details: true,
      contact: true,
      security: true,
    });
    setError(null);

    if (!canSubmit) {
      Keyboard.dismiss();
      if (!detailsValid) {
        setStep("details");
      } else if (!contactValid) {
        setStep("contact");
      } else {
        setStep("security");
      }
      return;
    }

    setSubmitting(true);
    const result = await register({
      role,
      name: name.trim(),
      ownerName: role === "BRANCH" ? ownerName.trim() : undefined,
      email: email.trim(),
      contactNumber: contactNumber.trim(),
      addressParts: {
        ...addressParts,
        street: addressParts.street.trim(),
        purok: addressParts.purok.trim(),
      },
      password,
      confirmPassword,
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
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <WizardHeader
        title="Create account"
        steps={STEPS}
        activeStep={step}
        onBack={onBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            className="w-full self-center"
            style={{ maxWidth: CONTENT_MAX_WIDTH }}
          >
            <View className="mb-6">
              <Text variant="label" tone="muted" className="mb-2">
                Step {stepIndex + 1} of {STEP_ORDER.length}
              </Text>
              <Text variant="h1" className="text-2xl font-bold tracking-tight">
                {stepMeta.title}
              </Text>
              <Text tone="muted" className="mt-1 text-sm leading-relaxed">
                {stepMeta.description}
              </Text>
            </View>

            {step === "account" ? (
              <View className="gap-5">
                <View className="gap-2.5">
                  <Text variant="label" tone="muted">
                    Account type
                  </Text>
                  <View className="gap-3">
                    {roleOptions.map((option) => {
                      const selected = role === option.value;
                      const RoleIcon =
                        option.value === "AGENT" ? UserRound : Building2;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => onChangeRole(option.value)}
                          accessibilityRole="radio"
                          accessibilityLabel={option.label}
                          accessibilityState={{ checked: selected }}
                          className={cn(
                            "flex-row items-start gap-3 rounded-lg border p-4 active:opacity-90",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-field bg-background"
                          )}
                        >
                          <View
                            className={cn(
                              "mt-0.5 h-10 w-10 items-center justify-center rounded-full",
                              selected ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <RoleIcon
                              size={18}
                              color={selected ? "#FFFFFF" : MUTED_ICON}
                            />
                          </View>
                          <View className="flex-1">
                            <Text weight="semibold">{option.label}</Text>
                            <Text
                              variant="small"
                              tone="muted"
                              className="mt-1 leading-relaxed"
                            >
                              {option.description}
                            </Text>
                          </View>
                          <View
                            className={cn(
                              "mt-0.5 h-5 w-5 items-center justify-center rounded-full border",
                              selected
                                ? "border-primary bg-primary"
                                : "border-border bg-background"
                            )}
                          >
                            {selected ? (
                              <View className="h-2 w-2 rounded-full bg-white" />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}

            {step === "details" ? (
              <View className="gap-4">
                <View className="flex-row items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                  <View className="flex-row items-center gap-2">
                    <Text variant="small" tone="muted">
                      Account type
                    </Text>
                    <Text variant="small" weight="semibold">
                      {role === "AGENT" ? "Agent" : "Branch"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setError(null);
                      setStep("account");
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Change account type"
                  >
                    <Text variant="small" tone="primary" weight="semibold">
                      Change
                    </Text>
                  </Pressable>
                </View>

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

                {role === "BRANCH" ? (
                  <Input
                    size="control"
                    label="Owner's full name"
                    accessibilityLabel="Owner's full name"
                    value={ownerName}
                    onChangeText={(value) => {
                      setOwnerName(value);
                      resetFeedback();
                    }}
                    error={ownerNameError}
                    autoCapitalize="words"
                    textContentType="name"
                    autoComplete="name"
                    placeholder="Juan Dela Cruz"
                    leftIcon={<UserRound size={18} color={MUTED_ICON} />}
                  />
                ) : null}
              </View>
            ) : null}

            {step === "contact" ? (
              <View className="gap-4">
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

                <View className="gap-1.5">
                  <Text variant="label" tone="muted">
                    Address
                  </Text>
                  <AddressSelector
                    value={addressParts}
                    onChange={(next) => {
                      setAddressParts(next);
                      resetFeedback();
                    }}
                    disabled={submitting}
                  />
                  <Text variant="small" tone="muted" className="mt-1">
                    Select a region within Mindanao.
                  </Text>
                  {addressError ? (
                    <Text variant="small" tone="danger" className="mt-1">
                      {addressError}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {step === "security" ? (
              <View className="gap-4">
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
                      onPress={() => setShowPassword((current) => !current)}
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
                      onPress={() =>
                        setShowConfirmPassword((current) => !current)
                      }
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

                <View className="rounded-lg border border-border bg-secondary/50 p-4">
                  <Text variant="label" tone="muted">
                    Review
                  </Text>
                  <View className="mt-3 gap-3">
                    <SummaryRow
                      label="Account type"
                      value={role === "AGENT" ? "Agent" : "Branch"}
                    />
                    <SummaryRow label={nameLabel} value={name.trim() || "—"} />
                    {role === "BRANCH" ? (
                      <SummaryRow
                        label="Owner"
                        value={ownerName.trim() || "—"}
                      />
                    ) : null}
                    <SummaryRow label="Email" value={email.trim() || "—"} />
                    <SummaryRow
                      label="Contact number"
                      value={contactNumber.trim() || "—"}
                    />
                    <SummaryRow
                      label="Address"
                      value={formatAddress(addressParts) || "—"}
                    />
                  </View>
                </View>

                <View className="gap-2">
                  <View className="flex-row items-start gap-2.5">
                    <Pressable
                      onPress={() => {
                        setAcceptedTerms((current) => !current);
                        resetFeedback();
                      }}
                      hitSlop={8}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: acceptedTerms }}
                      accessibilityLabel="Agree to the Terms of Service and Privacy Policy"
                      className={cn(
                        "mt-0.5 h-5 w-5 items-center justify-center rounded-md border",
                        acceptedTerms
                          ? "border-primary bg-primary"
                          : "border-field bg-background"
                      )}
                    >
                      {acceptedTerms ? (
                        <Text className="text-[12px] font-bold leading-none text-white">
                          ✓
                        </Text>
                      ) : null}
                    </Pressable>
                    <Text
                      variant="small"
                      tone="muted"
                      className="flex-1 leading-5"
                    >
                      I agree to the{" "}
                      <Text
                        variant="small"
                        weight="semibold"
                        tone="primary"
                        accessibilityRole="link"
                        onPress={() => navigation.navigate("Terms")}
                      >
                        Terms of Service
                      </Text>{" "}
                      and{" "}
                      <Text
                        variant="small"
                        weight="semibold"
                        tone="primary"
                        accessibilityRole="link"
                        onPress={() => navigation.navigate("Terms")}
                      >
                        Privacy Policy
                      </Text>
                      .
                    </Text>
                  </View>
                  {termsError ? (
                    <Text variant="small" tone="danger">
                      {termsError}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {error ? (
              <View className="mt-4 flex-row items-center gap-2 rounded-md border border-destructive/20 p-3">
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

            <View className="mt-8 gap-3">
              {step === "security" ? (
                <Button
                  label="Create account"
                  size="control"
                  className="mt-1 bg-primary opacity-100"
                  onPress={() => {
                    void onSubmit();
                  }}
                  loading={submitting}
                  fullWidth
                />
              ) : (
                <Button
                  label="Continue"
                  size="control"
                  className="mt-1 bg-primary opacity-100"
                  onPress={onContinue}
                  fullWidth
                />
              )}

              <View className="items-center pt-2">
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5">
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <Text variant="small" weight="medium">
        {value}
      </Text>
    </View>
  );
}
