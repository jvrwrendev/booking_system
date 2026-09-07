import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "@/hooks/use-auth";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/constants";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/app/navigation/types";

const demoAccounts = [
  {
    label: "Agent",
    email: "roberto.garcia@agrivet.ph",
    password: "password",
  },
  {
    label: "Branch",
    email: "davao@agrivet.ph",
    password: "password",
  },
];

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Login failed");
    }
    // Navigation handled by root navigator based on auth state
  };

  if (authLoading) return null;

  return (
    <>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <View className="flex-row items-center mb-8 mt-2">
          <View className="h-10 w-10 rounded-md bg-primary items-center justify-center">
            <Leaf size={20} color="#fff" />
          </View>
          <View className="ml-3">
            <Text weight="bold">{BUSINESS_NAME}</Text>
            <Text variant="small" tone="muted">
              {APP_FULL_NAME}
            </Text>
          </View>
        </View>

        <Text variant="display" weight="bold">
          Welcome back
        </Text>
        <Text tone="muted" className="mt-1">
          Sign in to manage your customers, bookings, and orders.
        </Text>

        <View className="mt-6 gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@agrivet.ph"
            leftIcon={<Mail size={16} color="#64748B" />}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            leftIcon={<Lock size={16} color="#64748B" />}
            rightIcon={
              <Pressable onPress={() => setShowPassword((s) => !s)}>
                {showPassword ? (
                  <EyeOff size={16} color="#64748B" />
                ) : (
                  <Eye size={16} color="#64748B" />
                )}
              </Pressable>
            }
          />

          {error ? (
            <View className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2">
              <Text variant="small" tone="danger">
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            label="Sign in"
            onPress={onSubmit}
            loading={submitting}
            fullWidth
            size="lg"
          />

          <View className="mt-8 rounded-lg border border-border bg-secondary/40 p-4">
            <Text weight="semibold" className="mb-2">
              Demo accounts
            </Text>
            <Text variant="small" tone="muted" className="mb-3">
              Use these accounts to explore each role.
            </Text>
            <View className="gap-2">
              {demoAccounts.map((acc) => (
                <Pressable
                  key={acc.email}
                  onPress={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    setError(null);
                  }}
                  className="rounded-md border border-border bg-background p-3 active:bg-secondary"
                >
                  <Text weight="semibold">{acc.label}</Text>
                  <Text variant="small" tone="muted" className="mt-0.5">
                    {acc.email}
                  </Text>
                  <Text variant="small" tone="muted" className="mt-0.5">
                    password: {acc.password}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}