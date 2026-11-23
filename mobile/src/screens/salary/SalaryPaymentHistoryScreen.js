import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
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

function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <AppText
        variant="caption"
        color={selected ? colors.primary : colors.textSecondary}
        style={styles.chipText}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default function SalaryPaymentHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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

  function resetFilters() {
    setPeriod(null);
    setEmployeeId("");
    setPaymentMethod("");
    setStatus("");
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Payment history
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Salary payments
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset filters"
            onPress={resetFilters}
            style={styles.headerAction}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.filterCard}>
          <AppText variant="label" style={styles.sectionTitle}>
            Period
          </AppText>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous period"
              onPress={() => setPeriod((value) => (value ? shiftMonth(value.year, value.month, -1) : current))}
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <View style={styles.monthCenter}>
              <AppText variant="label" style={styles.monthLabel}>
                {period ? formatMonth(period.year, period.month) : "All periods"}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={period ? "Clear period" : "This month"}
              onPress={() => setPeriod((value) => (value ? null : current))}
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <Ionicons name={period ? "close" : "calendar-outline"} size={18} color={colors.text} />
            </Pressable>
          </View>

          <AppText variant="label" style={styles.sectionTitle}>
            Status
          </AppText>
          <View style={styles.tabTrack}>
            {STATUSES.map((item) => {
              const selected = status === item.id;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setStatus(item.id)}
                  style={[styles.tab, selected && styles.tabSelected]}
                >
                  <AppText
                    variant="caption"
                    color={selected ? colors.primary : colors.textSecondary}
                    style={styles.tabLabel}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText variant="label" style={styles.sectionTitle}>
            Method
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <Chip label="All methods" selected={!paymentMethod} onPress={() => setPaymentMethod("")} />
            {PAYMENT_METHODS.map((method) => (
              <Chip
                key={method.id}
                label={method.label}
                selected={paymentMethod === method.id}
                onPress={() => setPaymentMethod(method.id)}
              />
            ))}
          </ScrollView>

          <AppText variant="label" style={styles.sectionTitle}>
            Employee
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <Chip label="All" selected={!employeeId} onPress={() => setEmployeeId("")} />
            {employees.map((employee) => (
              <Chip
                key={employee.id}
                label={employee.name}
                selected={employeeId === employee.id}
                onPress={() => setEmployeeId(employee.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="label" style={styles.sectionTitle}>
            Payments
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {`${payments.length} shown`}
          </AppText>
        </View>

        {loading ? (
          <View style={styles.skeleton} accessibilityLabel="Loading payment history">
            <View style={styles.block} />
            <View style={styles.block} />
          </View>
        ) : null}
        {error && payments.length === 0 ? <ErrorView message={error} onRetry={() => load(1)} /> : null}
        {!loading && payments.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
            </View>
            <AppText variant="subtitle" align="center">
              No salary payments yet
            </AppText>
            <AppText variant="body" color={colors.textSecondary} align="center">
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Load more"
            accessibilityState={{ busy: loadingMore }}
            disabled={loadingMore}
            onPress={() => {
              setLoadingMore(true);
              load(pagination.page + 1);
            }}
            style={({ pressed }) => [styles.loadMore, pressed && !loadingMore && styles.pressed]}
          >
            <AppText variant="label" color={colors.primary}>
              {loadingMore ? "Loading..." : "Load more"}
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCenter: {
    flex: 1,
    alignItems: "center",
  },
  monthLabel: {
    fontWeight: "700",
  },
  tabTrack: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabSelected: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tabLabel: {
    fontWeight: "700",
    fontSize: 11,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontWeight: "700",
  },
  empty: {
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  loadMore: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
  },
});
