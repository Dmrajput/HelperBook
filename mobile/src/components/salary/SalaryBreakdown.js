import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

function money(sign, amount) {
  const formatted = formatInr(amount);
  if (!sign || !Number(amount)) {
    return formatted;
  }
  return `${sign}${formatted}`;
}

function Row({ label, value, strong = false }) {
  return (
    <View style={styles.row}>
      <AppText variant={strong ? "subtitle" : "body"} color={strong ? colors.text : colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant={strong ? "subtitle" : "body"}>{value}</AppText>
    </View>
  );
}

export default function SalaryBreakdown({ calculation }) {
  const values = calculation || {};
  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Salary preview</AppText>
      <Row label="Base Salary" value={money("", values.baseSalary)} />
      <Row label="Attendance Deduction" value={money("-", values.attendanceDeduction)} />
      <Row label="Leave Deduction" value={money("-", values.leaveDeduction)} />
      <Row label="Bonus" value={money("+", values.bonus)} />
      <Row label="Deduction" value={money("-", values.deduction)} />
      <Row label="Advance Deduction" value={money("-", values.advanceDeduction)} />
      <View style={styles.line} />
      <Row label="Net Salary" value={formatInr(values.netSalary)} strong />
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
  line: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
