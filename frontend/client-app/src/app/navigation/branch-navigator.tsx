import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FavoritesScreen } from "@/features/branch/favorites/screens/favorites-screen";
import { ProductDetailScreen } from "@/features/branch/inventory/screens/product-detail-screen";
import { OrderListScreen } from "@/features/branch/orders/screens/order-list-screen";
import { OrderCreateScreen } from "@/features/branch/orders/screens/order-create-screen";
import { OrderDetailScreen } from "@/features/branch/orders/screens/order-detail-screen";
import { ProfileScreen } from "@/features/profile/screens/profile-screen";
import { ProfileEditScreen } from "@/features/profile/screens/profile-edit-screen";
import { ProfileChangePasswordScreen } from "@/features/profile/screens/profile-change-password-screen";
import { ProfileTermsScreen } from "@/features/profile/screens/profile-terms-screen";
import { BranchDashboardScreen } from "@/features/dashboard/branch-dashboard-screen";
import { CatalogScreen } from "@/features/catalog/screens/catalog-screen";
import { CatalogProductDetailScreen } from "@/features/catalog/screens/catalog-product-detail-screen";
import { OrderCartProvider } from "@/features/branch/orders/hooks/use-order-cart";
import { branchNavItems } from "./nav-items";
import { TabIcon, useTabScreenOptions } from "./tab-bar";
import type { BranchStackParamList, BranchTabParamList } from "./types";

const Stack = createNativeStackNavigator<BranchStackParamList>();
const Tab = createBottomTabNavigator<BranchTabParamList>();

function BranchTabs() {
  const tabOptions = useTabScreenOptions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const item = branchNavItems.find((i) => i.name === route.name);
        const Icon = item?.Icon;
        return {
          ...tabOptions,
          tabBarLabel: item?.label ?? route.name,
          tabBarIcon: Icon
            ? ({
                focused,
                color,
              }: {
                focused: boolean;
                color: string;
              }) => <TabIcon Icon={Icon} focused={focused} color={color} />
            : undefined,
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={BranchDashboardScreen} />
      <Tab.Screen name="Catalog" component={CatalogScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
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
          name="CatalogProductDetail"
          component={CatalogProductDetailScreen}
        />
        <Stack.Screen
          name="OrderCreate"
          component={OrderCreateScreen}
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
