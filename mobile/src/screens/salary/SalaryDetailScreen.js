import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
import BonusForm from "../../components/salary/BonusForm";
import DeductionForm from "../../components/salary/DeductionForm";
import PaidLeaveEditor from "../../components/salary/PaidLeaveEditor";
import PaymentStatusBadge from "../../components/salary/PaymentStatusBadge";
import SalaryBreakdown from "../../components/salary/SalaryBreakdown";
import { methodLabel } from "../../constants/salaryPayment";
import {
  finalizeSalary,
  getSalaryById,
  recalculateSalary,
  reopenSalary,
  updateSalary,
} from "../../services/salaryService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

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

const MODES = [
  { id: "working_days", label: "Working days" },
  { id: "calendar_days", label: "Calendar days" },
];

function SettingsRow({ label, value, badge = false }) {
  return (
    <View style={styles.settingsRow}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      {badge ? (
        <View style={styles.daysBadge}>
          <AppText variant="caption" color={colors.primary} style={styles.daysBadgeText}>
            {value}
          </AppText>
        </View>
      ) : (
        <AppText variant="label" style={styles.settingsValue}>
          {value}
        </AppText>
      )}
    </View>
  );
}

function AdjustmentRow({
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  amount,
  amountColor,
  expanded,
  onToggle,
  children,
}) {
  return (
    <View style={styles.adjustBlock}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        onPress={onToggle}
        style={styles.adjustHeader}
      >
        <View style={[styles.adjustIcon, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.adjustCopy}>
          <AppText variant="label" style={styles.adjustTitle}>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {subtitle}
          </AppText>
        </View>
        {amount != null ? (
          <View style={[styles.amountChip, { backgroundColor: iconBackground }]}>
            <AppText variant="caption" color={amountColor || iconColor} style={styles.amountChipText}>
              {amount}
            </AppText>
          </View>
        ) : null}
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={iconColor} />
      </Pressable>
      {expanded ? <View style={styles.adjustBody}>{children}</View> : null}
    </View>
  );
}

export default function SalaryDetailScreen({ navigation, route }) {
  const { salaryId } = route.params;
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [showAttendance, setShowAttendance] = useState(false);
  const [expanded, setExpanded] = useState({
    leave: false,
    bonus: false,
    deduction: false,
    advance: false,
  });

  const load = useCallback(async () => {
    setError("");
    try {
      setSalary(await getSalaryById(salaryId));
    } catch (loadError) {
      setError(loadError.message || "Unable to load salary. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [salaryId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (salary?.advance?.available) {
      setAdvanceAmount(String(salary.advance.thisMonth ?? 0));
    }
  }, [salary]);

  async function run(action, work) {
    if (busy) return;
    setBusy(action);
    setError("");
    try {
      setSalary(await work());
    } catch (actionError) {
      setError(actionError.message || "Unable to update salary. Please try again.");
    } finally {
      setBusy("");
    }
  }

  function confirmFinalize() {
    Alert.alert(
      "Finalize Salary?",
      "Once finalized, attendance or other changes will not automatically change this salary.\n\nYou can reopen it later if a correction is required.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Finalize", onPress: () => run("finalize", () => finalizeSalary(salary.id)) },
      ]
    );
  }

  function confirmReopen() {
    Alert.alert("Reopen Salary?", "This will allow the salary to be recalculated.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reopen", onPress: () => run("reopen", () => reopenSalary(salary.id)) },
    ]);
  }

  function toggleSection(key) {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  }

  if (loading && !salary) {
    return (
      <AppScreen title="Salary" subtitle="Loading" icon="wallet">
        <View style={styles.skeleton} accessibilityLabel="Loading salary">
          <View style={styles.block} />
          <View style={styles.block} />
        </View>
      </AppScreen>
    );
  }

  if (!salary) {
    return (
      <AppScreen title="Salary" subtitle="Could not load this salary" icon="wallet">
        <ErrorView message={error || "Unable to load salary. Please try again."} onRetry={load} />
      </AppScreen>
    );
  }

  const draft = salary.status === "draft";
  const attendance = salary.attendance || {};
  const calculation = salary.calculation || {};
  const monthName = `${MONTHS[salary.month - 1]} ${salary.year}`;
  const statusLabel =
    salary.status === "draft"
      ? "Draft"
      : salary.paymentStatus === "paid"
        ? "Paid"
        : salary.status === "finalized"
          ? "Finalized"
          : salary.status;
  const statusTone =
    salary.status === "draft"
      ? "warning"
      : salary.paymentStatus === "paid"
        ? "success"
        : "info";

  return (
    <AppScreen
      title={salary.employee?.name || "Salary"}
      subtitle={`Salary • ${monthName}`}
      headerRight={
        <View
          style={[
            styles.statusPill,
            statusTone === "warning" && styles.statusWarning,
            statusTone === "success" && styles.statusSuccess,
            statusTone === "info" && styles.statusInfo,
          ]}
        >
          <AppText
            variant="caption"
            color={
              statusTone === "warning" ? colors.warning : statusTone === "success" ? colors.success : colors.primary
            }
            style={styles.statusPillText}
          >
            {statusLabel}
          </AppText>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.netCard}>
          <View style={styles.netTop}>
            <View style={styles.netCopy}>
              <AppText variant="caption" color={colors.textSecondary}>
                {draft ? "Estimated net salary" : "Net salary"}
              </AppText>
              <AppText variant="heading" style={styles.netAmount} numberOfLines={1}>
                {formatInr(calculation.netSalary)}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {attendance.beforeJoiningDays > 0 || attendance.afterExitDays > 0
                  ? "Prorated for employment dates, then attendance and deductions"
                  : "After attendance and deductions"}
              </AppText>
            </View>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
            </View>
          </View>
          <View style={styles.netBottom}>
            <View style={styles.netMetric}>
              <AppText variant="caption" color={colors.textSecondary}>
                Base salary
              </AppText>
              <AppText variant="label" style={styles.netMetricValue}>
                {formatInr(calculation.baseSalary)}
              </AppText>
            </View>
            <View style={styles.netMetric}>
              <AppText variant="caption" color={colors.textSecondary}>
                Attendance deduction
              </AppText>
              <AppText variant="label" color={colors.error} style={styles.netMetricValue}>
                {`-${formatInr(calculation.attendanceDeduction || 0)}`}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText variant="label" style={styles.sectionTitle}>
            Salary settings
          </AppText>
          <SettingsRow label="Salary type" value={salary.salaryType === "daily" ? "Daily" : "Monthly"} />
          <SettingsRow label="Salary rate" value={formatInr(salary.salaryRate)} />
          <SettingsRow label="Working days" value={`${salary.workingDays} days`} badge />
          <SettingsRow label="Calendar days" value={`${salary.calendarDays} days`} />
          {attendance.employmentDays != null ? (
            <SettingsRow label="Employed days (this period)" value={`${attendance.employmentDays} days`} badge />
          ) : null}
          {attendance.beforeJoiningDays > 0 ? (
            <SettingsRow label="Days before joining" value={`${attendance.beforeJoiningDays} days`} />
          ) : null}

          {draft ? (
            <View style={styles.modeRow}>
              {MODES.map((mode) => {
                const selected = salary.attendanceDeductionMode === mode.id;
                return (
                  <Pressable
                    key={mode.id}
                    accessibilityRole="button"
                    disabled={Boolean(busy)}
                    onPress={() => run("mode", () => updateSalary(salary.id, { attendanceDeductionMode: mode.id }))}
                    style={[styles.modeChip, selected && styles.modeChipSelected]}
                  >
                    <AppText variant="caption" color={selected ? colors.textInverse : colors.text}>
                      {mode.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showAttendance }}
            onPress={() => setShowAttendance((value) => !value)}
            style={styles.attendanceBanner}
          >
            <View style={styles.attendanceIcon}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
            </View>
            <View style={styles.attendanceCopy}>
              <AppText variant="label" color={colors.primary}>
                Attendance summary
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                {`${attendance.presentDays ?? 0} present • ${attendance.halfDays ?? 0} half day • ${attendance.absentDays ?? 0} absent • ${attendance.leaveDays ?? 0} leave`}
              </AppText>
            </View>
            <Ionicons name={showAttendance ? "chevron-up" : "chevron-forward"} size={16} color={colors.primary} />
          </Pressable>

          {showAttendance ? (
            <View style={styles.attendanceDetails}>
              <AppText variant="caption" color={colors.textSecondary}>
                {`Paid leave ${attendance.paidLeaveDays ?? 0} • Unpaid leave ${attendance.unpaidLeaveDays ?? 0} • Payable days ${attendance.payableDays ?? 0}`}
              </AppText>
              {attendance.beforeJoiningDays > 0 ? (
                <AppText variant="caption" color={colors.textSecondary}>
                  {`Days before joining ${attendance.beforeJoiningDays}`}
                </AppText>
              ) : null}
              {attendance.afterExitDays > 0 ? (
                <AppText variant="caption" color={colors.textSecondary}>
                  {`Days after leaving ${attendance.afterExitDays}`}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.adjustTitleRow}>
            <AppText variant="label" style={styles.sectionTitle}>
              Salary adjustments
            </AppText>
            <View style={styles.sectionsBadge}>
              <AppText variant="caption" color={colors.primary} style={styles.sectionsBadgeText}>
                4 sections
              </AppText>
            </View>
          </View>

          <AdjustmentRow
            title="Paid leave"
            subtitle="Manage eligible paid leave days."
            icon="leaf-outline"
            iconColor={colors.success}
            iconBackground={colors.successBackground}
            expanded={expanded.leave}
            onToggle={() => toggleSection("leave")}
          >
            {draft ? (
              <PaidLeaveEditor
                leaveDays={attendance.leaveDays}
                paidLeaveDays={attendance.paidLeaveDays}
                minPaid={attendance.approvedPaidDays || 0}
                disabled={Boolean(busy)}
                onSave={(paidLeaveDays) => run("leave", () => updateSalary(salary.id, { paidLeaveDays }))}
              />
            ) : (
              <AppText variant="body">
                {`Paid leave ${attendance.paidLeaveDays ?? 0} of ${attendance.leaveDays ?? 0} leave days`}
              </AppText>
            )}
          </AdjustmentRow>

          <AdjustmentRow
            title="Bonus"
            subtitle="Add extra earnings."
            icon="add-circle-outline"
            iconColor={colors.success}
            iconBackground={colors.successBackground}
            amount={formatInr(calculation.bonus || 0)}
            amountColor={colors.success}
            expanded={expanded.bonus}
            onToggle={() => toggleSection("bonus")}
          >
            {draft ? (
              <BonusForm
                bonuses={salary.bonuses}
                disabled={Boolean(busy)}
                onAdd={(entry) => run("bonus", () => updateSalary(salary.id, { bonuses: [...salary.bonuses, entry] }))}
                onRemove={(index) =>
                  run("bonus", () => updateSalary(salary.id, { bonuses: salary.bonuses.filter((_, item) => item !== index) }))
                }
              />
            ) : (
              (salary.bonuses || []).length ? (
                (salary.bonuses || []).map((bonus, index) => (
                  <AppText key={`${bonus.reason}-${index}`} variant="body">
                    {`${bonus.reason || "Bonus"} ${formatInr(bonus.amount)}`}
                  </AppText>
                ))
              ) : (
                <AppText variant="body" color={colors.textSecondary}>
                  No bonuses added.
                </AppText>
              )
            )}
          </AdjustmentRow>

          <AdjustmentRow
            title="Deductions"
            subtitle="Penalties or other deductions."
            icon="remove-circle-outline"
            iconColor={colors.error}
            iconBackground={colors.errorBackground}
            amount={formatInr(calculation.deduction || 0)}
            amountColor={colors.error}
            expanded={expanded.deduction}
            onToggle={() => toggleSection("deduction")}
          >
            {draft ? (
              <DeductionForm
                deductions={salary.deductions}
                disabled={Boolean(busy)}
                onAdd={(entry) =>
                  run("deduction", () => updateSalary(salary.id, { deductions: [...salary.deductions, entry] }))
                }
                onRemove={(index) =>
                  run("deduction", () =>
                    updateSalary(salary.id, { deductions: salary.deductions.filter((_, item) => item !== index) })
                  )
                }
              />
            ) : (
              (salary.deductions || []).length ? (
                (salary.deductions || []).map((deduction, index) => (
                  <AppText key={`${deduction.reason}-${index}`} variant="body">
                    {`${deduction.reason} ${formatInr(deduction.amount)}`}
                  </AppText>
                ))
              ) : (
                <AppText variant="body" color={colors.textSecondary}>
                  No deductions added.
                </AppText>
              )
            )}
          </AdjustmentRow>

          <AdjustmentRow
            title="Advance / Khata"
            subtitle="Outstanding balance and repayment."
            icon="cash-outline"
            iconColor={colors.warning}
            iconBackground={colors.warningBackground}
            amount={formatInr(calculation.advanceDeduction || 0)}
            amountColor={colors.warning}
            expanded={expanded.advance}
            onToggle={() => toggleSection("advance")}
          >
            {salary.advance?.available ? (
              <>
                <AppText variant="body">Outstanding {formatInr(salary.advance.outstanding)}</AppText>
                <AppText variant="body">This month deduction {formatInr(salary.advance.thisMonth)}</AppText>
                <AppText variant="body">
                  {`${salary.advance.projected ? "Projected remaining" : "Remaining"} ${formatInr(salary.advance.remaining)}`}
                </AppText>
                {draft ? (
                  <>
                    <AppTextInput
                      label="This month deduction"
                      value={advanceAmount}
                      onChangeText={setAdvanceAmount}
                      keyboardType="decimal-pad"
                    />
                    <AppButton
                      label="Save advance deduction"
                      variant="secondary"
                      disabled={Boolean(busy)}
                      onPress={() =>
                        run("advance", () => updateSalary(salary.id, { advanceDeduction: Number(advanceAmount) }))
                      }
                    />
                  </>
                ) : null}
              </>
            ) : (
              <AppText variant="body" color={colors.textSecondary}>
                Advance information is unavailable.
              </AppText>
            )}
          </AdjustmentRow>
        </View>

        <SalaryBreakdown calculation={calculation} />

        {!draft ? (
          <View style={styles.card}>
            <AppText variant="label" style={styles.sectionTitle}>
              Payment status
            </AppText>
            <PaymentStatusBadge
              status={
                salary.paymentStatus === "paid"
                  ? "paid"
                  : salary.payment?.status === "reversed"
                    ? "reversed"
                    : "unpaid"
              }
            />
            {salary.paymentStatus === "paid" && salary.payment ? (
              <>
                <AppText variant="body">Paid amount {formatInr(salary.payment.amount)}</AppText>
                <AppText variant="body">Method {methodLabel(salary.payment.paymentMethod)}</AppText>
                <AppText variant="body">Payment date {formatAttendanceDate(salary.payment.paymentDate)}</AppText>
                <AppText variant="body">Reference {salary.payment.paymentReference || "None"}</AppText>
              </>
            ) : null}
            {salary.paymentStatus !== "paid" && salary.payment?.status === "reversed" ? (
              <>
                <AppText variant="body">Previous payment {formatInr(salary.payment.amount)}</AppText>
                <AppText variant="body">Method {methodLabel(salary.payment.paymentMethod)}</AppText>
                {salary.payment.reversedAt ? (
                  <AppText variant="body">
                    Reversed on {formatAttendanceDate(salary.payment.reversedAt.slice(0, 10))}
                  </AppText>
                ) : null}
                {salary.payment.reversalReason ? (
                  <AppText variant="body">Reason {salary.payment.reversalReason}</AppText>
                ) : null}
              </>
            ) : null}
            {(calculation.netSalary || 0) <= 0 ? (
              <AppText variant="body" color={colors.textSecondary}>
                Salary amount must be greater than zero.
              </AppText>
            ) : null}
          </View>
        ) : null}

        <FieldError message={error} />

        {draft ? (
          <>
            <View style={styles.reviewBanner}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <View style={styles.reviewCopy}>
                <AppText variant="label" color={colors.primary}>
                  Review before finalizing
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Confirm attendance, leave, bonus and deductions.
                </AppText>
              </View>
            </View>
            <AppButton
              label="Finalize Salary"
              loading={busy === "finalize"}
              disabled={Boolean(busy)}
              onPress={confirmFinalize}
            />
            <AppButton
              label={busy === "recalculate" ? "Saving..." : "Save Draft"}
              variant="secondary"
              loading={busy === "recalculate"}
              disabled={Boolean(busy)}
              onPress={async () => {
                await run("recalculate", () => recalculateSalary(salary.id));
                navigation.goBack();
              }}
            />
          </>
        ) : (
          <>
            {salary.paymentStatus !== "paid" && (calculation.netSalary || 0) > 0 ? (
              <AppButton
                label="Pay Salary"
                disabled={Boolean(busy)}
                onPress={() => navigation.navigate("SalaryPayment", { salaryId: salary.id })}
              />
            ) : null}
            {salary.paymentStatus === "paid" && salary.payment?.id ? (
              <>
                <AppButton
                  label="View Payment Details"
                  variant="secondary"
                  onPress={() => navigation.navigate("SalaryPaymentDetail", { paymentId: salary.payment.id })}
                />
                <AppButton
                  label="View Receipt"
                  onPress={() => navigation.navigate("SalaryReceipt", { salaryId: salary.id })}
                />
              </>
            ) : null}
            {salary.paymentStatus !== "paid" ? (
              <AppButton
                label="Reopen"
                variant="secondary"
                loading={busy === "reopen"}
                disabled={Boolean(busy)}
                onPress={confirmReopen}
              />
            ) : (
              <AppText variant="caption" color={colors.textSecondary}>
                Reverse the salary payment before reopening this salary.
              </AppText>
            )}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statusWarning: {
    backgroundColor: colors.warningBackground,
  },
  statusSuccess: {
    backgroundColor: colors.successBackground,
  },
  statusInfo: {
    backgroundColor: colors.primaryLight,
  },
  statusPillText: {
    fontWeight: "700",
  },
  netCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  netTop: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  netCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  netAmount: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  netBottom: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  netMetric: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  netMetricValue: {
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 32,
  },
  settingsValue: {
    fontWeight: "700",
  },
  daysBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysBadgeText: {
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  modeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  attendanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  attendanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  attendanceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  attendanceDetails: {
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  adjustTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionsBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionsBadgeText: {
    fontWeight: "700",
  },
  adjustBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  adjustHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
  },
  adjustIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  adjustTitle: {
    fontWeight: "700",
  },
  amountChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  amountChipText: {
    fontWeight: "700",
  },
  adjustBody: {
    gap: spacing.sm,
    paddingLeft: 4,
  },
  reviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.md,
  },
  reviewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  skeleton: { gap: spacing.md },
  block: { height: 120, borderRadius: 12, backgroundColor: colors.disabled },
});
