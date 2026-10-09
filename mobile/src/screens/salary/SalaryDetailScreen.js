import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import SalaryStatusBadge from "../../components/salary/SalaryStatusBadge";
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

function countLine(label, value) {
  return `${label} ${value ?? 0}`;
}

export default function SalaryDetailScreen({ navigation, route }) {
  const { salaryId } = route.params;
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");

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
    Alert.alert(
      "Reopen Salary?",
      "This will allow the salary to be recalculated.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reopen", onPress: () => run("reopen", () => reopenSalary(salary.id)) },
      ]
    );
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
  const monthName = `${MONTHS[salary.month - 1]} ${salary.year}`;

  return (
    <AppScreen title={salary.employee?.name || "Salary"} subtitle={monthName} icon="wallet">
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="subtitle">{monthName}</AppText>
        <SalaryStatusBadge status={salary.status} />
        <AppText variant="body">Salary type {salary.salaryType === "daily" ? "Daily" : "Monthly"}</AppText>
        <AppText variant="body">Salary rate {formatInr(salary.salaryRate)}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {salary.attendanceDeductionMode === "calendar_days" ? "Calendar days" : "Working days"} ·{" "}
          {salary.workingDays} working · {salary.calendarDays} calendar
        </AppText>
        {draft ? (
          <View style={styles.filters}>
            {MODES.map((mode) => (
              <Pressable
                key={mode.id}
                accessibilityRole="button"
                disabled={Boolean(busy)}
                onPress={() => run("mode", () => updateSalary(salary.id, { attendanceDeductionMode: mode.id }))}
                style={[styles.filter, salary.attendanceDeductionMode === mode.id && styles.filterSelected]}
              >
                <AppText
                  variant="caption"
                  color={salary.attendanceDeductionMode === mode.id ? colors.textInverse : colors.text}
                >
                  {mode.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.card}>
          <AppText variant="subtitle">Attendance</AppText>
          <AppText variant="body">{countLine("Present", attendance.presentDays)}</AppText>
          <AppText variant="body">{countLine("Half Day", attendance.halfDays)}</AppText>
          <AppText variant="body">{countLine("Absent", attendance.absentDays)}</AppText>
          <AppText variant="body">{countLine("Leave", attendance.leaveDays)}</AppText>
          <AppText variant="body">{countLine("Paid leave", attendance.paidLeaveDays)}</AppText>
          <AppText variant="body">{countLine("Unpaid leave", attendance.unpaidLeaveDays)}</AppText>
          <AppText variant="body">{countLine("Approved paid leave", attendance.approvedPaidDays || 0)}</AppText>
          <AppText variant="body">{countLine("Approved unpaid leave", attendance.approvedUnpaidDays || 0)}</AppText>
          <AppText variant="body">{countLine("Payable days", attendance.payableDays)}</AppText>
          {attendance.beforeJoiningDays > 0 ? (
            <AppText variant="body">{countLine("Days before joining", attendance.beforeJoiningDays)}</AppText>
          ) : null}
          {attendance.afterExitDays > 0 ? (
            <AppText variant="body">{countLine("Days after leaving", attendance.afterExitDays)}</AppText>
          ) : null}
        </View>
        <SalaryBreakdown calculation={salary.calculation} />
        {draft ? (
          <>
            <PaidLeaveEditor
              leaveDays={attendance.leaveDays}
              paidLeaveDays={attendance.paidLeaveDays}
              minPaid={attendance.approvedPaidDays || 0}
              disabled={Boolean(busy)}
              onSave={(paidLeaveDays) => run("leave", () => updateSalary(salary.id, { paidLeaveDays }))}
            />
            <BonusForm
              bonuses={salary.bonuses}
              disabled={Boolean(busy)}
              onAdd={(entry) => run("bonus", () => updateSalary(salary.id, { bonuses: [...salary.bonuses, entry] }))}
              onRemove={(index) =>
                run("bonus", () => updateSalary(salary.id, { bonuses: salary.bonuses.filter((_, item) => item !== index) }))
              }
            />
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
          </>
        ) : (
          <View style={styles.card}>
            <AppText variant="subtitle">Bonus {formatInr(salary.calculation.bonus)}</AppText>
            {(salary.bonuses || []).map((bonus, index) => (
              <AppText key={`${bonus.reason}-${index}`} variant="body">
                {bonus.reason || "Bonus"} {formatInr(bonus.amount)}
              </AppText>
            ))}
            <AppText variant="subtitle">Deduction {formatInr(salary.calculation.deduction)}</AppText>
            {(salary.deductions || []).map((deduction, index) => (
              <AppText key={`${deduction.reason}-${index}`} variant="body">
                {deduction.reason} {formatInr(deduction.amount)}
              </AppText>
            ))}
          </View>
        )}
        <View style={styles.card}>
          <AppText variant="subtitle">Advance</AppText>
          {salary.advance?.available ? (
            <>
              <AppText variant="body">Advance outstanding {formatInr(salary.advance.outstanding)}</AppText>
              <AppText variant="body">This month deduction {formatInr(salary.advance.thisMonth)}</AppText>
              <AppText variant="body">
                {salary.advance.projected ? "Projected remaining" : "Remaining"} {formatInr(salary.advance.remaining)}
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
        </View>
        {!draft ? (
          <View style={styles.card}>
            <AppText variant="subtitle">Payment Status</AppText>
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
                <AppText variant="body">Paid Amount {formatInr(salary.payment.amount)}</AppText>
                <AppText variant="body">Method {methodLabel(salary.payment.paymentMethod)}</AppText>
                <AppText variant="body">Payment Date {formatAttendanceDate(salary.payment.paymentDate)}</AppText>
                <AppText variant="body">Reference {salary.payment.paymentReference || "None"}</AppText>
              </>
            ) : null}
            {salary.paymentStatus !== "paid" && salary.payment?.status === "reversed" ? (
              <>
                <AppText variant="body">Previous Payment {formatInr(salary.payment.amount)}</AppText>
                <AppText variant="body">Method {methodLabel(salary.payment.paymentMethod)}</AppText>
                {salary.payment.reversedAt ? (
                  <AppText variant="body">Reversed On {formatAttendanceDate(salary.payment.reversedAt.slice(0, 10))}</AppText>
                ) : null}
                {salary.payment.reversalReason ? <AppText variant="body">Reason {salary.payment.reversalReason}</AppText> : null}
              </>
            ) : null}
            {(salary.calculation?.netSalary || 0) <= 0 ? (
              <AppText variant="body" color={colors.textSecondary}>
                Salary amount must be greater than zero.
              </AppText>
            ) : null}
          </View>
        ) : null}
        <FieldError message={error} />
        {draft ? (
          <>
            <AppButton
              label="Recalculate"
              variant="secondary"
              loading={busy === "recalculate"}
              disabled={Boolean(busy)}
              onPress={() => run("recalculate", () => recalculateSalary(salary.id))}
            />
            <AppButton label="Finalize Salary" loading={busy === "finalize"} disabled={Boolean(busy)} onPress={confirmFinalize} />
          </>
        ) : (
          <>
            {salary.paymentStatus !== "paid" && (salary.calculation?.netSalary || 0) > 0 ? (
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
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
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
  skeleton: { gap: spacing.md },
  block: { height: 120, borderRadius: 12, backgroundColor: colors.disabled },
});
