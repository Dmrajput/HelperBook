import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

function Line({ label, value }) {
  return (
    <View style={styles.row}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

export default function LeaveSummaryCard({ summary, title = "This month" }) {
  const values = summary || {};
  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`${title} leave summary`}>
      <AppText variant="subtitle">{title}</AppText>
      <Line label="Pending requests" value={String(values.pendingRequests ?? values.pending ?? 0)} />
      <Line label="Paid leave" value={`${values.paidDays ?? 0} days`} />
      <Line label="Unpaid leave" value={`${values.unpaidDays ?? 0} days`} />
      <Line label="Sick leave" value={`${values.sickDays ?? 0} days`} />
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
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
});
