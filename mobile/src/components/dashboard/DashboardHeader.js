import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationBadge from "../notifications/NotificationBadge";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function DashboardHeader({
  greeting,
  shopName,
  dateLabel,
  logoUrl,
  unreadCount = 0,
  onNotifications,
}) {
  const insets = useSafeAreaInsets();
  const [logoFailed, setLogoFailed] = useState(false);
  const initial = String(shopName || "H").trim().charAt(0).toUpperCase() || "H";
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.glow} accessibilityElementsHidden />
      <View style={styles.top}>
        {showLogo ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logo}
            onError={() => setLogoFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.logo} accessibilityLabel={`${shopName || "Shop"} logo`}>
            <AppText variant="label" color={colors.primary}>
              {initial}
            </AppText>
          </View>
        )}
        <View style={styles.copy}>
          <AppText variant="heading" color={colors.textInverse} accessibilityRole="header" numberOfLines={2} style={styles.greeting}>
            {greeting}
          </AppText>
        </View>
        <View style={styles.bell}>
          <NotificationBadge count={unreadCount} onPress={onNotifications} color={colors.textInverse} />
        </View>
      </View>
      <View style={styles.pills}>
        {shopName ? (
          <View style={styles.pill}>
            <Ionicons name="storefront-outline" size={14} color="#E7F6EF" />
            <AppText variant="caption" color="#F4FBF8" numberOfLines={1} style={styles.pillText}>
              {shopName}
            </AppText>
          </View>
        ) : null}
        <View style={styles.pill}>
          <Ionicons name="calendar-outline" size={14} color="#E7F6EF" />
          <AppText variant="caption" color="#F4FBF8" numberOfLines={1}>
            {dateLabel}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0F6B4F",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -70,
    right: -40,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  bell: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  pillText: {
    flexShrink: 1,
  },
});
