import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Button } from "@/components/ui/button";

const GOOGLE_BLUE = "#4285F4";
const GOOGLE_RED = "#EA4335";
const GOOGLE_YELLOW = "#FBBC05";
const GOOGLE_GREEN = "#34A853";

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill={GOOGLE_BLUE}
          d="M23.64 12.2045c0-.6381-.0573-1.2518-.1636-1.8409H12v3.4814h6.5218c-.2809 1.5136-1.1345 2.7955-2.4164 3.6545v3.0382h3.9109c2.2882-2.1073 3.6073-5.2109 3.6073-8.9332z"
        />
        <Path
          fill={GOOGLE_GREEN}
          d="M12 24c3.2673 0 6.0055-1.0836 8.0073-2.9327l-3.9109-3.0382c-1.0836.7273-2.4654 1.1563-4.0964 1.1563-3.1527 0-5.8218-2.1295-6.7745-4.9909H1.2545v3.14C3.2455 21.2836 7.3091 24 12 24z"
        />
        <Path
          fill={GOOGLE_YELLOW}
          d="M5.2255 14.1864c-.24-.7273-.3764-1.5054-.3764-2.3127s.1364-1.5855.3764-2.3127V6.4209H1.2545C.4545 8.0182 0 9.7573 0 11.5873s.4545 3.5691 1.2545 5.1664l3.971-2.5673z"
        />
        <Path
          fill={GOOGLE_RED}
          d="M12 4.7455c1.7727 0 3.3627.6082 4.6145 1.8027l3.4582-3.4582C18.0027 1.1891 15.2645 0 12 0 7.3091 0 3.2455 2.7164 1.2545 6.4209l3.9709 3.14C6.1782 6.8727 8.8473 4.7455 12 4.7455z"
        />
      </Svg>
    </View>
  );
}

interface GoogleButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GoogleButton({
  label,
  onPress,
  loading,
  disabled,
  className,
}: GoogleButtonProps) {
  return (
    <Button
      label={label}
      variant="outline"
      size="control"
      fullWidth
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      leftIcon={<GoogleIcon />}
      className={className}
    />
  );
}
