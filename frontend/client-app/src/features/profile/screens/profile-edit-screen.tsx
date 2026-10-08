import React, { useEffect, useMemo, useState } from "react";
import { Keyboard, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { validateEmail } from "@/lib/utils";
import type { ProfileStackParamList } from "@/app/navigation/types";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

export function ProfileEditScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user, updateProfile } = useAuth();
  const { label } = useRole();

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    contactNumber: user?.contactNumber ?? "",
    address: user?.address ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(
    () => ({
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      contactNumber: user?.contactNumber ?? "",
      address: user?.address ?? "",
    }),
    [user]
  );

  const dirty = useMemo(
    () =>
      form.fullName !== initial.fullName ||
      form.email !== initial.email ||
      form.contactNumber !== initial.contactNumber ||
      form.address !== initial.address,
    [form, initial]
  );

  const nameError =
    submitted && !form.fullName.trim() ? "Full name is required." : undefined;
  const emailError = submitted ? validateEmail(form.email) : undefined;
  const contactError =
    submitted && !form.contactNumber.trim()
      ? "Contact number is required."
      : undefined;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => navigation.goBack(), 900);
    return () => clearTimeout(timer);
  }, [saved, navigation]);

  const onSave = async () => {
    if (saving || saved) return;
    setSubmitted(true);
    setError(null);

    if (
      !form.fullName.trim() ||
      validateEmail(form.email) ||
      !form.contactNumber.trim()
    ) {
      Keyboard.dismiss();
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      address: form.address.trim(),
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Failed to update your account.");
      return;
    }
    setSaved(true);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ScreenHeader
          title="Update account"
          subtitle="Keep your details up to date"
        />

        {saved ? (
          <View className="mb-4 flex-row items-start gap-2.5 rounded-xl border border-success/20 bg-success/5 p-3.5">
            <CheckCircle2 size={16} color="#16A34A" style={{ marginTop: 2 }} />
            <Text variant="small" tone="success" className="flex-1 leading-5">
              Your account has been updated successfully.
            </Text>
          </View>
        ) : error ? (
          <View className="mb-4 flex-row items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 p-3.5">
            <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2 }} />
            <Text variant="small" tone="danger" className="flex-1 leading-5">
              {error}
            </Text>
          </View>
        ) : null}

        <Card className="gap-4">
          <Input
            label="Full name"
            size="control"
            value={form.fullName}
            onChangeText={(v) => setForm({ ...form, fullName: v })}
            error={nameError}
            placeholder="Juan Dela Cruz"
            leftIcon={<UserRound size={18} color="#64748B" />}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Input
            label="Email address"
            size="control"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            error={emailError}
            placeholder="name@agrivet.ph"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            leftIcon={<Mail size={18} color="#64748B" />}
          />
          <Input
            label="Contact number"
            size="control"
            value={form.contactNumber}
            onChangeText={(v) => setForm({ ...form, contactNumber: v })}
            error={contactError}
            placeholder="+63 917 000 0000"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            leftIcon={<Phone size={18} color="#64748B" />}
          />
          <Input
            label="Address"
            size="control"
            value={form.address}
            onChangeText={(v) => setForm({ ...form, address: v })}
            placeholder="Street, barangay, city, province"
            multiline
            numberOfLines={3}
            leftIcon={<MapPin size={18} color="#64748B" />}
          />
        </Card>

        <Text variant="label" tone="muted" className="mb-2 mt-5">
          Account details
        </Text>
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="small" tone="muted">
              Username
            </Text>
            <Text variant="small" weight="semibold">
              {user?.username ?? "—"}
            </Text>
          </View>
          <Divider />
          <View className="flex-row items-center justify-between">
            <Text variant="small" tone="muted">
              Role
            </Text>
            <Text variant="small" weight="semibold">
              {label || "—"}
            </Text>
          </View>
          <Divider />
          <View className="flex-row items-center justify-between">
            <Text variant="small" tone="muted">
              Account ID
            </Text>
            <Text variant="small" weight="semibold">
              {user?.agentId ?? user?.branchId ?? user?.id ?? "—"}
            </Text>
          </View>
        </Card>

        <View className="mt-6 gap-3">
          <Button
            label={saved ? "Saved" : "Save changes"}
            size="lg"
            fullWidth
            loading={saving}
            disabled={!dirty || saved}
            onPress={() => {
              void onSave();
            }}
          />
          <Button
            label="Cancel"
            variant="outline"
            size="lg"
            fullWidth
            disabled={saving || saved}
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
