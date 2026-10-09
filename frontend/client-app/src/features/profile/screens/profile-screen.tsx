import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, KeyRound, LogOut, SquarePen } from "lucide-react-native";
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
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/avatar";
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="small" weight="semibold" className="text-right">
        {value}
      </Text>
    </View>
  );
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { label } = useRole();
  const navigation = useNavigation<ProfileNavigation>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [signOutVisible, setSignOutVisible] = useState(false);

  const loadData = useCallback(async () => {
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
      setError("Failed to load profile details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SectionHeader
          title="Settings"
          subtitle="Manage your account"
          action={
            <Pressable
              onPress={() => setSignOutVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              className="h-10 w-10 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 active:opacity-70"
            >
              <LogOut size={18} color="#DC2626" />
            </Pressable>
          }
        />

        {/* Identity */}
        <View className="items-center pb-5">
          <Avatar name={user.fullName ?? "?"} size="xl" uri={user.avatar} />
          <Text variant="h3" weight="semibold" className="mt-3 text-center">
            {user.fullName || "Unknown User"}
          </Text>
          <Text variant="small" tone="muted" className="mt-0.5 text-center">
            {user.email}
          </Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            {label || "Member"} ·{" "}
            {user.status === "active" ? "Active" : "Inactive"}
            {idChip ? ` · ${idChip}` : ""}
          </Text>
        </View>

        <Divider />

        {/* Stats */}
        {loading ? (
          <View className="py-6">
            <LoadingState label="Loading stats..." />
          </View>
        ) : error ? (
          <View className="py-4">
            <ErrorState description={error} onRetry={() => void loadData()} />
          </View>
        ) : (
          <View className="flex-row py-5">
            {stats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                {index > 0 ? <View className="w-px bg-border" /> : null}
                <View className="flex-1 items-center px-2">
                  <Text variant="h2" weight="bold">
                    {stat.value}
                  </Text>
                  <Text
                    variant="small"
                    tone="muted"
                    className="mt-1 text-center"
                  >
                    {stat.label}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        <Divider />

        {/* Account details */}
        <View className="flex-col gap-2.5 py-5">
          <InfoRow
            label="Member since"
            value={formatDate(user.createdAt) || "—"}
          />
          <InfoRow
            label="Last active"
            value={user.lastLogin ? formatDateTime(user.lastLogin) : "—"}
          />
          <InfoRow label="Account" value={user.username} />
        </View>

        <Divider />

        {/* Settings */}
        <View className="pt-5">
          <Text variant="label" tone="muted" className="mb-1">
            Account
          </Text>
          <MenuRow
            icon={SquarePen}
            label="Update Profile"
            subtitle="Name, contact number, address"
            onPress={() => navigation.navigate("ProfileEdit")}
          />
          <Divider className="bg-border/60" />
          <MenuRow
            icon={KeyRound}
            label="Security & Password"
            subtitle="Update your sign-in credentials"
            onPress={() => navigation.navigate("ProfileChangePassword")}
          />
        </View>

        <View className="pt-6">
          <Text variant="label" tone="muted" className="mb-1">
            Legal
          </Text>
          <MenuRow
            icon={FileText}
            label="Terms & Privacy Policy"
            subtitle="Service terms and data protection policies"
            onPress={() => navigation.navigate("ProfileTerms")}
          />
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text variant="small" tone="muted" className="text-center">
            {APP_NAME} · Version {APP_VERSION}
          </Text>
          <Text
            variant="small"
            tone="muted"
            className="mt-1 text-center opacity-70"
          >
            © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={signOutVisible}
        title="Sign out of your account?"
        description="You will need to re-enter your credentials to access your dashboard."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        destructive
        onConfirm={onLogout}
        onCancel={() => setSignOutVisible(false)}
      />
    </SafeAreaView>
  );
}
