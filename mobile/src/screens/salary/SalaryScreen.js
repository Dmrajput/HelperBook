import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import SalaryCard from "../../components/salary/SalaryCard";
import SalarySummary from "../../components/salary/SalarySummary";
import useSalary from "../../hooks/useSalary";
import { calculateAllSalaries, calculateSalary } from "../../services/salaryService";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { currentYearMonth } from "../../utils/attendanceFormat";

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

const FILTERS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "finalized", label: "Finalized" },
  { id: "unpaid", label: "Unpaid" },
];

function shiftMonth(year, month, delta) {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

function monthLabel(year, month) {
  return `${MONTHS[month - 1]} ${year}`;
}

function paymentDetail(salary) {
  if (!salary || salary.status !== "finalized") return "";
  if (salary.paymentStatus === "paid" && salary.payment) {
    return `${methodLabel(salary.payment.paymentMethod)}`;
  }
  if (salary.payment?.status === "reversed") return "Payment reversed";
  return "";
}

export default function SalaryScreen({ navigation, route }) {
  const current = currentYearMonth();
  const [period, setPeriod] = useState(current);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(route.params?.paymentFilter === "unpaid" ? "unpaid" : "all");
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, loading, refreshing, error, reload } = useSalary(period.year, period.month);
  useEffect(() => {
    if (route.params?.paymentFilter === "unpaid") setStatus("unpaid");
  }, [route.params?.paymentFilter]);

  const futureBlocked =
    period.year > current.year || (period.year === current.year && period.month >= current.month);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.salaries || []).filter((row) => {
      if (query && !row.employee.name.toLowerCase().includes(query)) {
        return false;
      }
      if (status === "draft") return row.salary?.status === "draft";
      if (status === "finalized") return row.salary?.status === "finalized";
      if (status === "unpaid") return row.salary?.status === "finalized" && row.salary?.paymentStatus !== "paid";
      return true;
    });
  }, [data, search, status]);

  async function openEmployee(row) {
    if (busy) return;
    setActionError("");
    if (row.salary?.id) {
      navigation.navigate("SalaryDetail", { salaryId: row.salary.id });
      return;
    }
    setBusy(row.employee.id);
    try {
      const salary = await calculateSalary({
        employeeId: row.employee.id,
        year: period.year,
        month: period.month,
      });
      await reload();
      navigation.navigate("SalaryDetail", { salaryId: salary.id });
    } catch (calculateError) {
      setActionError(calculateError.message || "Unable to calculate salary. Please try again.");
    } finally {
      setBusy("");
    }
  }

  function confirmCalculateAll() {
    Alert.alert(
      "Calculate Salaries?",
      `This will calculate salaries for eligible employees for ${monthLabel(period.year, period.month)}.\n\nExisting finalized salaries will not be changed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Calculate", onPress: runCalculateAll },
      ]
    );
  }

  async function runCalculateAll() {
    if (busy) return;
    setBusy("all");
    setActionError("");
    try {
      const result = await calculateAllSalaries({ year: period.year, month: period.month });
      await reload();
      if (result.failures?.length) {
        setActionError(result.failures[0].message || "Some salaries could not be calculated.");
      }
    } catch (calculateError) {
      setActionError(calculateError.message || "Unable to calculate salary. Please try again.");
    } finally {
      setBusy("");
    }
  }

  const noEmployees = !loading && data && data.summary.totalEmployees === 0;
  const noneCalculated = !loading && data && data.summary.totalEmployees > 0 && data.summary.calculated === 0;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
      >
        <AppText variant="heading">Salary</AppText>
        <View style={styles.monthRow}>
          <AppButton
            label="Previous"
            variant="secondary"
            onPress={() => setPeriod((value) => shiftMonth(value.year, value.month, -1))}
            disabled={Boolean(busy)}
          />
          <AppText variant="subtitle">{monthLabel(period.year, period.month)}</AppText>
          <AppButton
            label="Next"
            variant="secondary"
            onPress={() => setPeriod((value) => shiftMonth(value.year, value.month, 1))}
            disabled={futureBlocked || Boolean(busy)}
          />
        </View>
        {loading && !data ? (
          <View style={styles.skeleton} accessibilityLabel="Loading salaries">
            <View style={styles.block} />
            <View style={styles.block} />
          </View>
        ) : null}
        {error && !data ? <ErrorView message={error} onRetry={reload} /> : null}
        {data ? (
          <>
            <SalarySummary summary={data.summary} monthLabel={monthLabel(period.year, period.month)} />
            <AppTextInput label="Search employee" value={search} onChangeText={setSearch} placeholder="Name" />
            <View style={styles.filters}>
              {FILTERS.map((filter) => (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: status === filter.id }}
                  onPress={() => setStatus(filter.id)}
                  style={[styles.filter, status === filter.id && styles.filterSelected]}
                >
                  <AppText variant="caption" color={status === filter.id ? colors.textInverse : colors.text}>
                    {filter.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            {actionError ? (
              <AppText variant="caption" color={colors.error}>
                {actionError}
              </AppText>
            ) : null}
            {noEmployees ? (
              <View style={styles.empty}>
                <AppText variant="subtitle">No employees available.</AppText>
                <AppText variant="body" color={colors.textSecondary}>
                  Add employees before calculating salary.
                </AppText>
                <AppButton label="Add Employee" onPress={() => navigation.navigate("AddEmployee")} />
              </View>
            ) : null}
            {status === "unpaid" && rows.length === 0 && !noneCalculated && !noEmployees ? (
              <AppText variant="body" color={colors.textSecondary}>
                All finalized salaries are paid.
              </AppText>
            ) : null}
            {noneCalculated ? (
              <View style={styles.empty}>
                <AppText variant="subtitle">No salaries calculated for this month.</AppText>
                <AppButton label="Calculate Salaries" onPress={confirmCalculateAll} loading={busy === "all"} disabled={Boolean(busy)} />
              </View>
            ) : null}
            {rows.map((row) => {
              const unpaid = row.salary?.status === "finalized" && row.salary?.paymentStatus !== "paid";
              return (
                <SalaryCard
                  key={row.employee.id}
                  name={row.employee.name}
                  amount={row.salary ? row.salary.calculation.netSalary : null}
                  status={row.salary?.status}
                  paymentStatus={
                    row.salary?.status === "finalized"
                      ? row.salary.payment?.status === "reversed" && row.salary.paymentStatus !== "paid"
                        ? "reversed"
                        : row.salary.paymentStatus || "unpaid"
                      : ""
                  }
                  detail={paymentDetail(row.salary)}
                  actionLabel={!row.salary ? "Calculate Salary" : unpaid ? "Pay Salary" : "Review Salary"}
                  disabled={Boolean(busy)}
                  onPress={() => openEmployee(row)}
                />
              );
            })}
            <AppButton label="Payment history" variant="secondary" onPress={() => navigation.navigate("SalaryPaymentHistory")} />
            {!noEmployees ? (
              <AppButton
                label="Calculate All Salaries"
                onPress={confirmCalculateAll}
                loading={busy === "all"}
                disabled={Boolean(busy)}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  filters: { flexDirection: "row", gap: spacing.sm },
  filter: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  empty: { gap: spacing.sm },
  skeleton: { gap: spacing.md },
  block: {
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.disabled,
  },
});
