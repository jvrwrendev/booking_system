import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type TextInputInstance,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  X,
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

const ICON_COLOR = "#64748B";

export function ProfileChangePasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { changePassword } = useAuth();

  const newPasswordRef = useRef<TextInputInstance>(null);
  const confirmPasswordRef = useRef<TextInputInstance>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Validation Rules
  const rules = useMemo(
    () => [
      { id: "length", label: "At least 8 characters", met: newPassword.length >= 8 },
      { id: "uppercase", label: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
      { id: "number", label: "One number", met: /\d/.test(newPassword) },
    ],
    [newPassword]
  );

  const metCount = useMemo(() => rules.filter((r) => r.met).length, [rules]);
  const isNewPasswordValid = metCount === rules.length;
  const isConfirmMatching = confirmPassword.length > 0 && confirmPassword === newPassword;

  // Strength score calculation for visual progress bar
  const strengthScore = useMemo(() => {
    if (!newPassword) return 0;
    return metCount;
  }, [newPassword, metCount]);

  // Dynamic Error Messaging
  const currentError =
    submitted && !currentPassword ? "Current password is required." : undefined;
  const newError =
    submitted && !isNewPasswordValid
      ? "Password must meet all requirements."
      : undefined;
  const confirmError =
    submitted && confirmPassword !== newPassword
      ? "Passwords do not match."
      : undefined;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => navigation.goBack(), 1000);
    return () => clearTimeout(timer);
  }, [saved, navigation]);

  const onSubmit = async () => {
    if (saving || saved) return;
    Keyboard.dismiss();
    setSubmitted(true);
    setServerError(null);

    if (!currentPassword || !isNewPasswordValid || confirmPassword !== newPassword) {
      return;
    }

    setSaving(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.success) {
        setServerError(result.error ?? "Failed to change your password. Please try again.");
      } else {
        setSaved(true);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStrengthBarColor = () => {
    if (strengthScore === 1) return "bg-danger";
    if (strengthScore === 2) return "bg-warning";
    if (strengthScore === 3) return "bg-success";
    return "bg-muted";
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="Change password"
            subtitle="Update your security credentials with a strong password"
          />

          {/* Alert Banners */}
          {saved ? (
            <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
              <CheckCircle2 size={18} color="#16A34A" />
              <Text variant="small" tone="success" className="flex-1 font-medium leading-5">
                Password updated! Returning to your profile...
              </Text>
            </View>
          ) : serverError ? (
            <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
              <AlertCircle size={18} color="#DC2626" />
              <Text variant="small" tone="danger" className="flex-1 font-medium leading-5">
                {serverError}
              </Text>
            </View>
          ) : null}

          {/* Input Form Card */}
          <Card className="gap-4 p-4 rounded-xl border border-gray-100">
            {/* Current Password */}
            <Input
              label="Current password"
              size="control"
              value={currentPassword}
              onChangeText={(v) => {
                setCurrentPassword(v);
                if (serverError) setServerError(null);
              }}
              error={currentError}
              secureTextEntry={!showCurrent}
              textContentType="password"
              autoComplete="password"
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              placeholder="Enter current password"
              leftIcon={<Lock size={18} color={ICON_COLOR} />}
              rightIcon={
                <Pressable
                  onPress={() => setShowCurrent((prev) => !prev)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={showCurrent ? "Hide password" : "Show password"}
                  className="p-1"
                >
                  {showCurrent ? (
                    <EyeOff size={18} color={ICON_COLOR} />
                  ) : (
                    <Eye size={18} color={ICON_COLOR} />
                  )}
                </Pressable>
              }
            />

            {/* New Password */}
            <View className="gap-2">
              <Input
                inputRef={newPasswordRef}
                label="New password"
                size="control"
                value={newPassword}
                onChangeText={(v) => {
                  setNewPassword(v);
                  if (serverError) setServerError(null);
                }}
                error={newError}
                secureTextEntry={!showNew}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                placeholder="Enter new password"
                leftIcon={<KeyRound size={18} color={ICON_COLOR} />}
                rightIcon={
                  <Pressable
                    onPress={() => setShowNew((prev) => !prev)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={showNew ? "Hide password" : "Show password"}
                    className="p-1"
                  >
                    {showNew ? (
                      <EyeOff size={18} color={ICON_COLOR} />
                    ) : (
                      <Eye size={18} color={ICON_COLOR} />
                    )}
                  </Pressable>
                }
              />

              {/* Dynamic Password Strength Indicator */}
              {newPassword.length > 0 && (
                <View className="mt-1 gap-1.5 px-0.5">
                  <View className="flex-row items-center justify-between">
                    <Text variant="small" tone="muted">
                      Password strength
                    </Text>
                    <Text
                      variant="small"
                      className={cn(
                        "font-semibold",
                        strengthScore === 1 && "text-danger",
                        strengthScore === 2 && "text-warning",
                        strengthScore === 3 && "text-success"
                      )}
                    >
                      {strengthScore === 1 && "Weak"}
                      {strengthScore === 2 && "Medium"}
                      {strengthScore === 3 && "Strong"}
                    </Text>
                  </View>
                  <View className="h-1.5 w-full flex-row gap-1 overflow-hidden rounded-full bg-muted/20">
                    <View
                      className={cn(
                        "h-full flex-1 rounded-full transition-all",
                        strengthScore >= 1 ? getStrengthBarColor() : "bg-transparent"
                      )}
                    />
                    <View
                      className={cn(
                        "h-full flex-1 rounded-full transition-all",
                        strengthScore >= 2 ? getStrengthBarColor() : "bg-transparent"
                      )}
                    />
                    <View
                      className={cn(
                        "h-full flex-1 rounded-full transition-all",
                        strengthScore >= 3 ? getStrengthBarColor() : "bg-transparent"
                      )}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Confirm New Password */}
            <View className="gap-1">
              <Input
                inputRef={confirmPasswordRef}
                label="Confirm new password"
                size="control"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (serverError) setServerError(null);
                }}
                error={confirmError}
                secureTextEntry={!showConfirm}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                placeholder="Re-enter new password"
                leftIcon={<Lock size={18} color={ICON_COLOR} />}
                rightIcon={
                  <Pressable
                    onPress={() => setShowConfirm((prev) => !prev)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirm ? "Hide password" : "Show password"}
                    className="p-1"
                  >
                    {showConfirm ? (
                      <EyeOff size={18} color={ICON_COLOR} />
                    ) : (
                      <Eye size={18} color={ICON_COLOR} />
                    )}
                  </Pressable>
                }
              />

              {/* Confirm Match Feedback Indicator */}
              {confirmPassword.length > 0 && (
                <View className="mt-1 flex-row items-center gap-1.5 px-0.5">
                  {isConfirmMatching ? (
                    <>
                      <Check size={14} color="#16A34A" />
                      <Text variant="small" tone="success" className="font-medium">
                        Passwords match
                      </Text>
                    </>
                  ) : (
                    <>
                      <X size={14} color="#DC2626" />
                      <Text variant="small" tone="danger" className="font-medium">
                        Passwords do not match
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </Card>

          {/* Password Requirements Checklist */}
          <Card className="mt-4 p-4 rounded-xl border border-gray-100">
            <View className="flex-row items-center gap-2 mb-3">
              <ShieldCheck size={16} color={ICON_COLOR} />
              <Text variant="label" tone="muted" className="font-semibold uppercase tracking-wider">
                Requirements
              </Text>
            </View>
            <View className="gap-2.5">
              {rules.map((rule) => (
                <View key={rule.id} className="flex-row items-center gap-2.5">
                  <View
                    className={cn(
                      "h-5 w-5 items-center justify-center rounded-full border",
                      rule.met
                        ? "border-success/30 bg-success/15"
                        : "border-muted bg-muted/10"
                    )}
                  >
                    {rule.met ? (
                      <Check size={12} color="#16A34A" strokeWidth={3} />
                    ) : (
                      <View className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </View>
                  <Text
                    variant="small"
                    tone={rule.met ? "default" : "muted"}
                    className={cn("text-xs transition-all", rule.met && "font-medium text-success")}
                  >
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>

        {/* Action Buttons (pinned to bottom) */}
        <View className="border-t border-gray-100 bg-background px-4 pb-3 pt-4">
          <Button
            label={saved ? "Updated" : "Update password"}
            size="lg"
            fullWidth
            loading={saving}
            onPress={onSubmit}
          />
          <View className="mt-3">
            <Button
              label="Cancel"
              variant="outline"
              size="lg"
              fullWidth
              disabled={saving || saved}
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}