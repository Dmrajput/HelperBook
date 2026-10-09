import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import { getEmployeeSalaries } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, formatMonth } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

export default function EmployeeSalaryScreen({ navigation }) {
  const [salaries, setSalaries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployeeSalaries();
      setSalaries(data.salaries || []);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load salary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <AppScreen title="Salary" subtitle="Finalized pay" icon="wallet" showBack={false}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}>
        {error ? <ErrorView message={error} onRetry={load} /> : null}
        {!loading && !salaries.length ? <AppText variant="body">No finalized salary records available yet.</AppText> : null}
        {salaries.map((salary) => (
          <View key={salary.id} style={styles.card}>
            <AppText variant="subtitle">{formatMonth(salary.year, salary.month)}</AppText>
            <AppText variant="body">Final Salary {formatInr(salary.finalSalary)}</AppText>
            <AppText variant="body">Status {salary.paymentStatus === "paid" ? "Paid" : "Unpaid"}</AppText>
            {salary.paidOn ? <AppText variant="body">Paid on {formatAttendanceDate(salary.paidOn)}</AppText> : null}
            <AppText variant="body">Base Salary {formatInr(salary.calculation.baseSalary)}</AppText>
            <AppText variant="body">Bonus {formatInr(salary.calculation.bonus)}</AppText>
            <AppText variant="body">Deductions {formatInr(salary.calculation.deduction)}</AppText>
            <AppText variant="body">Advance Deduction {formatInr(salary.calculation.advanceDeduction)}</AppText>
            {salary.receiptAvailable ? (
              <AppButton label="View Receipt" variant="secondary" onPress={() => navigation.navigate("EmployeeSalaryReceipt", { salaryId: salary.id })} />
            ) : null}
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
});
