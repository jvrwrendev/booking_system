import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { InventoryListScreen } from "@/features/branch/inventory/screens/inventory-list-screen";
import { ProductDetailScreen } from "@/features/branch/inventory/screens/product-detail-screen";
import { OrderListScreen } from "@/features/branch/orders/screens/order-list-screen";
import { OrderReviewScreen } from "@/features/branch/orders/screens/order-review-screen";
import { OrderDetailScreen } from "@/features/branch/orders/screens/order-detail-screen";
import { ProfileScreen } from "@/features/profile/screens/profile-screen";
import { ProfileEditScreen } from "@/features/profile/screens/profile-edit-screen";
import { ProfileChangePasswordScreen } from "@/features/profile/screens/profile-change-password-screen";
import { ProfileTermsScreen } from "@/features/profile/screens/profile-terms-screen";
import { BranchDashboardScreen } from "@/features/dashboard/branch-dashboard-screen";
import { OrderCartProvider } from "@/features/branch/orders/hooks/use-order-cart";
import { branchNavItems } from "./nav-items";
import type { BranchTabParamList } from "./types";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<BranchTabParamList>();

const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: "#16A34A",
  tabBarInactiveTintColor: "#64748B",
  tabBarStyle: {
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    backgroundColor: "#FFFFFF",
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBarLabelStyle: { fontSize: 11, fontWeight: "500" as const },
};

function BranchTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const item = branchNavItems.find((i) => i.name === route.name);
        const Icon = item?.Icon;
        return {
          ...tabScreenOptions,
          tabBarLabel: item?.label ?? route.name,
          tabBarIcon: Icon
            ? ({ focused, color }: { focused: boolean; color: string }) => (
                <Icon size={20} color={color} opacity={focused ? 1 : 0.7} />
              )
            : undefined,
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={BranchDashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryListScreen} />
      <Tab.Screen name="Orders" component={OrderListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function BranchNavigator() {
  return (
    <OrderCartProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="BranchTabs" component={BranchTabs} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="OrderReview"
          component={OrderReviewScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen
          name="ProfileChangePassword"
          component={ProfileChangePasswordScreen}
        />
        <Stack.Screen name="ProfileTerms" component={ProfileTermsScreen} />
      </Stack.Navigator>
    </OrderCartProvider>
  );
}
