import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "./AppText";
import StatusBadge from "./StatusBadge";
import { colors, spacing } from "../theme";
import { formatSalary, roleLabel } from "../utils/employeeFormat";

export default function EmployeeCard({ employee, onPress }) {
  const initial = String(employee.name || "A").trim().charAt(0).toUpperCase() || "A";
  const active = employee.status === "active";
  const role = roleLabel(employee) || "Staff";
  const salary = formatSalary(employee.salary);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${employee.name}, ${role}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, !active && styles.avatarMuted]}>
        <AppText variant="label" color={active ? colors.primary : colors.textSecondary}>
          {initial}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText variant="label" numberOfLines={1}>
          {employee.name}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {salary ? `${role} · ${salary}` : role}
        </AppText>
      </View>
      <StatusBadge status={employee.status} />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMuted: {
    backgroundColor: colors.disabled,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
