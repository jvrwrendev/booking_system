import React, { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  Camera,
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
import { pickProfileImage } from "@/lib/image-picker";
import type { ProfileStackParamList } from "@/app/navigation/types";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Avatar } from "@/components/ui/avatar";

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
  const [avatar, setAvatar] = useState(user?.avatar);
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
      avatar: user?.avatar,
    }),
    [user]
  );

  const dirty = useMemo(
    () =>
      form.fullName !== initial.fullName ||
      form.email !== initial.email ||
      form.contactNumber !== initial.contactNumber ||
      form.address !== initial.address ||
      avatar !== initial.avatar,
    [form, avatar, initial]
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
      avatar,
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ScreenHeader
          title="Update Account"
          subtitle="Keep your profile and contact details up to date"
          className="mb-4"
        />

        {/* Profile Photo (agents) */}
        {user?.role === "AGENT" ? (
          <View className="mb-5 items-center">
            <View className="relative">
              <Avatar
                name={form.fullName || user?.fullName || "?"}
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
                accessibilityLabel="Change profile photo"
                className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border border-border bg-background active:bg-accent/10"
              >
                <Camera size={15} color="#0F172A" />
              </Pressable>
            </View>
            <View className="mt-3 flex-row items-center gap-2">
              <Button
                label="Change photo"
                variant="outline"
                size="sm"
                disabled={saving || saved}
                onPress={() => {
                  void onChangePhoto();
                }}
              />
              {avatar ? (
                <Button
                  label="Remove photo"
                  variant="ghost"
                  size="sm"
                  disabled={saving || saved}
                  onPress={() => setAvatar(undefined)}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Status Messages */}
        {saved ? (
          <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <Text
              variant="small"
              weight="medium"
              className="flex-1 text-emerald-700 leading-5"
            >
              Account updated successfully! Redirecting...
            </Text>
          </View>
        ) : error ? (
          <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertCircle size={18} className="text-destructive" />
            <Text
              variant="small"
              weight="medium"
              className="flex-1 text-destructive leading-5"
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Form Controls Container */}
        <Card className="gap-4 p-5 border border-border/60 rounded-2xl bg-card shadow-none">
          <Input
            label="Full Name"
            size="control"
            value={form.fullName}
            onChangeText={(v) => setForm({ ...form, fullName: v })}
            error={nameError}
            placeholder="Juan Dela Cruz"
            leftIcon={<UserRound size={18} className="text-muted-foreground" />}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Input
            label="Email Address"
            size="control"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            error={emailError}
            placeholder="name@agrivet.ph"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            leftIcon={<Mail size={18} className="text-muted-foreground" />}
          />

          <Input
            label="Contact Number"
            size="control"
            value={form.contactNumber}
            onChangeText={(v) => setForm({ ...form, contactNumber: v })}
            error={contactError}
            placeholder="+63 917 000 0000"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            leftIcon={<Phone size={18} className="text-muted-foreground" />}
          />

          <Input
            label="Address"
            size="control"
            value={form.address}
            onChangeText={(v) => setForm({ ...form, address: v })}
            placeholder="Street, barangay, city, province"
            multiline
            numberOfLines={3}
            leftIcon={
              <MapPin
                size={18}
                className="text-muted-foreground"
                style={{ marginTop: 2 }}
              />
            }
          />
        </Card>

        {/* Read-Only Meta Details */}
        <Text
          variant="label"
          tone="muted"
          className="mb-2 mt-6 px-1 uppercase text-xs font-semibold tracking-wider"
        >
          System Account Details
        </Text>
        <Card className="gap-3 p-4 border border-border/60 rounded-2xl bg-card shadow-none">
          <View className="flex-row items-center justify-between">
            <Text variant="small" tone="muted">
              Username
            </Text>
            <Text variant="small" weight="semibold" className="text-foreground">
              {user?.username ?? "—"}
            </Text>
          </View>

          <Divider className="bg-border/40" />

          <View className="flex-row items-center justify-between">
            <Text variant="small" tone="muted">
              Role
            </Text>
            <Text variant="small" weight="semibold" className="text-foreground">
              {label || "—"}
            </Text>
          </View>

          <Divider className="bg-border/40" />

          <View className="flex-row items-center justify-between">
            <Text variant="small" tone="muted">
              Account ID
            </Text>
            <Text
              variant="small"
              weight="semibold"
              className="font-mono text-xs text-muted-foreground"
            >
              {user?.agentId ?? user?.branchId ?? user?.id ?? "—"}
            </Text>
          </View>
        </Card>

        {/* Form Actions */}
        <View className="mt-8 gap-3">
          <Button
            label={saved ? "Saved" : "Save changes"}
            size="lg"
            fullWidth
            loading={saving}
            disabled={!dirty || saved}
            className="rounded-xl shadow-none"
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
            className="rounded-xl border-border/60 shadow-none bg-background"
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
