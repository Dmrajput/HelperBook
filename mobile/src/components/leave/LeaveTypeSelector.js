import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const OPTIONS = [
  { id: "paid", label: "Paid Leave", description: "No salary deduction" },
  { id: "unpaid", label: "Unpaid Leave", description: "Salary deduction applies" },
  { id: "sick", label: "Sick Leave", description: "Uses your sick leave pay setting" },
];

export default function LeaveTypeSelector({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}. ${option.description}`}
            onPress={() => onChange(option.id)}
            style={[styles.option, selected && styles.selected]}
          >
            <AppText variant="label" color={selected ? colors.textInverse : colors.text}>
              {option.label}
            </AppText>
            <AppText variant="caption" color={selected ? colors.textInverse : colors.textSecondary}>
              {option.description}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
