import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
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
      <View style={styles.titleRow}>
        <AppText variant="subtitle" style={styles.title}>Recently Added</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="View all employees" onPress={onViewAll}>
          <AppText variant="label" color={colors.primary} style={styles.link}>View All ›</AppText>
        </Pressable>
      </View>
      <View style={styles.list}>
        {employees.map((employee, index) => (
          <Pressable
            key={employee.id}
            accessibilityRole="button"
            accessibilityLabel={employee.name}
            onPress={() => onPressEmployee(employee)}
            style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
          >
            <View style={styles.avatar}>
              <AppText variant="label" color={colors.primary}>
                {String(employee.name || "A").trim().charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.copy}>
              <AppText variant="label" numberOfLines={1}>{employee.name}</AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {roleLabel(employee)}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary}>
              {addedLabel(employee.createdAt, timeZone)}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "700",
  },
  link: {
    fontSize: 14,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
});
