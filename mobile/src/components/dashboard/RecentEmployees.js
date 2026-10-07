import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { roleLabel } from "../../utils/employeeFormat";
import { addedLabel } from "../../utils/dashboardFormat";

export default function RecentEmployees({ employees, timeZone, onPressEmployee, onViewAll }) {
  if (!employees?.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <AppText variant="subtitle">Recently Added</AppText>
      <View style={styles.list}>
        {employees.map((employee) => (
          <Pressable
            key={employee.id}
            accessibilityRole="button"
            accessibilityLabel={employee.name}
            onPress={() => onPressEmployee(employee)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <AppText variant="label">{employee.name}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {roleLabel(employee)}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {addedLabel(employee.createdAt, timeZone)}
            </AppText>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="View all employees" onPress={onViewAll}>
        <AppText variant="label" color={colors.primary}>
          View All
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
});
