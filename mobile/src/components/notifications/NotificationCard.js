import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

function iconName(type) {
  if (type === "salary_paid") return "checkmark-circle-outline";
  if (type === "salary_reminder") return "cash-outline";
  if (String(type || "").startsWith("leave_")) return "calendar-outline";
  return "star-outline";
}

export default function NotificationCard({ type, title, message, time, unread, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${message}`}
      onPress={onPress}
      style={[styles.card, unread && styles.unread]}
    >
      <Ionicons name={iconName(type)} size={22} color={colors.primary} />
      <View style={styles.copy}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {message}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {time}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
  },
  unread: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#F3FAF7",
  },
  copy: { flex: 1, gap: spacing.xs },
});
