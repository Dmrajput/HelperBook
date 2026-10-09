import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import SalaryCard from "../../components/salary/SalaryCard";
import { methodLabel } from "../../constants/salaryPayment";
import { getEmployeeSalaryHistory } from "../../services/salaryService";
import { colors, spacing } from "../../theme";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SalaryHistoryScreen({ navigation, route }) {
  const { employeeId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getEmployeeSalaryHistory(employeeId, { limit: 20 }));
    } catch (loadError) {
      setError(loadError.message || "Unable to load salary history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="heading">Salary history</AppText>
        {data?.employee?.name ? <AppText variant="subtitle">{data.employee.name}</AppText> : null}
        {loading && !data ? (
          <View style={styles.block} accessibilityLabel="Loading salary history" />
        ) : null}
        {error && !data ? <ErrorView message={error} onRetry={load} /> : null}
        {data && data.salaries.length === 0 ? (
          <AppText variant="body" color={colors.textSecondary}>
            No salary records yet.
          </AppText>
        ) : null}
        {(data?.salaries || []).map((salary) => {
          const reversed = salary.paymentStatus !== "paid" && salary.payment?.status === "reversed";
          const paymentStatus = salary.status === "finalized" ? (reversed ? "reversed" : salary.paymentStatus || "unpaid") : "";
          const detail =
            salary.paymentStatus === "paid" && salary.payment
              ? methodLabel(salary.payment.paymentMethod)
              : reversed
                ? "Payment reversed"
                : "";
          return (
            <SalaryCard
              key={salary.id}
              name={`${MONTHS[salary.month - 1]} ${salary.year}`}
              amount={salary.calculation.netSalary}
              status={salary.status}
              paymentStatus={paymentStatus}
              detail={detail}
              actionLabel={salary.paymentStatus === "paid" ? "View Receipt" : "View"}
              onPress={() =>
                navigation.navigate(salary.paymentStatus === "paid" ? "SalaryReceipt" : "SalaryDetail", {
                  salaryId: salary.id,
                })
              }
            />
          );
        })}
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { height: 96, borderRadius: 12, backgroundColor: colors.disabled },
});