import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { spacing } from "../../theme";
import { formatInr, peopleLabel } from "../../utils/dashboardFormat";
import MetricCard from "./MetricCard";

function salarySubtitle(salary) {
  if (!salary?.hasFinalized) return "No finalized salary yet";
  if (salary.allPaid) return "All finalized salaries paid";
  return peopleLabel(salary.pendingEmployees, "All finalized salaries paid");
}

export default function FinancialSummary({ salary, advance, onPressSalary }) {
  return (
    <View style={styles.section}>
      <AppText variant="subtitle">Salary & Advances</AppText>
      <View style={styles.row}>
        <View style={styles.cell}>
          <MetricCard
            title="Salary Pending"
            value={formatInr(salary?.pendingAmount)}
            subtitle={salarySubtitle(salary)}
            onPress={onPressSalary}
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
