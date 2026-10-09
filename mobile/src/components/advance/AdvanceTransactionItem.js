import { StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

const LABELS = {
  advance: "Advance given",
  repayment: "Repayment",
  salary_deduction: "Salary deduction",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

const SOURCES = {
  manual: "Manual",
  salary: "Salary",
  system: "System",
};

export default function AdvanceTransactionItem({ transaction, onReverse }) {
  const label = LABELS[transaction.type] || "Khata entry";
  const sign = Number(transaction.signedAmount) >= 0 ? "+" : "-";
  const canReverse = transaction.type !== "salary_deduction" && transaction.type !== "reversal" && !transaction.reversed;
  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={`${formatAttendanceDate(transaction.date)}, ${label}, ${sign} ${formatInr(transaction.amount)}`}
    >
      <View style={styles.copy}>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatAttendanceDate(transaction.date)}
        </AppText>
        <AppText variant="body">{label}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {SOURCES[transaction.source] || transaction.source}
          {transaction.notes ? ` · ${transaction.notes}` : ""}
          {transaction.reversed ? " · Reversed" : ""}
        </AppText>
        {transaction.type === "salary_deduction" && !transaction.reversed ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Reopen the salary to change this deduction.
          </AppText>
        ) : null}
        {canReverse && onReverse ? (
          <AppButton label="Reverse entry" variant="secondary" onPress={() => onReverse(transaction)} />
        ) : null}
      </View>
      <AppText variant="subtitle">
        {sign} {formatInr(transaction.amount)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  copy: { flex: 1, gap: spacing.xs },
});
