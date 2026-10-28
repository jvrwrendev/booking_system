import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  ChevronRight,
  FileText,
  KeyRound,
  LogOut,
  Moon,
  SquarePen,
  User,
} from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { listBookingsForAgent } from "@/services/booking.service";
import { listCustomersForAgent } from "@/services/customer.service";
import { listOrdersForBranch } from "@/services/branch-order.service";
import { getBranchById } from "@/services/directory.service";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ProfileStackParamList } from "@/app/navigation/types";
import { Text } from "@/components/ui/text";
import { Avatar } from "@/components/ui/avatar";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { BrandLogo } from "@/components/shared/brand-logo";
import { APP_NAME, APP_VERSION, STORAGE_KEYS } from "@/constants";

type ProfileNavigation = NativeStackNavigationProp<ProfileStackParamList>;

interface StatEntry {
  label: string;
  value: number;
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { favoriteIds } = useFavorites();
  const navigation = useNavigation<ProfileNavigation>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [branchName, setBranchName] = useState<string>("Davao Branch");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [signOutVisible, setSignOutVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(
          STORAGE_KEYS.NOTIFICATIONS_ENABLED,
        );
        if (stored !== null) setNotificationsEnabled(stored === "true");
      } catch {
        /* keep default */
      }
    })();
  }, []);

  const onToggleNotifications = useCallback((value: boolean) => {
    setNotificationsEnabled(value);
    void AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS_ENABLED,
      String(value),
    ).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      if (user.role === "AGENT") {
        const [bookings, customers] = await Promise.all([
          listBookingsForAgent(user.agentId ?? ""),
          listCustomersForAgent(user.agentId ?? ""),
        ]);
        setStats([
          { label: "Bookings", value: bookings.length },
          { label: "Customers", value: customers.length },
        ]);
      } else {
        const [branch, orders] = await Promise.all([
          getBranchById(user.branchId ?? ""),
          listOrdersForBranch(user.branchId ?? ""),
        ]);
        setStats([
          { label: "Favorites", value: favoriteIds.length },
          { label: "Orders", value: orders.length },
        ]);
        if (branch?.name) {
          setBranchName(branch.name);
        }
      }
      setError(null);
    } catch {
      setError("Failed to load profile details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favoriteIds.length, user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const onLogout = useCallback(() => {
    setSignOutVisible(false);
    void logout();
  }, [logout]);

  if (!user) return null;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#F8F9FA]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top Bar / Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BrandLogo size={40} />
            <View>
              <Text className="text-xl font-bold text-gray-900">Settings</Text>
              <Text className="mt-0.5 text-xs text-gray-400">
                Manage your account
              </Text>
            </View>
          </View>
          <View className="rounded-full border border-gray-200 bg-white px-3 py-1">
            <Text className="text-xs font-medium text-gray-600">
              {branchName}
            </Text>
          </View>
        </View>

        {/* Profile Avatar & Info */}
        <View className="items-center my-4">
          <View className="relative">
            <View className="h-24 w-24 rounded-full border-2 border-[#10B981] p-0.5 items-center justify-center bg-white">
              <Avatar
                name={user.fullName || "User"}
                uri={user.avatar}
                size="xl"
                className="h-full w-full"
              />
            </View>
            <Pressable
              onPress={() => navigation.navigate("ProfileEdit")}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[#10B981] items-center justify-center active:opacity-80"
            >
              <SquarePen size={13} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text className="mt-3 text-base font-semibold text-gray-900 text-center">
            {user.fullName || "User"}
          </Text>
          {user.email ? (
            <Text className="text-xs text-gray-400 mt-0.5 text-center">
              {user.email}
            </Text>
          ) : null}
        </View>

        {/* Stats Card */}
        {loading ? (
          <View className="py-4">
            <LoadingState label="Loading stats..." />
          </View>
        ) : error ? (
          <View className="py-2">
            <ErrorState description={error} onRetry={() => void loadData()} />
          </View>
        ) : (
          <View className="my-3 flex-row items-center rounded-xl bg-white py-3.5 border border-gray-100">
            {stats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                {index > 0 ? <View className="h-8 w-px bg-gray-200" /> : null}
                <View className="flex-1 items-center">
                  <Text className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {stat.label}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Account Section */}
        <View className="mt-4">
          <Text className="text-xs text-gray-400 font-medium mb-2 px-1">
            Account
          </Text>
          <View className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <Pressable
              onPress={() => navigation.navigate("ProfileEdit")}
              className="flex-row items-center gap-3 p-4 active:bg-gray-50 border-b border-gray-100"
            >
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User size={18} color="#16A34A" />
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-800">
                Update Profile
              </Text>
              <ChevronRight size={18} color="#94A3B8" />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("ProfileChangePassword")}
              className="flex-row items-center gap-3 p-4 active:bg-gray-50"
            >
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <KeyRound size={18} color="#16A34A" />
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-800">
                Security and Password
              </Text>
              <ChevronRight size={18} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* Others Section */}
        <View className="mt-5">
          <Text className="text-xs text-gray-400 font-medium mb-2 px-1">
            Others
          </Text>
          <View className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <View className="flex-row items-center gap-3 p-4 border-b border-gray-100">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Bell size={18} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">
                  Notifications
                </Text>
                <Text className="mt-0.5 text-xs text-gray-400">
                  {notificationsEnabled ? "On" : "Off"}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={onToggleNotifications}
                trackColor={{ false: "#E2E8F0", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center gap-3 p-4">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Moon size={18} color="#16A34A" />
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-800">
                Dark Mode
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: "#E2E8F0", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Legal Section */}
        <View className="mt-5">
          <Text className="text-xs text-gray-400 font-medium mb-2 px-1">
            Legal
          </Text>
          <View className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <Pressable
              onPress={() => navigation.navigate("ProfileTerms")}
              className="flex-row items-center gap-3 p-4 active:bg-gray-50"
            >
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <FileText size={18} color="#16A34A" />
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-800">
                Terms & Policy
              </Text>
              <ChevronRight size={18} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        <View className="mt-5">
          <Pressable
            onPress={() => setSignOutVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            className="flex-row items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-4 active:bg-danger/10"
          >
            <LogOut size={18} color="#DC2626" />
            <Text className="text-sm font-semibold text-[#DC2626]">
              Sign out
            </Text>
          </Pressable>
        </View>

        <View className="mt-8 items-center gap-1">
          {user.createdAt ? (
            <Text className="text-xs text-gray-400 text-center">
              Member since {formatDate(user.createdAt)}
            </Text>
          ) : null}
          {user.lastLogin ? (
            <Text className="text-xs text-gray-400 text-center">
              Last active {formatDateTime(user.lastLogin)}
            </Text>
          ) : null}
          <Text className="text-sm font-medium text-gray-500 text-center mt-4">
            {APP_NAME || "Agrivet Supply"} V.{APP_VERSION || "2.0"}
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