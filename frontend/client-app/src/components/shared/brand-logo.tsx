import { Image } from "react-native";

export function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <Image
      source={require("../../../assets/agrivet-logo.png")}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="Agrivet logo"
    />
  );
}
