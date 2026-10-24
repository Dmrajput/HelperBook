import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { sortPlans } from "./planMeta";

export default function PlanComparison({ plans }) {
  if (!plans?.length) return null;
  const ordered = sortPlans(plans);
  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Active employees</AppText>
      <View style={styles.header}>
        <AppText variant="caption" color={colors.textSecondary}>
          Plan
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Limit
        </AppText>
      </View>
      {ordered.map((plan, index) => (
        <View key={plan.id} style={[styles.row, index === ordered.length - 1 && styles.rowLast]}>
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
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
});
