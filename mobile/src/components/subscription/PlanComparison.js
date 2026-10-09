import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function PlanComparison({ plans }) {
  if (!plans?.length) return null;
  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Active employees</AppText>
      {plans.map((plan) => (
        <View key={plan.id} style={styles.row}>
          <AppText variant="body">{plan.name}</AppText>
          <AppText variant="body">{plan.employeeLimit}</AppText>
        </View>
      ))}
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
  row: { flexDirection: "row", justifyContent: "space-between" },
});