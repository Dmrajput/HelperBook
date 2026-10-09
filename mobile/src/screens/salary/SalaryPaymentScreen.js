import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
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

export default function SalaryPaymentScreen({ navigation, route }) {
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
      <AppScreen title="Pay salary" subtitle="Record a payment" icon="cash">
        <View style={styles.block} accessibilityLabel="Loading salary" />
      </AppScreen>
    );
  }

  if (!salary) {
    return (
      <AppScreen title="Pay salary" subtitle="Record a payment" icon="cash">
        <ErrorView message={error || "Unable to load salary."} onRetry={load} />
      </AppScreen>
    );
  }

  const period = formatMonth(salary.year, salary.month);
  const amount = salary.calculation?.netSalary ?? 0;

  if (result?.payment) {
    return (
      <AppScreen title="Pay salary" subtitle="Record a payment" icon="cash">
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppText variant="heading">{result.already ? "Salary already paid." : "Salary Paid Successfully"}</AppText>
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
          <AppButton
            label="View Payment"
            onPress={() => navigation.replace("SalaryPaymentDetail", { paymentId: result.payment.id })}
          />
          <AppButton label="Done" variant="secondary" onPress={() => navigation.navigate("SalaryDetail", { salaryId: salary.id })} />
        </ScrollView>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Pay salary" subtitle="Record a payment" icon="cash">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <AppText variant="body">Employee {salary.employee?.name}</AppText>
          <AppText variant="body">Salary Period {period}</AppText>
          <AppText variant="subtitle">Final Salary {formatInr(amount)}</AppText>
        </View>
        <PaymentMethodSelector value={method} onChange={setMethod} disabled={submitting} />
        <AppText variant="label">Payment Date</AppText>
        <AttendanceDateSelector date={paymentDate} onChange={setPaymentDate} />
        <AppTextInput
          label="Payment Reference"
          value={reference}
          onChangeText={setReference}
          placeholder={methodHint(method)}
          maxLength={100}
        />
        <AppText variant="caption" color={colors.textSecondary}>
          {methodHint(method)}
        </AppText>
        <AppTextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" maxLength={500} multiline />
        <FieldError message={formError} />
        <AppButton
          label={submitting ? "Recording payment..." : `Pay ${formatInr(amount)}`}
          disabled={submitting || amount <= 0}
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
        />
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
  block: { height: 120, borderRadius: 12, backgroundColor: colors.disabled },
});
