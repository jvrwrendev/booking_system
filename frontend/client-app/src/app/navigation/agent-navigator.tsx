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
import { ProfileEditScreen } from "@/features/profile/screens/profile-edit-screen";
import { ProfileChangePasswordScreen } from "@/features/profile/screens/profile-change-password-screen";
import { ProfileTermsScreen } from "@/features/profile/screens/profile-terms-screen";
import { AgentDashboardScreen } from "@/features/dashboard/agent-dashboard-screen";
import { CatalogScreen } from "@/features/catalog/screens/catalog-screen";
import { CatalogProductDetailScreen } from "@/features/catalog/screens/catalog-product-detail-screen";
import { agentNavItems } from "./nav-items";
import { TabIcon, useTabScreenOptions } from "./tab-bar";
import type { AgentTabParamList } from "./types";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator<AgentTabParamList>();

function AgentTabs() {
  const tabOptions = useTabScreenOptions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const item = agentNavItems.find((i) => i.name === route.name);
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
      <Tab.Screen name="Dashboard" component={AgentDashboardScreen} />
      <Tab.Screen name="Customers" component={CustomerListScreen} />
      <Tab.Screen name="Bookings" component={BookingListScreen} />
      <Tab.Screen name="Catalog" component={CatalogScreen} />
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
      <Stack.Screen
        name="CatalogProductDetail"
        component={CatalogProductDetailScreen}
      />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen
        name="ProfileChangePassword"
        component={ProfileChangePasswordScreen}
      />
      <Stack.Screen name="ProfileTerms" component={ProfileTermsScreen} />
    </Stack.Navigator>
  );
}
