import { StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../theme";

export default function StatusBadge({ status }) {
  const active = status === "active";
  const label = active ? "Active" : "Inactive";

  return (
    <View
      style={[styles.badge, active ? styles.active : styles.inactive]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={[styles.dot, active ? styles.activeDot : styles.inactiveDot]} />
      <AppText variant="caption" color={active ? colors.success : colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  active: {
    backgroundColor: colors.successBackground,
  },
  inactive: {
    backgroundColor: colors.disabled,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: colors.success,
  },
  inactiveDot: {
    backgroundColor: colors.textSecondary,
  },
});
