import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import { getEmployeeAdvances, getEmployeeAdvanceTransactions } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

const TYPE_LABELS = {
  advance: "Advance Given",
  repayment: "Repayment",
  salary_deduction: "Salary Deduction",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

export default function EmployeeAdvanceScreen() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSummary, nextTransactions] = await Promise.all([getEmployeeAdvances(), getEmployeeAdvanceTransactions()]);
      setSummary(nextSummary);
      setTransactions(nextTransactions.transactions || []);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load advance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <AppScreen title="Advance / Khata" subtitle="Your outstanding balance" icon="book">
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}>
        {error ? <ErrorView message={error} onRetry={load} /> : null}
        <AppText variant="subtitle">Outstanding {formatInr(summary?.outstanding || 0)}</AppText>
        <AppText variant="body">Advance Given {formatInr(summary?.totalAdvances || 0)}</AppText>
        <AppText variant="body">Repayments {formatInr(summary?.repayments || 0)}</AppText>
        <AppText variant="body">Salary Deducted {formatInr(summary?.salaryDeductions || 0)}</AppText>
        <AppText variant="label">Transactions</AppText>
        {!loading && !transactions.length ? <AppText variant="body">No advance records found.</AppText> : null}
        {transactions.map((item) => (
          <View key={item.id} style={styles.row}>
            <AppText variant="body">{formatAttendanceDate(item.date)}</AppText>
            <AppText variant="body">{TYPE_LABELS[item.type] || item.type}</AppText>
            <AppText variant="body">{item.signedAmount > 0 ? "+" : ""}{formatInr(item.signedAmount)}</AppText>
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingBottom: spacing.xxl },
  row: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
