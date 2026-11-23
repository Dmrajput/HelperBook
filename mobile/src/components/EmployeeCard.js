import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "./AppText";
import StatusBadge from "./StatusBadge";
import { colors, spacing } from "../theme";
import { formatInr } from "../utils/dashboardFormat";
import { roleLabel } from "../utils/employeeFormat";

export default function EmployeeCard({ employee, onPress }) {
  const initial = String(employee.name || "A").trim().charAt(0).toUpperCase() || "A";
  const active = employee.status === "active";
  const role = roleLabel(employee) || "Staff";
  const salaryType = employee.salary?.type === "daily" ? "Daily salary" : "Monthly salary";
  const salaryAmount = Number.isFinite(Number(employee.salary?.amount))
    ? formatInr(employee.salary.amount)
    : "—";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${employee.name}, ${role}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={[styles.avatar, !active && styles.avatarMuted]}>
          <AppText variant="label" color={active ? colors.primary : colors.textSecondary} style={styles.initial}>
            {initial}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="label" numberOfLines={1} style={styles.name}>
            {employee.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {role}
          </AppText>
        </View>
        <StatusBadge status={employee.status} />
        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
      </View>

      <View style={styles.divider} />

      <View style={styles.salaryRow}>
        <AppText variant="caption" color={colors.textSecondary}>
          {salaryType}
        </AppText>
        <AppText variant="label" style={styles.salaryAmount}>
          {salaryAmount}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMuted: {
    backgroundColor: colors.disabled,
  },
  initial: {
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  salaryAmount: {
    fontWeight: "700",
  },
});
