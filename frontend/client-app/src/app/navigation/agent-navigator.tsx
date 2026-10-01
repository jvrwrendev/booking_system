import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CustomerListScreen } from "@/features/agent/customers/screens/customer-list-screen";
import { CustomerAddScreen } from "@/features/agent/customers/screens/customer-add-screen";
import { CustomerDetailScreen } from "@/features/agent/customers/screens/customer-detail-screen";
import { BookingListScreen } from "@/features/agent/bookings/screens/booking-list-screen";
import { BookingCreateScreen } from "@/features/agent/bookings/screens/booking-create-screen";
import { BookingDetailScreen } from "@/features/agent/bookings/screens/booking-detail-screen";
import { ProfileScreen } from "@/features/profile/screens/profile-screen";
import { AgentDashboardScreen } from "@/features/dashboard/agent-dashboard-screen";
import { agentNavItems } from "./nav-items";
import type { AgentTabParamList } from "./types";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<AgentTabParamList>();

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

function AgentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const item = agentNavItems.find((i) => i.name === route.name);
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
      <Tab.Screen name="Dashboard" component={AgentDashboardScreen} />
      <Tab.Screen name="Customers" component={CustomerListScreen} />
      <Tab.Screen name="Bookings" component={BookingListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AgentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgentTabs" component={AgentTabs} />
      <Stack.Screen name="CustomerAdd" component={CustomerAddScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen
        name="BookingCreate"
        component={BookingCreateScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
    </Stack.Navigator>
  );
}