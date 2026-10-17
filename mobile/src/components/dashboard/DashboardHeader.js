import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationBadge from "../notifications/NotificationBadge";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function DashboardHeader({
  greeting,
  shopName,
  dateLabel,
  unreadCount = 0,
  onNotifications,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.primaryLight} numberOfLines={1} style={styles.date}>
            {dateLabel}
          </AppText>
          <AppText
            variant="heading"
            color={colors.textInverse}
            accessibilityRole="header"
            numberOfLines={2}
            style={styles.greeting}
          >
            {greeting}
          </AppText>
          {shopName ? (
            <AppText variant="body" color={colors.primaryLight} numberOfLines={1}>
              {shopName}
            </AppText>
          ) : null}
        </View>
        {onNotifications ? (
          <View style={styles.bell}>
            <NotificationBadge count={unreadCount} onPress={onNotifications} color={colors.textInverse} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  date: {
    letterSpacing: 0.4,
    fontSize: 11,
    fontWeight: "600",
  },
  greeting: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  bell: {
    marginTop: 2,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
