import { StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const INCLUDED = ["Employee management", "Attendance", "Salary", "Leave", "Reports"];

export default function PlanCard({ plan, priceLabel, actionLabel, onPress, disabled, current }) {
  return (
    <View style={[styles.card, current && styles.current]}>
      <AppText variant="subtitle">{plan.name}</AppText>
      <AppText variant="heading">{priceLabel}</AppText>
      <AppText variant="body">Up to {plan.employeeLimit} {plan.employeeLimit === 1 ? "employee" : "employees"}</AppText>
      {INCLUDED.map((item) => (
        <AppText key={item} variant="body" color={colors.textSecondary}>
          {`✓ ${item}`}
        </AppText>
      ))}
      <AppButton label={actionLabel} onPress={onPress} disabled={disabled} variant={current ? "secondary" : "primary"} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  current: { borderColor: colors.primary },
});
