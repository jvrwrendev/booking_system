import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabs } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AgentStackParamList } from "./types";
import { AgentDashboardScreen } from "@/features/dashboard/agent-dashboard-screen";
import { CustomerListScreen } from "@/features/agent/customers/screens/customer-list-screen";
import { CustomerAddScreen } from "@/features/agent/customers/screens/customer-add-screen";
import { CustomerDetailScreen } from "@/features/agent/customers/screens/customer-detail-screen";
import { BookingListScreen } from "@/features/agent/bookings/screens/booking-list-screen";
import { BookingCreateScreen } from "@/features/agent/bookings/screens/booking-create-screen";
import { BookingDetailScreen } from "@/features/agent/bookings/screens/booking-detail-screen";
import { ProfileScreen } from "@/features/profile/screens/profile-screen";
import { Tab as TabNav } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator<AgentStackParamList["AgentTabs"]>();

function makeTabLabel(
  name: string,
  options: { focused: boolean; color: string }
) {
  const item = [
    { name: "Dashboard", label: "Dashboard", Icon: null },
    { name: "Customers", label: "Customers", Icon: null },
    { name: "Bookings", label: "Bookings", Icon: null },
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
    { name: "Customers", Icon: "Users" },
    { name: "Bookings", Icon: "ClipboardList" },
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

function AgentTabs() {
  return (
    <Tab.Navigator
      screenOptions={(props) => ({
        ...tabScreenOptions,
        tabBarLabel: ({ focused, color }) => makeTabLabel(props.route.name, { focused, color }),
        tabBarIcon: ({ focused, color }) => makeTabIcon(props.route.name, { focused, color }),
      })}
    >
      <Tab.Screen name="Dashboard" component={AgentDashboardScreen} />
      <Tab.Screen name="Customers" component={CustomerListScreen} />
      <Tab.Screen name="Bookings" component={BookingListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AgentNavigator() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabScreenOptions,
      tabBarLabel: ({ focused, color }) =>
        makeTabLabel(route.name, { focused, color }),
      tabBarIcon: ({ focused, color }) =>
        makeTabIcon(route.name, { focused, color }),
    })}>
      <Tab.Screen name="AgentTabs" component={AgentTabs} />
      <Tab.Screen name="CustomerAdd" component={CustomerAddScreen} />
      <Tab.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Tab.Screen name="BookingCreate" component={BookingCreateScreen} options={{ gestureEnabled: false }} />
      <Tab.Screen name="BookingDetail" component={BookingDetailScreen} />
    </Tab.Navigator>
  );
}