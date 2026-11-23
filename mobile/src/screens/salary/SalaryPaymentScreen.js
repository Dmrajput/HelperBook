import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AttendanceDateSelector from "../../components/attendance/AttendanceDateSelector";
import PaymentMethodSelector from "../../components/salary/PaymentMethodSelector";
import { confirmSalaryPayment } from "../../components/salary/PaymentConfirmationModal";
import SalaryPaymentSummary from "../../components/salary/SalaryPaymentSummary";
import { methodHint } from "../../constants/salaryPayment";
import { getSalaryById, paySalary } from "../../services/salaryService";
import { colors, spacing } from "../../theme";
import { formatMonth, todayKey } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

function newRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ScreenShell({ navigation, insets, children, footer }) {
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
              Pay salary
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Record a payment
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>
      {children}
      {footer}
    </View>
  );
}

export default function SalaryPaymentScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { salaryId } = route.params;
  const requestId = useRef(newRequestId());
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [method, setMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(todayKey());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const next = await getSalaryById(salaryId);
      setSalary(next);
      if (next.paymentStatus === "paid" && next.payment) {
        setResult({ payment: next.payment, already: true });
      }
    } catch (loadError) {
      setError(loadError.message || "Unable to load salary.");
    } finally {
      setLoading(false);
    }
  }, [salaryId]);

  useFocusEffect(
    useCallback(() => {
      if (!result) load();
    }, [load, result])
  );

  function validate() {
    if (!method) return "Payment method required.";
    if (!paymentDate) return "Payment date required.";
    const trimmed = reference.trim();
    if (trimmed.length > 100) return "Payment reference cannot exceed 100 characters.";
    if (notes.trim().length > 500) return "Notes must be 500 characters or less.";
    return "";
  }

  async function submit() {
    if (submitting) return;
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const data = await paySalary(salary.id, {
        paymentMethod: method,
        paymentReference: reference.trim(),
        paymentDate,
        notes: notes.trim(),
        requestId: requestId.current,
      });
      setSalary(data.salary);
      setResult({ payment: data.payment, already: false });
    } catch (payError) {
      if (payError.status === 409) {
        setFormError(payError.message || "This salary has already been marked as paid.");
        await load();
      } else if (payError.isNetworkError) {
        setFormError("Payment could not be recorded.\n\nPlease check your internet connection and try again.");
      } else {
        setFormError(payError.message || "Unable to record payment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !salary) {
    return (
      <ScreenShell navigation={navigation} insets={insets}>
        <View style={styles.loadingWrap} accessibilityLabel="Loading salary">
          <View style={styles.block} />
        </View>
      </ScreenShell>
    );
  }

  if (!salary) {
    return (
      <ScreenShell navigation={navigation} insets={insets}>
        <View style={styles.loadingWrap}>
          <ErrorView message={error || "Unable to load salary."} onRetry={load} />
        </View>
      </ScreenShell>
    );
  }

  const period = formatMonth(salary.year, salary.month);
  const amount = salary.calculation?.netSalary ?? 0;

  if (result?.payment) {
    return (
      <ScreenShell
        navigation={navigation}
        insets={insets}
        footer={
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View payment"
              onPress={() => navigation.replace("SalaryPaymentDetail", { paymentId: result.payment.id })}
              style={({ pressed }) => [styles.footerSecondary, pressed && styles.pressed]}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <AppText variant="label" color={colors.primary}>
                View payment
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              onPress={() => navigation.navigate("SalaryDetail", { salaryId: salary.id })}
              style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
            >
              <Ionicons name="checkmark" size={18} color={colors.textInverse} />
              <AppText variant="label" color={colors.textInverse}>
                Done
              </AppText>
            </Pressable>
          </View>
        }
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <View style={styles.successCopy}>
              <AppText variant="label" style={styles.successTitle}>
                {result.already ? "Salary already paid" : "Salary paid successfully"}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Payment is recorded in history.
              </AppText>
            </View>
          </View>
          <SalaryPaymentSummary
            employeeName={salary.employee?.name}
            periodLabel={period}
            amount={result.payment.amount}
            paymentMethod={result.payment.paymentMethod}
            paymentDate={result.payment.paymentDate}
            paymentReference={result.payment.paymentReference}
            status={result.payment.status}
            notes={result.payment.notes}
          />
        </ScrollView>
      </ScreenShell>
    );
  }

  const canPay = !submitting && amount > 0;

  return (
    <ScreenShell
      navigation={navigation}
      insets={insets}
      footer={
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pay ${formatInr(amount)}`}
            accessibilityState={{ disabled: !canPay, busy: submitting }}
            disabled={!canPay}
            onPress={() => {
              const problem = validate();
              if (problem) {
                setFormError(problem);
                return;
              }
              confirmSalaryPayment({
                employeeName: salary.employee?.name || "this employee",
                amount,
                method,
                date: paymentDate,
                reference: reference.trim(),
                onConfirm: submit,
              });
            }}
            style={({ pressed }) => [
              styles.footerPrimary,
              !canPay && styles.footerDisabled,
              pressed && canPay && styles.pressed,
            ]}
          >
            <Ionicons name="cash-outline" size={18} color={canPay ? colors.textInverse : colors.disabledText} />
            <AppText variant="label" color={canPay ? colors.textInverse : colors.disabledText}>
              {submitting ? "Recording payment..." : `Pay ${formatInr(amount)}`}
            </AppText>
          </Pressable>
        </View>
      }
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIcon}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.summaryCopy}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Employee
                </AppText>
                <AppText variant="label" style={styles.summaryName} numberOfLines={1}>
                  {salary.employee?.name || "Employee"}
                </AppText>
              </View>
            </View>
            <View style={styles.summaryMetrics}>
              <View style={styles.summaryMetric}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Period
                </AppText>
                <AppText variant="label" style={styles.metricValue}>
                  {period}
                </AppText>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.summaryMetric}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Final salary
                </AppText>
                <AppText variant="label" style={styles.metricValue}>
                  {formatInr(amount)}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <AppText variant="label" style={styles.sectionTitle}>
              Payment method
            </AppText>
            <PaymentMethodSelector value={method} onChange={setMethod} disabled={submitting} />
            <AppText variant="label" style={styles.sectionTitle}>
              Payment date
            </AppText>
            <AttendanceDateSelector date={paymentDate} onChange={setPaymentDate} />
            <AppTextInput
              label="Payment reference"
              value={reference}
              onChangeText={setReference}
              placeholder={methodHint(method)}
              maxLength={100}
            />
            <AppText variant="caption" color={colors.textSecondary}>
              {methodHint(method)}
            </AppText>
            <AppTextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              maxLength={500}
              multiline
            />
          </View>
          <FieldError message={formError} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
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
  loadingWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  summaryName: {
    fontWeight: "700",
    fontSize: 16,
  },
  summaryMetrics: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  summaryMetric: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  metricValue: {
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successBackground,
    borderRadius: 16,
    padding: spacing.md,
  },
  successCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  successTitle: {
    fontWeight: "700",
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
  block: {
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
