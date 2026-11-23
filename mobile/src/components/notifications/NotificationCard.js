import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

function iconMeta(type) {
  if (type === "salary_paid") {
    return { name: "checkmark-circle-outline", color: colors.success, background: colors.successBackground };
  }
  if (type === "salary_reminder") {
    return { name: "cash-outline", color: colors.warning, background: colors.warningBackground };
  }
  if (String(type || "").startsWith("leave_")) {
    return { name: "calendar-outline", color: "#EA580C", background: "#FFF7ED" };
  }
  if (String(type || "").startsWith("subscription_")) {
    return { name: "ribbon-outline", color: colors.primary, background: colors.primaryLight };
  }
  return { name: "notifications-outline", color: colors.info, background: colors.infoBackground };
}

export default function NotificationCard({ type, title, message, time, unread, onPress }) {
  const icon = iconMeta(type);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${message}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, unread && styles.unread, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: icon.background }]}>
        <Ionicons name={icon.name} size={18} color={icon.color} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="label" style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
          {unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <AppText variant="body" color={colors.textSecondary} numberOfLines={2}>
          {message}
        </AppText>
        <AppText variant="caption" color={colors.placeholder}>
          {time}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  unread: {
    borderColor: colors.primary,
    backgroundColor: "#F8FAFF",
  },
  pressed: {
    opacity: 0.9,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
