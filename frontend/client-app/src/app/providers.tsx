import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/features/auth/screens/login-screen";
import type { AuthUser } from "@/types/auth";
import { AgentNavigator } from "./agent-navigator";
import { BranchNavigator } from "./branch-navigator";
import { View } from "react-native";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <NavigationContainer theme={{
      dark: false,
      colors: {
        primary: "#16A34A",
        background: "#FFFFFF",
        card: "#FFFFFF",
        text: "#0F172A",
        border: "#E5E7EB",
        notification: "#DC2626",
      },
    }}>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          {!user ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
            </Stack.Navigator>
          ) : user.role === "AGENT" ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Agent" component={AgentNavigator} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Branch" component={BranchNavigator} />
            </Stack.Navigator>
          )}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </NavigationContainer>
  );
}

export function AppProviders({ children }: { children?: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </GestureHandlerRootView>
  );
}