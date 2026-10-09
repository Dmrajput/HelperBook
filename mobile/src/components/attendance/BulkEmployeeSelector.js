import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { roleLabel } from "../../utils/employeeFormat";
import { statusLabel } from "../../utils/attendanceFormat";

export default function BulkEmployeeSelector({ employees, selectedIds, onToggle }) {
  return (
    <View style={styles.list}>
      {employees.map((employee) => {
        const selected = selectedIds.has(employee.employeeId);
        return (
          <Pressable
            key={employee.employeeId}
            accessibilityRole="checkbox"
            accessibilityLabel={employee.name}
            accessibilityState={{ checked: selected }}
            onPress={() => onToggle(employee.employeeId)}
            style={[styles.row, selected && styles.selected]}
          >
            <AppText variant="label">{selected ? "☑" : "☐"} {employee.name}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {roleLabel(employee)} · {statusLabel(employee.status)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
  selected: {
    borderColor: colors.primary,
  },
});
