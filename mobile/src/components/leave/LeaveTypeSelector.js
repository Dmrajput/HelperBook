import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const OPTIONS = [
  {
    id: "paid",
    label: "Paid leave",
    description: "No salary deduction",
    icon: "checkmark-circle-outline",
    color: colors.success,
    background: colors.successBackground,
  },
  {
    id: "unpaid",
    label: "Unpaid leave",
    description: "Salary deduction applies",
    icon: "close-circle-outline",
    color: colors.error,
    background: colors.errorBackground,
  },
  {
    id: "sick",
    label: "Sick leave",
    description: "Uses your sick leave pay setting",
    icon: "medkit-outline",
    color: colors.warning,
    background: colors.warningBackground,
  },
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
            style={[styles.option, selected && { borderColor: option.color, backgroundColor: option.background }]}
          >
            <View style={[styles.icon, { backgroundColor: selected ? colors.surface : option.background }]}>
              <Ionicons name={option.icon} size={18} color={option.color} />
            </View>
            <View style={styles.copy}>
              <AppText variant="label" style={styles.label}>
                {option.label}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {option.description}
              </AppText>
            </View>
            <View style={[styles.radio, selected && { borderColor: option.color }]}>
              {selected ? <View style={[styles.radioDot, { backgroundColor: option.color }]} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontWeight: "700",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
