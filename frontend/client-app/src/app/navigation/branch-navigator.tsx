import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabs } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BranchStackParamList } from "./types";
import { BranchDashboardScreen } from "@/features/dashboard/branch-dashboard-screen";
import { InventoryListScreen } from "@/features/branch/inventory/screens/inventory-list-screen";
import { ProductDetailScreen } from "@/features/branch/inventory/screens/product-detail-screen";
import { OrderListScreen } from "@/features/branch/orders/screens/order-list-screen";
import { OrderReviewScreen } from "@/features/branch/orders/screens/order-review-screen";
import { OrderDetailScreen } from "@/features/branch/orders/screens/order-detail-screen";
import { Tab as TabNav } from "@react-navigation/bottom-tabs";
import { OrderCartProvider } from "@/features/branch/orders/hooks/use-order-cart";

const Tab = createBottomTabNavigator<BranchStackParamList["BranchTabs"]>();

function makeTabLabel(
  name: string,
  options: { focused: boolean; color: string }
) {
  const item = [
    { name: "Dashboard", label: "Dashboard", Icon: null },
    { name: "Inventory", label: "Inventory", Icon: null },
    { name: "Orders", label: "Orders", Icon: null },
    { name: "Profile", label: "Profile", Icon: null },
  ].find((i) => i.name === name);
  return (
    <Text
      variant="small"
      weight={options.focused ? "semibold" : "medium"}
      style={{ color: options.color }}
    >
      {item?.label ?? name}
    </Text>
  );
}

function makeTabIcon(
  name: string,
  options: { focused: boolean; color: string }
) {
  const item = [
    { name: "Dashboard", Icon: "LayoutDashboard" },
    { name: "Inventory", Icon: "Boxes" },
    { name: "Orders", Icon: "ShoppingBag" },
    { name: "Profile", Icon: "UserCircle2" },
  ].find((i) => i.name === name);
  if (!item) return null;
  const Icon = item.Icon;
  return (
    <View
      style={{
        opacity: options.focused ? 1 : 0.7,
        transform: [{ scale: options.focused ? 1.05 : 1 }],
      }}
    >
      <Text
        variant="small"
        tone={options.focused ? "primary" : "muted"}
        style={{ width: 20, height: 20 }}
      >
        {Icon}
      </Text>
    </View>
  );
}

const tabScreenOptions = {
  headerShown: false,
  tabBarStyle: {
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    backgroundColor: "#FFFFFF",
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBarActiveTintColor: "#16A34A",
  tabBarInactiveTintColor: "#64748B",
};

function BranchTabs() {
  return (
    <Tab.Navigator
      screenOptions={(props) => ({
        ...tabScreenOptions,
        tabBarLabel: ({ focused, color }) =>
          makeTabLabel(props.route.name, { focused, color }),
        tabBarIcon: ({ focused, color }) => makeTabIcon(props.route.name, { focused, color }),
      })}
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
      <Tab.Navigator screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarLabel: ({ focused, color }) =>
          makeTabLabel(route.name, { focused, color }),
        tabBarIcon: ({ focused, color }) => makeTabIcon(route.name, { focused, color }),
      })}>
        <Tab.Screen name="BranchTabs" component={BranchTabs} />
        <Tab.Screen name="ProductDetail" component={ProductDetailScreen} options={{ gestureEnabled: false }} />
        <Tab.Screen name="OrderReview" component={OrderReviewScreen} options={{ gestureEnabled: false }} />
        <Tab.Screen name="OrderDetail" component={OrderDetailScreen} />
      </Tab.Navigator>
    </OrderCartProvider>
  );
}