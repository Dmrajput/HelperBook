import { Pressable, ScrollView, StyleSheet, View } from "react-native";
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
      <AppText variant="label" color={selected ? colors.textInverse : colors.text}>
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
          style={styles.monthButton}
        >
          <AppText variant="label">Previous</AppText>
        </Pressable>
        <AppText variant="subtitle">{monthLabel(range.from)}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => onRangeChange(shiftMonthRange(range.from, 1))}
          style={styles.monthButton}
        >
          <AppText variant="label">Next</AppText>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All employees" selected={!employeeId} onPress={() => onEmployeeChange(null)} />
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
        <ScrollView key={group.key} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {group.options.map((option) => (
            <Chip
              key={`${group.key}-${option.value}`}
              label={option.label}
              selected={(group.value || group.defaultValue) === option.value}
              onPress={() => group.onChange(option.value)}
            />
          ))}
        </ScrollView>
      ))}
      {filtersActive ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Reset filters" onPress={onReset} style={styles.reset}>
          <AppText variant="label" color={colors.primary}>
            Reset filters
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  reset: { minHeight: 44, justifyContent: "center" },
});
