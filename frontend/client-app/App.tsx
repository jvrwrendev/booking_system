import "./src/global.css";
import React from "react";
import { AppProviders } from "@/app/providers";
import { RootNavigator } from "@/app/navigation/root-navigator";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}
