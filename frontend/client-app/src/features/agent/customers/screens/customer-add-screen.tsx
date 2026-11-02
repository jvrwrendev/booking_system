import React, { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type TextInputInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, ArrowLeft, Phone, UserRound } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { createCustomerForAgent } from "@/services/customer.service";
import { ApiError } from "@/lib/api-client";
import { isMindanaoRegion } from "@/lib/psgc-api";
import type { AddressParts } from "@/types/auth";
import { AddressSelector } from "@/components/shared/address-selector";
import { SuccessDialog } from "@/components/shared/success-dialog";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AgentStackParamList } from "@/app/navigation/types";

const MUTED_ICON = "#64748B";
const CONTACT_PATTERN = /^[0-9+()\-\s]{7,30}$/;

const EMPTY_ADDRESS: AddressParts = {
  street: "",
  barangay: { code: "", name: "" },
  city: { code: "", name: "" },
  province: { code: "", name: "" },
  region: { code: "", name: "" },
};

function validateContactNumber(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Contact number is required.";
  if (!CONTACT_PATTERN.test(trimmed)) {
    return "Enter a valid contact number.";
  }
  return undefined;
}

export function CustomerAddScreen() {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gender, setGender] = useState<string>("");
  const [addressParts, setAddressParts] = useState<AddressParts>(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const contactRef = useRef<TextInputInstance>(null);

  const fullNameError =
    submitted && !fullName.trim() ? "Full name is required." : undefined;
  const contactError = submitted
    ? validateContactNumber(contactNumber)
    : undefined;

  const addressComplete =
    Boolean(addressParts.street.trim()) &&
    Boolean(addressParts.barangay.name.trim()) &&
    Boolean(addressParts.city.name.trim()) &&
    Boolean(addressParts.province.name.trim()) &&
    Boolean(addressParts.region.name.trim()) &&
    isMindanaoRegion(addressParts.region);

  const addressError =
    submitted && !addressComplete
      ? "Complete the address and select a region within Mindanao."
      : undefined;

  const canSubmit =
    Boolean(fullName.trim()) &&
    validateContactNumber(contactNumber) === undefined &&
    addressComplete &&
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
          fullName: fullName.trim(),
          contactNumber: contactNumber.trim(),
          gender: gender || undefined,
          addressParts: {
            ...addressParts,
            street: addressParts.street.trim(),
          },
        },
        user?.agentId ?? "",
        user?.fullName ?? "Agent",
      );
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to add customer. Please try again.",
      );
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
                  label="Full name"
                  value={fullName}
                  onChangeText={setFullName}
                  error={fullNameError}
                  placeholder="Juan Dela Cruz"
                  leftIcon={<UserRound size={18} color={MUTED_ICON} />}
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
                  returnKeyType="done"
                />

                <View>
                  <Text variant="label" tone="muted" className="mb-3">
                    ADDRESS
                  </Text>
                  <AddressSelector
                    value={addressParts}
                    onChange={setAddressParts}
                    disabled={submitting}
                  />
                  {addressError ? (
                    <Text variant="small" tone="danger" className="mt-2">
                      {addressError}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text variant="label" tone="muted" className="mb-2">
                    GENDER (OPTIONAL)
                  </Text>
                  <View className="flex-row gap-3">
                    {["Male", "Female", "Other"].map((option) => {
                      const selected = gender === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setGender(option)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          className={`flex-1 items-center rounded-md border px-3 py-3 ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background"
                          }`}
                        >
                          <Text
                            weight="semibold"
                            className={
                              selected ? "text-primary" : "text-foreground"
                            }
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

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
                  className="bg-primary disabled:bg-primary/40"
                  textClassName="text-white"
                  onPress={() => {
                    void onSubmit();
                  }}
                  loading={submitting}
                  disabled={submitting}
                  fullWidth
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessDialog
        visible={success}
        title="Customer added"
        description="The customer has been saved successfully."
        confirmLabel="Done"
        onConfirm={() => {
          setSuccess(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}
