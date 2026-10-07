import { Pressable, StyleSheet, View } from "react-native";
import AppText from "./AppText";
import StatusBadge from "./StatusBadge";
import { colors, spacing } from "../theme";
import { formatSalary, roleLabel } from "../utils/employeeFormat";

export default function EmployeeCard({ employee, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${employee.name}, ${roleLabel(employee)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.identity}>
          <AppText variant="subtitle">{employee.name}</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {roleLabel(employee)}
          </AppText>
        </View>
        <StatusBadge status={employee.status} />
      </View>
      <AppText variant="body">{formatSalary(employee.salary)}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  identity: {
    flex: 1,
    gap: spacing.xs,
  },
});
