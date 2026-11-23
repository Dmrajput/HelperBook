import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import { getEmployeeSalaries } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { currentYearMonth, formatMonth } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

function shiftPeriod(year, month, delta) {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

function shortPaidOn(key) {
  if (!key) return "";
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function EmployeeSalaryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fallbackPeriod = currentYearMonth();
  const [period, setPeriod] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const activePeriod = period || fallbackPeriod;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployeeSalaries();
      const rows = data.salaries || [];
      setSalaries(rows);
      setError("");
      setPeriod((currentPeriod) => {
        if (currentPeriod) return currentPeriod;
        if (rows.length) return { year: rows[0].year, month: rows[0].month };
        return fallbackPeriod;
      });
    } catch (loadError) {
      setError(loadError?.message || "Unable to load salary.");
    } finally {
      setLoading(false);
    }
  }, [fallbackPeriod.year, fallbackPeriod.month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const salary = useMemo(
    () => salaries.find((row) => row.year === activePeriod.year && row.month === activePeriod.month) || null,
    [salaries, activePeriod]
  );

  const calc = salary?.calculation || {};
  const deductions =
    Number(calc.deduction || 0) + Number(calc.attendanceDeduction || 0) + Number(calc.leaveDeduction || 0);
  const base = Number(calc.baseSalary || 0);
  const bonus = Number(calc.bonus || 0);
  const advance = Number(calc.advanceDeduction || 0);
  const net = Number(calc.netSalary || salary?.finalSalary || 0);
  const expected = base + bonus - deductions - advance;
  const needsReconcile = salary && Math.abs(expected - net) > 0.5;
  const paid = salary?.paymentStatus === "paid";

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Salary
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Finalized pay
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {error ? <ErrorView message={error} onRetry={load} /> : null}

        <View style={styles.monthCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => setPeriod((value) => shiftPeriod((value || fallbackPeriod).year, (value || fallbackPeriod).month, -1))}
            style={styles.monthBtn}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <AppText variant="label" style={styles.monthLabel}>
            {formatMonth(activePeriod.year, activePeriod.month)}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => setPeriod((value) => shiftPeriod((value || fallbackPeriod).year, (value || fallbackPeriod).month, 1))}
            style={styles.monthBtn}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

        {!loading && !salary && !error ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={22} color={colors.primary} />
            </View>
            <AppText variant="label" style={styles.emptyTitle}>
              No salary for this month
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              Choose another month, or wait until your shop finalizes pay.
            </AppText>
          </View>
        ) : null}

        {salary ? (
          <>
            <View style={styles.summaryCard}>
              <View style={[styles.statusBadge, paid ? styles.statusPaid : styles.statusUnpaid]}>
                <Ionicons
                  name={paid ? "checkmark-circle" : "time-outline"}
                  size={14}
                  color={paid ? colors.success : colors.warning}
                />
                <AppText variant="caption" color={paid ? colors.success : colors.warning} style={styles.statusText}>
                  {paid ? "Paid" : "Unpaid"}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary}>
                {paid ? "Net salary paid" : "Net salary"}
              </AppText>
              <AppText variant="heading" style={styles.amount}>
                {formatInr(net)}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {paid && salary.paidOn ? `Paid on ${shortPaidOn(salary.paidOn)}` : "Awaiting payment"}
              </AppText>
            </View>

            <View style={styles.breakdownCard}>
              <AppText variant="label" style={styles.breakdownTitle}>
                Salary breakdown
              </AppText>
              <BreakdownRow label="Base salary" value={formatInr(base)} />
              <BreakdownRow label="Bonus" value={formatInr(bonus)} />
              <BreakdownRow label="Deductions" value={formatInr(deductions)} />
              <BreakdownRow label="Advance deduction" value={`-${formatInr(advance)}`} danger last />

              {needsReconcile ? (
                <View style={styles.warnBox}>
                  <Ionicons name="warning-outline" size={18} color="#B45309" />
                  <View style={styles.warnCopy}>
                    <AppText variant="label" style={styles.warnTitle}>
                      Breakdown needs reconciliation
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Line items do not add up to the net salary shown above.
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      {salary?.receiptAvailable ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View receipt"
            onPress={() => navigation.navigate("EmployeeSalaryReceipt", { salaryId: salary.id })}
            style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.textInverse} />
            <AppText variant="label" color={colors.textInverse}>
              View receipt
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function BreakdownRow({ label, value, danger, last }) {
  return (
    <View style={[styles.breakdownRow, !last && styles.breakdownBorder]}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="label" color={danger ? colors.error : colors.text} style={styles.breakdownValue}>
        {value}
      </AppText>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  monthCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  monthBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontWeight: "700",
    fontSize: 16,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  statusPaid: {
    backgroundColor: colors.successBackground,
  },
  statusUnpaid: {
    backgroundColor: colors.warningBackground,
  },
  statusText: {
    fontWeight: "700",
  },
  amount: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  breakdownTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  breakdownBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  breakdownValue: {
    fontWeight: "700",
  },
  warnBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warnCopy: {
    flex: 1,
    gap: 2,
  },
  warnTitle: {
    fontWeight: "700",
    color: "#9A3412",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerPrimary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.88,
  },
});
