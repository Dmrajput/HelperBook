import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { monthLabel, shiftMonthRange } from "../../utils/reportFormatters";

function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <AppText
        variant="caption"
        color={selected ? colors.primary : colors.textSecondary}
        style={styles.chipText}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default function ReportFilterBar({
  range,
  onRangeChange,
  employees,
  employeeId,
  onEmployeeChange,
  groups,
  onReset,
  filtersActive,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => onRangeChange(shiftMonthRange(range.from, -1))}
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.monthCenter}>
          <AppText variant="label" style={styles.monthLabel}>
            {monthLabel(range.from)}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => onRangeChange(shiftMonthRange(range.from, 1))}
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <AppText variant="label" style={styles.filterTitle}>
            Filters
          </AppText>
          {filtersActive ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Reset filters" onPress={onReset} hitSlop={8}>
              <AppText variant="caption" color={colors.primary} style={styles.resetText}>
                Reset
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <AppText variant="caption" color={colors.textSecondary}>
          Employee
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" selected={!employeeId} onPress={() => onEmployeeChange(null)} />
          {employees.map((employee) => (
            <Chip
              key={employee.id}
              label={employee.name}
              selected={employeeId === employee.id}
              onPress={() => onEmployeeChange(employee.id)}
            />
          ))}
        </ScrollView>

        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {group.options.map((option) => (
                <Chip
                  key={`${group.key}-${option.value}`}
                  label={option.label}
                  selected={(group.value || group.defaultValue) === option.value}
                  onPress={() => group.onChange(option.value)}
                />
              ))}
            </ScrollView>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCenter: {
    flex: 1,
    alignItems: "center",
  },
  monthLabel: {
    fontWeight: "700",
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  resetText: {
    fontWeight: "700",
  },
  group: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
  },
});
