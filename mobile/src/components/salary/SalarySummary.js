import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

export default function SalarySummary({ summary, monthLabel }) {
  const totals = summary || {};
  const employees = Number(totals.totalEmployees) || 0;
  const calculated = Number(totals.calculated) || 0;

  return (
    <View style={styles.card}>
      <AppText variant="subtitle">{monthLabel}</AppText>
      <AppText variant="heading">{formatInr(totals.totalNetSalary)}</AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        Net salary
      </AppText>
      <Row label="Employees" value={String(employees)} />
      <Row label="Calculated" value={`${calculated} / ${employees}`} />
      <Row label="Draft" value={String(totals.draft || 0)} />
      <Row label="Finalized" value={String(totals.finalized || 0)} />
      <Row label="Gross salary" value={formatInr(totals.totalGrossSalary)} />
      <Row label="Deductions" value={formatInr(totals.totalDeductions)} />
      <Row label="Advances" value={formatInr(totals.totalAdvances)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});
