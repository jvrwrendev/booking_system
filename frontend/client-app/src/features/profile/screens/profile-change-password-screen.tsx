import React, { useEffect, useState } from "react";
import { Keyboard, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { ProfileStackParamList } from "@/app/navigation/types";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MUTED_ICON = "#64748B";

export function ProfileChangePasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rules = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "One number", met: /\d/.test(newPassword) },
  ];
  const newPasswordValid = rules.every((r) => r.met);

  const currentError =
    submitted && !currentPassword ? "Current password is required." : undefined;
  const newError =
    submitted && !newPasswordValid
      ? "Password does not meet the requirements below."
      : undefined;
  const confirmError =
    submitted && confirmPassword !== newPassword
      ? "Passwords do not match."
      : undefined;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => navigation.goBack(), 900);
    return () => clearTimeout(timer);
  }, [saved, navigation]);

  const onSubmit = async () => {
    if (saving || saved) return;
    setSubmitted(true);
    setError(null);

    if (
      !currentPassword ||
      !newPasswordValid ||
      confirmPassword !== newPassword
    ) {
      Keyboard.dismiss();
      return;
    }

    setSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Failed to change your password.");
      return;
    }
    setSaved(true);
  };

  const toggle = (setter: (value: boolean) => void, value: boolean) => () =>
    setter(!value);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ScreenHeader
          title="Change password"
          subtitle="Use a strong password you don't reuse"
        />

        {saved ? (
          <View className="mb-4 flex-row items-start gap-2.5 rounded-xl border border-success/20 bg-success/5 p-3.5">
            <CheckCircle2 size={16} color="#16A34A" style={{ marginTop: 2 }} />
            <Text variant="small" tone="success" className="flex-1 leading-5">
              Password updated. Use your new password the next time you sign in.
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
            label="Current password"
            size="control"
            value={currentPassword}
            onChangeText={(v) => {
              setCurrentPassword(v);
              setError(null);
            }}
            error={currentError}
            secureTextEntry={!showCurrent}
            textContentType="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} color={MUTED_ICON} />}
            rightIcon={
              <Pressable
                onPress={toggle(setShowCurrent, showCurrent)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={
                  showCurrent ? "Hide password" : "Show password"
                }
                className="p-1"
              >
                {showCurrent ? (
                  <EyeOff size={18} color={MUTED_ICON} />
                ) : (
                  <Eye size={18} color={MUTED_ICON} />
                )}
              </Pressable>
            }
          />
          <Input
            label="New password"
            size="control"
            value={newPassword}
            onChangeText={setNewPassword}
            error={newError}
            secureTextEntry={!showNew}
            textContentType="newPassword"
            placeholder="••••••••"
            leftIcon={<KeyRound size={18} color={MUTED_ICON} />}
            rightIcon={
              <Pressable
                onPress={toggle(setShowNew, showNew)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={showNew ? "Hide password" : "Show password"}
                className="p-1"
              >
                {showNew ? (
                  <EyeOff size={18} color={MUTED_ICON} />
                ) : (
                  <Eye size={18} color={MUTED_ICON} />
                )}
              </Pressable>
            }
          />
          <Input
            label="Confirm new password"
            size="control"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmError}
            secureTextEntry={!showConfirm}
            textContentType="newPassword"
            placeholder="••••••••"
            leftIcon={<Lock size={18} color={MUTED_ICON} />}
            rightIcon={
              <Pressable
                onPress={toggle(setShowConfirm, showConfirm)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirm ? "Hide password" : "Show password"
                }
                className="p-1"
              >
                {showConfirm ? (
                  <EyeOff size={18} color={MUTED_ICON} />
                ) : (
                  <Eye size={18} color={MUTED_ICON} />
                )}
              </Pressable>
            }
          />
        </Card>

        <Card className="mt-4">
          <Text variant="label" tone="muted" className="mb-2">
            Password requirements
          </Text>
          <View className="gap-2">
            {rules.map((rule) => (
              <View key={rule.label} className="flex-row items-center gap-2">
                {rule.met ? (
                  <Check size={14} color="#16A34A" />
                ) : (
                  <Circle size={12} color="#94A3B8" />
                )}
                <Text
                  variant="small"
                  tone={rule.met ? "success" : "muted"}
                  className={cn(rule.met && "font-medium")}
                >
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View className="mt-6 gap-3">
          <Button
            label={saved ? "Updated" : "Update password"}
            size="lg"
            fullWidth
            loading={saving}
            disabled={saved}
            onPress={() => {
              void onSubmit();
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
