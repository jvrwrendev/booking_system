import React from "react";
import { useWindowDimensions, View } from "react-native";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{
  size: number;
  color: string;
  strokeWidth?: number;
}>;

interface TabIconProps {
  Icon: IconComponent;
  focused: boolean;
  color: string;
}

export function TabIcon({ Icon, focused, color }: TabIconProps) {
  return (
    <View
      className={cn(
        "h-8 w-16 items-center justify-center rounded-full",
        focused && "bg-primary/10",
      )}
    >
      <Icon
        size={21}
        color={color}
        strokeWidth={focused ? 2.4 : 2}
      />
    </View>
  );
}

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: "#16A34A",
  tabBarInactiveTintColor: "#94A3B8",
  tabBarStyle: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  // Five tabs are tight on small phones; keep each label from being clipped.
  tabBarItemStyle: {
    paddingHorizontal: 2,
  },
};

/**
 * The five-tab layout only fits the full-sized labels on wider phones. Small
 * screens drop a couple of pixels so "Dashboard" and "Customers" stay legible.
 */
export function useTabScreenOptions() {
  const { width } = useWindowDimensions();

  return {
    ...tabScreenOptions,
    tabBarLabelStyle: {
      ...tabScreenOptions.tabBarLabelStyle,
      fontSize: width < 375 ? 9 : 11,
    },
  };
}
