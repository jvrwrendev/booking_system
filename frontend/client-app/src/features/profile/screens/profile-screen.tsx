import React, { useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/avatar";
import { BUSINESS_NAME } from "@/constants";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { label } = useRole();

  const onLogout = useCallback(() => {
    void logout();
  }, [logout]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <SectionHeader title="Profile" />

        <Card className="items-center mb-4">
          <Avatar name={user?.fullName ?? "?"} size="lg" className="mb-3" />
          <Text variant="h2" weight="bold">
            {user?.fullName ?? "Unknown"}
          </Text>
          <Text variant="small" tone="muted" className="mt-1">
            {user?.email ?? ""}
          </Text>
          <View className="mt-3 rounded-md bg-secondary px-3 py-1">
            <Text variant="small" tone="primary" weight="semibold">
              {label || "Member"}
            </Text>
          </View>
        </Card>

        <Card>
          <Text variant="h3" weight="semibold">
            {BUSINESS_NAME}
          </Text>
          <Text variant="small" tone="muted" className="mt-1">
            Signed in as {user?.username ?? "user"}.
          </Text>
        </Card>

        <Button
          label="Sign out"
          variant="outline"
          fullWidth
          className="mt-6"
          onPress={onLogout}
        />
      </View>
    </SafeAreaView>
  );
}