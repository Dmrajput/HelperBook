import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
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
  onSettings,
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#818CF8", "#6366F1", "#4F46E5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
    >
      <View style={styles.top}>
        <View style={styles.copy}>
          <AppText variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={1} style={styles.date}>
            {dateLabel}
          </AppText>
          <AppText
            variant="heading"
            color={colors.textInverse}
            accessibilityRole="header"
            numberOfLines={1}
            style={styles.greeting}
          >
            {greeting}
          </AppText>
          {shopName ? (
            <Pressable
              accessibilityRole={onSettings ? "button" : undefined}
              accessibilityLabel={onSettings ? `${shopName}, open shop settings` : shopName}
              disabled={!onSettings}
              onPress={onSettings}
              style={styles.shopRow}
            >
              <Ionicons name="business-outline" size={13} color="rgba(255,255,255,0.9)" />
              <AppText variant="caption" color="rgba(255,255,255,0.9)" numberOfLines={1} style={styles.shopName}>
                {shopName}
              </AppText>
              {onSettings ? (
                <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.75)" />
              ) : null}
            </Pressable>
          ) : null}
        </View>
        <View style={styles.actions}>
          {onNotifications ? (
            <View style={styles.iconButton}>
              <NotificationBadge count={unreadCount} onPress={onNotifications} color={colors.textInverse} />
            </View>
          ) : null}
          {onSettings ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Shop settings"
              onPress={onSettings}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons name="settings-outline" size={20} color={colors.textInverse} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
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
    letterSpacing: 0.6,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  greeting: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    maxWidth: "100%",
  },
  shopName: {
    flexShrink: 1,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.88,
  },
});
