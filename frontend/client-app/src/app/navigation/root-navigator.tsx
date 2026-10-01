import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/features/auth/screens/login-screen";
import { AgentNavigator } from "./agent-navigator";
import { BranchNavigator } from "./branch-navigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  dark: false,
  colors: {
    primary: "#16A34A",
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#0F172A",
    border: "#E5E7EB",
    notification: "#DC2626",
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "800" },
  },
};

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#16A34A" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === "AGENT" ? (
          <Stack.Screen name="Agent" component={AgentNavigator} />
        ) : (
          <Stack.Screen name="Branch" component={BranchNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}