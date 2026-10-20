import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  UserRound,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { BUSINESS_NAME } from "@/constants";
import { cn } from "@/lib/utils";
import { listGoogleAccounts } from "@/services/auth.service";
import type { GoogleProfile } from "@/types/auth";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/types/role";
import { GoogleIcon } from "./google-button";

const AVATAR_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
const MUTED_ICON = "#64748B";
const PRIMARY_ICON = "#0F172A";
const roleOptions: Role[] = ["AGENT", "BRANCH"];

function avatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

interface GoogleSignInModalProps {
  visible: boolean;
  mode: "login" | "register";
  loading?: boolean;
  onCancel: () => void;
  onSignIn: (profile: GoogleProfile) => void;
  onSignUp: (profile: GoogleProfile, role: Role) => void;
}

interface GoogleChooserProps {
  mode: "login" | "register";
  loading: boolean;
  onCancel: () => void;
  onSignIn: (profile: GoogleProfile) => void;
  onSignUp: (profile: GoogleProfile, role: Role) => void;
}

function GoogleChooser({
  mode,
  loading,
  onCancel,
  onSignIn,
  onSignUp,
}: GoogleChooserProps) {
  const accounts = listGoogleAccounts();
  const [selected, setSelected] = useState<GoogleProfile | null>(null);
  const [role, setRole] = useState<Role>("AGENT");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 28,
      }}
    >
      {selected && mode === "register" ? (
        <>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setSelected(null)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back to account list"
              disabled={loading}
            >
              <ArrowLeft size={18} color={PRIMARY_ICON} />
            </Pressable>
            <Text variant="h3" weight="semibold">
              Choose your role
            </Text>
          </View>
          <Text variant="small" tone="muted" className="mt-1">
            Continue as {selected.email}
          </Text>

          <View className="mt-4 gap-3">
            {roleOptions.map((option) => {
              const isSelected = role === option;
              const Icon = option === "AGENT" ? UserRound : Building2;
              return (
                <Pressable
                  key={option}
                  onPress={() => setRole(option)}
                  disabled={loading}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: isSelected,
                    selected: isSelected,
                    disabled: loading,
                  }}
                  className={cn(
                    "rounded-xl border p-4 active:bg-accent/10",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background",
                    loading && "opacity-60"
                  )}
                >
                  <View className="flex-row items-center gap-2">
                    <Icon
                      size={16}
                      color={isSelected ? PRIMARY_ICON : MUTED_ICON}
                    />
                    <Text weight="semibold">{ROLE_LABELS[option]}</Text>
                  </View>
                  <Text variant="small" tone="muted" className="mt-1 leading-5">
                    {ROLE_DESCRIPTIONS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="small" tone="muted" className="mt-3 leading-5">
            You can fill in your contact details and branch name later from
            Profile.
          </Text>

          <Button
            label="Continue with Google"
            size="control"
            fullWidth
            loading={loading}
            leftIcon={<GoogleIcon />}
            onPress={() => {
              setPendingEmail(selected.email);
              onSignUp(selected, role);
            }}
            className="mt-4"
          />
          <Button
            label="Cancel"
            variant="ghost"
            fullWidth
            disabled={loading}
            onPress={onCancel}
            className="mt-1"
          />
        </>
      ) : (
        <>
          <View className="flex-row items-center gap-2">
            <GoogleIcon size={20} />
            <Text variant="h3" weight="semibold">
              Choose an account
            </Text>
          </View>
          <Text variant="small" tone="muted" className="mt-1">
            {mode === "login" ? "to continue to" : "to sign up for"}{" "}
            {BUSINESS_NAME}
          </Text>

          <View className="mt-4">
            {accounts.map((account) => {
              const isPending = pendingEmail === account.email;
              return (
                <Pressable
                  key={account.id}
                  disabled={loading}
                  onPress={() => {
                    if (mode === "login") {
                      setPendingEmail(account.email);
                      onSignIn(account);
                    } else {
                      setSelected(account);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue as ${account.fullName}`}
                  className={cn(
                    "mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-background p-3 active:bg-accent/10",
                    loading && !isPending && "opacity-50"
                  )}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: avatarColor(account.email),
                    }}
                  >
                    <Text weight="bold" className="text-sm text-white">
                      {account.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text weight="semibold" numberOfLines={1}>
                      {account.fullName}
                    </Text>
                    <Text variant="small" tone="muted" numberOfLines={1}>
                      {account.email}
                    </Text>
                  </View>
                  {loading && isPending ? (
                    <ActivityIndicator size="small" color={PRIMARY_ICON} />
                  ) : (
                    <ChevronRight size={16} color={MUTED_ICON} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text
            variant="small"
            tone="muted"
            className="mt-2 text-center leading-5"
          >
            By continuing, Google will share your name and email address with{" "}
            {BUSINESS_NAME}.
          </Text>

          <Button
            label="Cancel"
            variant="ghost"
            fullWidth
            disabled={loading}
            onPress={onCancel}
            className="mt-3"
          />
        </>
      )}
    </ScrollView>
  );
}

export function GoogleSignInModal({
  visible,
  mode,
  loading = false,
  onCancel,
  onSignIn,
  onSignUp,
}: GoogleSignInModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable onPress={onCancel} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={() => {}}
          className="w-full self-center rounded-t-2xl border-t border-border bg-background"
        >
          <GoogleChooser
            mode={mode}
            loading={loading}
            onCancel={onCancel}
            onSignIn={onSignIn}
            onSignUp={onSignUp}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
