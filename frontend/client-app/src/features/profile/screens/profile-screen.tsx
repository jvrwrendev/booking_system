import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText,
  Hash,
  Info,
  KeyRound,
  LogOut,
  SquarePen,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { listBookingsForAgent } from "@/services/booking.service";
import { listCustomersForAgent } from "@/services/customer.service";
import { listOrdersForBranch } from "@/services/branch-order.service";
import { listProducts } from "@/services/product.service";
import { getBranchById } from "@/services/directory.service";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ProfileStackParamList } from "@/app/navigation/types";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { MenuRow } from "@/features/profile/components/menu-row";
import { APP_NAME, APP_VERSION, BUSINESS_NAME } from "@/constants";

type ProfileNavigation = NativeStackNavigationProp<ProfileStackParamList>;

interface StatEntry {
  label: string;
  value: number;
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { label } = useRole();
  const navigation = useNavigation<ProfileNavigation>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [signOutVisible, setSignOutVisible] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (user.role === "AGENT") {
        const [bookings, customers] = await Promise.all([
          listBookingsForAgent(user.agentId ?? ""),
          listCustomersForAgent(user.agentId ?? ""),
        ]);
        setStats([
          { label: "Total Bookings", value: bookings.length },
          { label: "Active Customers", value: customers.length },
        ]);
        setBranchCode(null);
      } else {
        const [branch, orders, products] = await Promise.all([
          getBranchById(user.branchId ?? ""),
          listOrdersForBranch(user.branchId ?? ""),
          listProducts(),
        ]);
        setStats([
          { label: "Products", value: products.length },
          { label: "Total Orders", value: orders.length },
        ]);
        setBranchCode(branch?.code ?? null);
      }
      setError(null);
    } catch {
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const onLogout = useCallback(() => {
    setSignOutVisible(false);
    void logout();
  }, [logout]);

  if (!user) return null;

  const idChip =
    user.role === "AGENT"
      ? (user.agentId ?? "")
      : (branchCode ?? user.branchId ?? "");

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Profile" subtitle="Your account at a glance" />

        <Card className="items-center mb-4">
          <Avatar
            name={user.fullName ?? "?"}
            size="xl"
            className="border-2 border-primary/40"
          />
          <Text variant="h2" weight="bold" className="mt-3 text-center">
            {user.fullName || "Unknown"}
          </Text>
          <Text variant="small" tone="muted" className="mt-1 text-center">
            {user.email}
          </Text>

          <View className="mt-3 flex-row items-center gap-2">
            <Badge label={label || "Member"} tone="primary" />
            <Badge
              label={user.status === "active" ? "Active" : "Inactive"}
              tone={user.status === "active" ? "success" : "muted"}
            />
          </View>

          {idChip ? (
            <View className="mt-3 flex-row items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
              <Hash size={12} color="#64748B" />
              <Text variant="small" weight="semibold">
                {idChip}
              </Text>
            </View>
          ) : null}
        </Card>

        {loading ? (
          <LoadingState label="Loading profile..." />
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : (
          <>
            <View className="mb-4 flex-row gap-3">
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  tone="primary"
                  className="flex-1"
                />
              ))}
            </View>

            <Card className="mb-4">
              <View className="flex-row">
                <View className="flex-1 pr-2">
                  <Text variant="small" tone="muted">
                    Member since
                  </Text>
                  <Text variant="small" weight="semibold" className="mt-0.5">
                    {formatDate(user.createdAt) || "—"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text variant="small" tone="muted">
                    Last login
                  </Text>
                  <Text variant="small" weight="semibold" className="mt-0.5">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : "—"}
                  </Text>
                </View>
              </View>
              <Divider className="my-3" />
              <View className="flex-row items-center gap-2">
                <Info size={14} color="#64748B" />
                <Text variant="small" tone="muted" className="flex-1">
                  Signed in as {user.username} · {BUSINESS_NAME}
                </Text>
              </View>
            </Card>
          </>
        )}

        <Text variant="label" tone="muted" className="mb-2">
          Account
        </Text>
        <Card padded={false} className="mb-4">
          <View className="px-4">
            <MenuRow
              icon={SquarePen}
              label="Update account"
              subtitle="Name, email, contact number, address"
              onPress={() => navigation.navigate("ProfileEdit")}
            />
            <Divider />
            <MenuRow
              icon={KeyRound}
              label="Change password"
              subtitle="Update your sign-in password"
              onPress={() => navigation.navigate("ProfileChangePassword")}
            />
          </View>
        </Card>

        <Text variant="label" tone="muted" className="mb-2">
          Legal
        </Text>
        <Card padded={false} className="mb-4">
          <View className="px-4">
            <MenuRow
              icon={FileText}
              label="Terms & Policy"
              subtitle="Terms of service and privacy policy"
              onPress={() => navigation.navigate("ProfileTerms")}
            />
          </View>
        </Card>

        <Button
          label="Sign out"
          variant="destructive"
          size="lg"
          fullWidth
          leftIcon={<LogOut size={16} color="#FFFFFF" />}
          onPress={() => setSignOutVisible(true)}
        />

        <View className="mt-6 items-center">
          <Text variant="small" tone="muted" className="text-center">
            {APP_NAME} · Version {APP_VERSION}
          </Text>
          <Text variant="small" tone="muted" className="mt-0.5 text-center">
            © {new Date().getFullYear()} {BUSINESS_NAME}
          </Text>
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={signOutVisible}
        title="Sign out?"
        description="You will need to sign in again to access your account."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        destructive
        onConfirm={onLogout}
        onCancel={() => setSignOutVisible(false)}
      />
    </SafeAreaView>
  );
}
