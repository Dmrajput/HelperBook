import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import SalaryCard from "../../components/salary/SalaryCard";
import SalarySummary from "../../components/salary/SalarySummary";
import useSalary from "../../hooks/useSalary";
import { calculateAllSalaries, calculateSalary } from "../../services/salaryService";
import { colors, spacing } from "../../theme";
import { currentYearMonth } from "../../utils/attendanceFormat";
import { roleLabel } from "../../utils/employeeFormat";

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

const WORKFLOW = [
  { id: 1, title: "Calculate", subtitle: "Build drafts" },
  { id: 2, title: "Finalize", subtitle: "Confirm pay" },
  { id: 3, title: "Pay", subtitle: "Record payment" },
];

function shiftMonth(year, month, delta) {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

function monthLabel(year, month) {
  return `${MONTHS[month - 1]} ${year}`;
}

function countUnpaid(salaries = []) {
  return salaries.filter(
    (row) => row.salary?.status === "finalized" && row.salary?.paymentStatus !== "paid"
  ).length;
}

function activeWorkflowStep(summary, unpaidCount) {
  const total = Number(summary?.totalEmployees) || 0;
  const calculated = Number(summary?.calculated) || 0;
  const draft = Number(summary?.draft) || 0;
  if (calculated < total) return 1;
  if (draft > 0) return 2;
  if (unpaidCount > 0) return 3;
  return 3;
}

function WorkflowCard({ activeStep }) {
  return (
    <View style={styles.workflowCard}>
      {WORKFLOW.map((step, index) => {
        const active = step.id === activeStep;
        const done = step.id < activeStep;
        return (
          <View key={step.id} style={styles.workflowStep}>
            <View style={styles.workflowTop}>
              <View style={[styles.stepCircle, (active || done) && styles.stepCircleActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                ) : (
                  <AppText
                    variant="caption"
                    color={active || done ? colors.textInverse : colors.textSecondary}
                    style={styles.stepNumber}
                  >
                    {step.id}
                  </AppText>
                )}
              </View>
              {index < WORKFLOW.length - 1 ? (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              ) : null}
            </View>
            <AppText
              variant="label"
              color={active ? colors.primary : colors.text}
              style={styles.stepTitle}
              numberOfLines={1}
            >
              {step.title}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
              {step.subtitle}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

export default function SalaryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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

  const unpaidCount = useMemo(() => countUnpaid(data?.salaries), [data?.salaries]);

  const filterCounts = useMemo(() => {
    const salaries = data?.salaries || [];
    return {
      all: salaries.length,
      draft: salaries.filter((row) => row.salary?.status === "draft").length,
      finalized: salaries.filter((row) => row.salary?.status === "finalized").length,
      unpaid: countUnpaid(salaries),
    };
  }, [data?.salaries]);

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

  const workflowStep = activeWorkflowStep(data?.summary, unpaidCount);
  const isCurrentMonth = period.year === current.year && period.month === current.month;

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
              Salary
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Calculate and pay staff
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to current month"
            onPress={() => setPeriod(currentYearMonth())}
            style={styles.headerAction}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              disabled={Boolean(busy)}
              onPress={() => setPeriod((value) => shiftMonth(value.year, value.month, -1))}
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <View style={styles.monthCenter}>
              <AppText variant="label" style={styles.monthLabel}>
                {monthLabel(period.year, period.month)}
              </AppText>
              {isCurrentMonth ? (
                <View style={styles.todayChip}>
                  <AppText variant="caption" color={colors.primary} style={styles.todayText}>
                    This month
                  </AppText>
                </View>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              disabled={futureBlocked || Boolean(busy)}
              onPress={() => setPeriod((value) => shiftMonth(value.year, value.month, 1))}
              style={({ pressed }) => [
                styles.monthButton,
                (futureBlocked || busy) && styles.monthDisabled,
                pressed && !futureBlocked && !busy && styles.pressed,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={futureBlocked || busy ? colors.disabledText : colors.text}
              />
            </Pressable>
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
              <SalarySummary summary={data.summary} unpaidCount={unpaidCount} />
              <WorkflowCard activeStep={workflowStep} />

              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={18} color={colors.placeholder} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search employees"
                    placeholderTextColor={colors.placeholder}
                    style={styles.searchInput}
                    accessibilityLabel="Search employees"
                  />
                  {search ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch("")}>
                      <Ionicons name="close-circle" size={18} color={colors.placeholder} />
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear filters"
                  onPress={() => {
                    setSearch("");
                    setStatus("all");
                  }}
                  style={styles.filterIconBtn}
                >
                  <Ionicons name="options-outline" size={18} color={colors.primary} />
                </Pressable>
              </View>

              <View style={styles.tabTrack}>
                {FILTERS.map((filter) => {
                  const selected = status === filter.id;
                  const count = filterCounts[filter.id] ?? 0;
                  return (
                    <Pressable
                      key={filter.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setStatus(filter.id)}
                      style={[styles.tab, selected && styles.tabSelected]}
                    >
                      <AppText
                        variant="caption"
                        color={selected ? colors.primary : colors.textSecondary}
                        style={styles.tabLabel}
                        numberOfLines={1}
                      >
                        {`${filter.label} (${count})`}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {actionError ? (
                <AppText variant="caption" color={colors.error}>
                  {actionError}
                </AppText>
              ) : null}

              {rows.length > 0 ? (
                <View style={styles.sectionHeader}>
                  <AppText variant="label" style={styles.sectionTitle}>
                    Employees
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {`${rows.length} shown`}
                  </AppText>
                </View>
              ) : null}

              {noEmployees ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="people-outline" size={24} color={colors.primary} />
                  </View>
                  <AppText variant="subtitle">No employees available</AppText>
                  <AppText variant="body" color={colors.textSecondary} align="center">
                    Add employees before calculating salary.
                  </AppText>
                  <AppButton label="Add Employee" onPress={() => navigation.navigate("AddEmployee")} />
                </View>
              ) : null}

              {status === "unpaid" && rows.length === 0 && !noneCalculated && !noEmployees ? (
                <View style={styles.empty}>
                  <AppText variant="body" color={colors.textSecondary} align="center">
                    All finalized salaries are paid.
                  </AppText>
                </View>
              ) : null}

              {noneCalculated ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="calculator-outline" size={24} color={colors.primary} />
                  </View>
                  <AppText variant="subtitle">No salaries calculated</AppText>
                  <AppText variant="body" color={colors.textSecondary} align="center">
                    Use Calculate all to generate drafts for eligible staff.
                  </AppText>
                </View>
              ) : null}

              {rows.map((row) => {
                const unpaid = row.salary?.status === "finalized" && row.salary?.paymentStatus !== "paid";
                return (
                  <SalaryCard
                    key={row.employee.id}
                    name={row.employee.name}
                    role={roleLabel(row.employee)}
                    amount={row.salary ? row.salary.calculation.netSalary : null}
                    status={row.salary?.status}
                    paymentStatus={
                      row.salary?.status === "finalized"
                        ? row.salary.payment?.status === "reversed" && row.salary.paymentStatus !== "paid"
                          ? "reversed"
                          : row.salary.paymentStatus || "unpaid"
                        : ""
                    }
                    actionLabel={!row.salary ? "Calculate" : unpaid ? "Pay now" : "Review"}
                    disabled={Boolean(busy)}
                    onPress={() => openEmployee(row)}
                  />
                );
              })}
            </>
          ) : null}
        </ScrollView>

        {data && !noEmployees ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Payment history"
              onPress={() => navigation.navigate("SalaryPaymentHistory")}
              style={({ pressed }) => [styles.footerSecondary, pressed && styles.pressed]}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <AppText variant="label" color={colors.primary}>
                Payment history
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Calculate all salaries"
              accessibilityState={{ disabled: Boolean(busy) }}
              disabled={Boolean(busy)}
              onPress={confirmCalculateAll}
              style={({ pressed }) => [
                styles.footerPrimary,
                pressed && !busy && styles.pressed,
                busy && styles.footerDisabled,
              ]}
            >
              <Ionicons name="calculator-outline" size={18} color={busy ? colors.disabledText : colors.textInverse} />
              <AppText variant="label" color={busy ? colors.disabledText : colors.textInverse}>
                {busy === "all" ? "Calculating..." : "Calculate all"}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
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
    paddingBottom: spacing.lg,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
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
  monthDisabled: {
    opacity: 0.4,
  },
  monthCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  monthLabel: {
    fontWeight: "700",
  },
  todayChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayText: {
    fontWeight: "700",
    fontSize: 11,
  },
  workflowCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  workflowStep: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  workflowTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontWeight: "700",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: colors.primary,
  },
  stepTitle: {
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
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
    paddingHorizontal: 2,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
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
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerSecondary: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerPrimary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
