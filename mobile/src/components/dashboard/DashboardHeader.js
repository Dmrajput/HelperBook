import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function DashboardHeader({ greeting, shopName, dateLabel, logoUrl }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const initial = String(shopName || "S").trim().charAt(0).toUpperCase() || "S";
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <View style={styles.row}>
      {showLogo ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.logo}
          onError={() => setLogoFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.placeholder} accessibilityLabel={`${shopName || "Shop"} logo`}>
          <AppText variant="subtitle" color={colors.textInverse}>
            {initial}
          </AppText>
        </View>
      )}
      <View style={styles.copy}>
        <AppText variant="heading" accessibilityRole="header">
          {greeting}
        </AppText>
        <AppText variant="body">{shopName}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {dateLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.disabled,
  },
  placeholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
