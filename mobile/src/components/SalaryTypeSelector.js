import { Pressable, StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../theme";

const OPTIONS = [
  { value: "monthly", title: "Monthly", example: "₹15,000 / month" },
  { value: "daily", title: "Daily", example: "₹600 / day" },
];

export default function SalaryTypeSelector({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      <AppText variant="label">Salary type</AppText>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${option.title}, ${option.example}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.card, selected && styles.selected]}
            >
              <AppText variant="button" color={selected ? colors.primary : colors.text}>
                {option.title}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {option.example}
              </AppText>
              <AppText variant="caption" color={colors.primary}>
                {selected ? "Selected" : "Select"}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: spacing.md,
    justifyContent: "center",
    gap: spacing.xs,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: "#E7F3EF",
  },
});
