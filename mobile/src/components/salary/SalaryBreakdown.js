import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

function formatSigned(amount, { sign = "", tone } = {}) {
  const value = Number(amount) || 0;
  const formatted = formatInr(Math.abs(value));
  if (!sign || !value) {
    return { text: sign && value === 0 ? `${sign}${formatted}` : formatInr(value), tone };
  }
  return { text: `${sign}${formatted}`, tone };
}

function Row({ label, amount, sign = "", tone }) {
  const formatted = formatSigned(amount, { sign, tone });
  const color =
    formatted.tone === "danger"
      ? colors.error
      : formatted.tone === "success"
        ? colors.success
        : colors.text;

  return (
    <View style={styles.row}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="label" color={color} style={styles.amount}>
        {formatted.text}
      </AppText>
    </View>
  );
}

export default function SalaryBreakdown({ calculation }) {
  const values = calculation || {};
  return (
    <View style={styles.card}>
      <AppText variant="label" style={styles.title}>
        Salary breakdown
      </AppText>
      <Row label="Base salary" amount={values.baseSalary} />
      <Row label="Attendance deduction" amount={values.attendanceDeduction} sign="-" tone="danger" />
      <Row label="Leave deduction" amount={values.leaveDeduction} sign="-" tone="danger" />
      <Row label="Bonus" amount={values.bonus} sign="+" tone="success" />
      <Row label="Other deduction" amount={values.deduction} sign="-" tone="danger" />
      <Row label="Advance deduction" amount={values.advanceDeduction} sign="-" tone="danger" />
      <View style={styles.line} />
      <View style={styles.netRow}>
        <View style={styles.netCopy}>
          <AppText variant="label" style={styles.netTitle}>
            Net salary
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Review all adjustments before finalizing
          </AppText>
        </View>
        <AppText variant="subtitle" color={colors.primary} style={styles.netAmount}>
          {formatInr(values.netSalary)}
        </AppText>
      </View>
      {values.warning ? (
        <AppText variant="caption" color={colors.error}>
          {values.warning}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontWeight: "700",
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 28,
  },
  amount: {
    fontWeight: "700",
  },
  line: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  netRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  netCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  netTitle: {
    fontWeight: "700",
  },
  netAmount: {
    fontWeight: "700",
  },
});
