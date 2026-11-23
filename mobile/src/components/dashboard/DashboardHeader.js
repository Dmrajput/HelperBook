import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationBadge from "../notifications/NotificationBadge";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function DashboardHeader({
  greeting,
  shopName,
  dateLabel,
  subtitle = "Here's your team overview",
  unreadCount = 0,
  onNotifications,
  onSettings,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.top}>
        {shopName ? (
          <Pressable
            accessibilityRole={onSettings ? "button" : undefined}
            accessibilityLabel={onSettings ? `${shopName}, open shop settings` : shopName}
            disabled={!onSettings}
            onPress={onSettings}
            style={({ pressed }) => [styles.shopRow, pressed && styles.pressed]}
          >
            <View style={styles.shopIcon}>
              <Ionicons name="business-outline" size={14} color={colors.primary} />
            </View>
            <AppText variant="label" numberOfLines={1} style={styles.shopName}>
              {shopName}
            </AppText>
            {onSettings ? <Ionicons name="chevron-down" size={14} color={colors.textSecondary} /> : null}
          </Pressable>
        ) : (
          <View style={styles.shopRow} />
        )}
        <View style={styles.actions}>
          {onNotifications ? (
            <View style={styles.iconButton}>
              <NotificationBadge count={unreadCount} onPress={onNotifications} color={colors.text} />
            </View>
          ) : null}
          {onSettings ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Shop settings"
              onPress={onSettings}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.copy}>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.date}>
          {dateLabel}
        </AppText>
        <AppText variant="heading" accessibilityRole="header" numberOfLines={1} style={styles.greeting}>
          {greeting}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  shopRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shopIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  shopName: {
    flexShrink: 1,
    fontWeight: "700",
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    gap: 4,
  },
  date: {
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  greeting: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  pressed: {
    opacity: 0.88,
  },
});
