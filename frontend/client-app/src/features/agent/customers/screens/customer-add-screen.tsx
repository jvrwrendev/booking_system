import React, { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { createCustomerForAgent } from "@/services/customer.service";
import { validateEmail } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AgentStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";

export function CustomerAddScreen() {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const contactRef = useRef<TextInput>(null);

  const firstNameError =
    submitted && !firstName.trim() ? "First name is required." : undefined;
  const lastNameError =
    submitted && !lastName.trim() ? "Last name is required." : undefined;
  const emailError = submitted ? validateEmail(email) : undefined;
  const contactError =
    submitted && !contactNumber.trim()
      ? "Contact number is required."
      : undefined;
  const addressError = submitted && !street.trim() && !city.trim()
    ? "Please enter a street and city."
    : undefined;

  const canSubmit =
    Boolean(firstName.trim()) &&
    Boolean(lastName.trim()) &&
    validateEmail(email) === undefined &&
    Boolean(contactNumber.trim()) &&
    !submitting;

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitted(true);
    setError(null);

    if (!canSubmit) {
      Keyboard.dismiss();
      return;
    }

    setSubmitting(true);
    try {
      await createCustomerForAgent(
        {
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          suffix: suffix.trim(),
          email: email.trim(),
          contactNumber: contactNumber.trim(),
          addressParts: {
            street: street.trim(),
            barangay: { code: "", name: barangay.trim() },
            city: { code: "", name: city.trim() },
            province: { code: "", name: province.trim() },
            region: { code: "", name: region.trim() },
          },
          notes: notes.trim(),
        },
        user?.agentId ?? "",
        user?.fullName ?? "Agent",
      );
      navigation.goBack();
    } catch {
      setError("Failed to add customer. Please try again.");
    } finally {
      setSubmitting(false);
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
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="w-full self-center" style={{ maxWidth: 420 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="mb-6 h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </Pressable>

            <Text variant="h1" className="tracking-tight">
              Add Customer
            </Text>
            <Text tone="muted" className="mt-1.5 leading-relaxed">
              Enter the customer&apos;s details below.
            </Text>

            <View className="mt-6">
              <View className="gap-5">
                <Input
                  size="control"
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={firstNameError}
                  placeholder="Juan"
                  leftIcon={<UserRound size={18} color={MUTED_ICON} />}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
                <Input
                  size="control"
                  label="Middle name (optional)"
                  value={middleName}
                  onChangeText={setMiddleName}
                  placeholder="Santos"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
                <Input
                  inputRef={lastNameRef}
                  size="control"
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  error={lastNameError}
                  placeholder="Dela Cruz"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                <Input
                  size="control"
                  label="Suffix (optional)"
                  value={suffix}
                  onChangeText={setSuffix}
                  placeholder="Jr."
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                <Input
                  inputRef={emailRef}
                  size="control"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  error={emailError}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="juan@example.com"
                  leftIcon={<Mail size={18} color={MUTED_ICON} />}
                  returnKeyType="next"
                  onSubmitEditing={() => contactRef.current?.focus()}
                />
                <Input
                  inputRef={contactRef}
                  size="control"
                  label="Contact number"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  error={contactError}
                  keyboardType="phone-pad"
                  placeholder="+63 900 000 0000"
                  leftIcon={<Phone size={18} color={MUTED_ICON} />}
                  returnKeyType="next"
                />

                <View>
                  <Text variant="label" tone="muted" className="mb-3">
                    ADDRESS
                  </Text>
                  <View className="gap-5">
                    <Input
                      size="control"
                      label="Street"
                      value={street}
                      onChangeText={setStreet}
                      error={addressError}
                      placeholder="123 Rizal St"
                      leftIcon={<MapPin size={18} color={MUTED_ICON} />}
                    />
                    <Input
                      size="control"
                      label="Barangay"
                      value={barangay}
                      onChangeText={setBarangay}
                      placeholder="Barangay name"
                    />
                    <Input
                      size="control"
                      label="City / Municipality"
                      value={city}
                      onChangeText={setCity}
                      placeholder="City name"
                      leftIcon={<Building2 size={18} color={MUTED_ICON} />}
                    />
                    <Input
                      size="control"
                      label="Province"
                      value={province}
                      onChangeText={setProvince}
                      placeholder="Province name"
                    />
                    <Input
                      size="control"
                      label="Region"
                      value={region}
                      onChangeText={setRegion}
                      placeholder="Region name"
                    />
                  </View>
                </View>

                <Input
                  size="control"
                  label="Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Delivery preferences, etc."
                  multiline
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
                  label="Save Customer"
                  onPress={() => {
                    void onSubmit();
                  }}
                  loading={submitting}
                  disabled={!canSubmit}
                  fullWidth
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
