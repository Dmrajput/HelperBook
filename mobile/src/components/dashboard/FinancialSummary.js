import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { spacing } from "../../theme";
import { formatInr, peopleLabel } from "../../utils/dashboardFormat";
import MetricCard from "./MetricCard";

export default function FinancialSummary({ salary, advance }) {
  return (
    <View style={styles.section}>
      <AppText variant="subtitle">Salary & Advances</AppText>
      <View style={styles.row}>
        <View style={styles.cell}>
          <MetricCard
            title="Salary Pending"
            value={formatInr(salary?.pendingAmount)}
            subtitle={peopleLabel(salary?.pendingEmployees, "No pending salary")}
            compact
          />
        </View>
        <View style={styles.cell}>
          <MetricCard
            title="Advance Outstanding"
            value={formatInr(advance?.outstandingAmount)}
            subtitle={peopleLabel(advance?.employeesWithOutstanding, "No outstanding advance")}
            compact
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
});
