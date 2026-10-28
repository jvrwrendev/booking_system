import React, { useEffect, useState } from "react";
import { NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { SplashScreen } from "@/components/shared/splash-screen";
import { LoginScreen } from "@/features/auth/screens/login-screen";
import { RegisterScreen } from "@/features/auth/screens/register-screen";
import { WelcomeScreen } from "@/features/auth/screens/welcome-screen";
import { VerifyEmailScreen } from "@/features/auth/screens/verify-email-screen";
import { VerificationSuccessScreen } from "@/features/auth/screens/verification-success-screen";
import { VerificationFailureScreen } from "@/features/auth/screens/verification-failure-screen";
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

const SPLASH_MIN_MS = 1600;

export function RootNavigator() {
  const { user, isLoading, isAuthenticated, loggedOut } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  if (!splashDone || isLoading) {
    return <SplashScreen />;
  }

  const isVerified = Boolean(user?.emailVerified);

  // Verified users go straight to their role workspace. Everyone else only
  // has access to the public auth + verification screens.
  const initialRouteName: keyof RootStackParamList = isAuthenticated
    ? isVerified
      ? user?.role === "AGENT"
        ? "Agent"
        : "Branch"
      : "VerifyEmail"
    : loggedOut
      ? "Login"
      : "Welcome";

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRouteName}
      >
        {isAuthenticated && isVerified ? (
          user?.role === "AGENT" ? (
            <Stack.Screen name="Agent" component={AgentNavigator} />
          ) : (
            <Stack.Screen name="Branch" component={BranchNavigator} />
          )
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              initialParams={{ email: user?.email ?? "" }}
            />
            <Stack.Screen
              name="VerificationSuccess"
              component={VerificationSuccessScreen}
            />
            <Stack.Screen
              name="VerificationFailure"
              component={VerificationFailureScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
