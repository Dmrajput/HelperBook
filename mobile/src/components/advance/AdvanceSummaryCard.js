import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

function Line({ label, value }) {
  return (
    <View style={styles.row}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body">{formatInr(value)}</AppText>
    </View>
  );
}

export default function AdvanceSummaryCard({ summary }) {
  const values = summary || {};
  return (
    <View style={styles.card}>
      <Line label="Total given" value={values.totalGiven} />
      <Line label="Repaid" value={values.totalRepaid} />
      <Line label="Salary deducted" value={values.totalSalaryDeducted} />
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
