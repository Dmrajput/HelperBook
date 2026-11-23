import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { roleLabel } from "../../utils/employeeFormat";
import { statusLabel } from "../../utils/attendanceFormat";

export default function BulkEmployeeSelector({ employees, selectedIds, onToggle }) {
  return (
    <View style={styles.list}>
      {employees.map((employee) => {
        const selected = selectedIds.has(employee.employeeId);
        const initial = String(employee.name || "E").trim().charAt(0).toUpperCase() || "E";
        return (
          <Pressable
            key={employee.employeeId}
            accessibilityRole="checkbox"
            accessibilityLabel={employee.name}
            accessibilityState={{ checked: selected }}
            onPress={() => onToggle(employee.employeeId)}
            style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
          >
            <View style={[styles.check, selected && styles.checkSelected]}>
              {selected ? <Ionicons name="checkmark" size={14} color={colors.textInverse} /> : null}
            </View>
            <View style={styles.avatar}>
              <AppText variant="label" color={colors.primary} style={styles.avatarLetter}>
                {initial}
              </AppText>
            </View>
            <View style={styles.copy}>
              <AppText variant="label" style={styles.name} numberOfLines={1}>
                {employee.name}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {`${roleLabel(employee)} · ${statusLabel(employee.status)}`}
              </AppText>
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: "#F8FAFF",
  },
  pressed: {
    opacity: 0.9,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: "700",
  },
});
