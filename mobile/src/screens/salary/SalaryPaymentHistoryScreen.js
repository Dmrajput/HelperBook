import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import SalaryPaymentHistoryCard from "../../components/salary/SalaryPaymentHistoryCard";
import { PAYMENT_METHODS } from "../../constants/salaryPayment";
import { getEmployees } from "../../services/employeeService";
import { getSalaryPayments } from "../../services/salaryService";
import { colors, spacing } from "../../theme";
import { currentYearMonth, formatMonth } from "../../utils/attendanceFormat";

const STATUSES = [
  { id: "", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "reversed", label: "Reversed" },
];

function shiftMonth(year, month, delta) {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

export default function SalaryPaymentHistoryScreen({ navigation }) {
  const current = currentYearMonth();
  const [period, setPeriod] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (page = 1) => {
      if (page === 1) setError("");
      try {
        const params = { page, limit: 20 };
        if (employeeId) params.employeeId = employeeId;
        if (paymentMethod) params.paymentMethod = paymentMethod;
        if (status) params.status = status;
        if (period) {
          params.month = period.month;
          params.year = period.year;
        }
        const data = await getSalaryPayments(params);
        setPayments((currentPayments) => (page === 1 ? data.payments : [...currentPayments, ...data.payments]));
        setPagination(data.pagination);
      } catch (loadError) {
        if (page === 1) setError(loadError.message || "Unable to load payment history.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [employeeId, paymentMethod, status, period]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(1);
      getEmployees({ status: "active", limit: 50 })
        .then((data) => setEmployees(data.employees || []))
        .catch(() => setEmployees([]));
    }, [load])
  );

  const hasMore = pagination && pagination.page < pagination.pages;

  return (
    <AppScreen title="Payment history" subtitle="Salary payments" icon="cash">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.filters}>
          <Chip label="All Employees" selected={!employeeId} onPress={() => setEmployeeId("")} />
          {employees.map((employee) => (
            <Chip
              key={employee.id}
              label={employee.name}
              selected={employeeId === employee.id}
              onPress={() => setEmployeeId(employee.id)}
            />
          ))}
        </View>
        <View style={styles.filters}>
          <Chip label="All methods" selected={!paymentMethod} onPress={() => setPaymentMethod("")} />
          {PAYMENT_METHODS.map((method) => (
            <Chip
              key={method.id}
              label={method.label}
              selected={paymentMethod === method.id}
              onPress={() => setPaymentMethod(method.id)}
            />
          ))}
        </View>
        <View style={styles.filters}>
          {STATUSES.map((item) => (
            <Chip key={item.label} label={item.label} selected={status === item.id} onPress={() => setStatus(item.id)} />
          ))}
        </View>
        <View style={styles.monthRow}>
          <AppButton
            label={period ? "Previous" : "All periods"}
            variant="secondary"
            onPress={() => setPeriod((value) => (value ? shiftMonth(value.year, value.month, -1) : current))}
          />
          <AppText variant="subtitle">{period ? formatMonth(period.year, period.month) : "All periods"}</AppText>
          <AppButton
            label={period ? "Clear" : "This month"}
            variant="secondary"
            onPress={() => setPeriod((value) => (value ? null : current))}
          />
        </View>
        {loading ? <View style={styles.block} accessibilityLabel="Loading payment history" /> : null}
        {error && payments.length === 0 ? <ErrorView message={error} onRetry={() => load(1)} /> : null}
        {!loading && payments.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="subtitle">No salary payments yet.</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Payments will appear here after you record salary payments.
            </AppText>
          </View>
        ) : null}
        {payments.map((payment) => (
          <SalaryPaymentHistoryCard
            key={payment.id}
            payment={payment}
            onPress={() => navigation.navigate("SalaryPaymentDetail", { paymentId: payment.id })}
          />
        ))}
        {hasMore ? (
          <AppButton
            label="Load more"
            variant="secondary"
            loading={loadingMore}
            onPress={() => {
              setLoadingMore(true);
              load(pagination.page + 1);
            }}
          />
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <AppText variant="caption" color={selected ? colors.textInverse : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  empty: { gap: spacing.sm },
  block: { height: 96, borderRadius: 12, backgroundColor: colors.disabled },
});
