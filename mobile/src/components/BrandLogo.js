import { Image, StyleSheet } from "react-native";
import { APP_NAME } from "../constants/app";

const logoSource = require("../../assets/logo.png");

export default function BrandLogo({ size = 56, style }) {
  return (
    <Image
      source={logoSource}
      style={[styles.logo, { width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel={`${APP_NAME} logo`}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderRadius: 12,
  },
});
