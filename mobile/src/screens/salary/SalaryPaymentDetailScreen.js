import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
import SalaryPaymentSummary from "../../components/salary/SalaryPaymentSummary";
import { getSalaryPaymentById, reverseSalaryPayment } from "../../services/salaryService";
import { colors, spacing } from "../../theme";

export default function SalaryPaymentDetailScreen({ navigation, route }) {
  const { paymentId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getSalaryPaymentById(paymentId));
    } catch (loadError) {
      setError(loadError.message || "Unable to load payment history.");
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmReverse() {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setFormError("Enter a reversal reason of at least 5 characters.");
      return;
    }
    if (trimmed.length > 300) {
      setFormError("Reversal reason must be 300 characters or less.");
      return;
    }
    setFormError("");
    Alert.alert(
      "Reverse Payment?",
      "The payment stays in history and the salary returns to unpaid.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reverse Payment", onPress: submitReverse },
      ]
    );
  }

  async function submitReverse() {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      const next = await reverseSalaryPayment(paymentId, { reason: reason.trim() });
      setData((current) => ({
        ...current,
        payment: next.payment,
        salary: next.salary
          ? { ...current?.salary, paymentStatus: next.salary.paymentStatus }
          : current?.salary,
      }));
      setReason("");
    } catch (reverseError) {
      setFormError(reverseError.message || "Unable to record payment.");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return (
      <AppScreen title="Payment details" subtitle={data?.employee?.name || "Salary payment"} icon="cash">
        <AppText variant="body" color={colors.textSecondary}>
          Loading payment history...
        </AppText>
      </AppScreen>
    );
  }

  if (!data?.payment) {
    return (
      <AppScreen title="Payment details" subtitle={data?.employee?.name || "Salary payment"} icon="cash">
        <ErrorView message={error || "Unable to load payment history."} onRetry={load} />
      </AppScreen>
    );
  }

  const payment = data.payment;
  const paid = payment.status === "paid";

  return (
    <AppScreen title="Payment details" subtitle={data?.employee?.name || "Salary payment"} icon="cash">
      <ScrollView contentContainerStyle={styles.scroll}>
        <SalaryPaymentSummary
          employeeName={data.employee?.name}
          periodLabel={data.salary?.periodLabel}
          amount={payment.amount}
          paymentMethod={payment.paymentMethod}
          paymentDate={payment.paymentDate}
          paymentReference={payment.paymentReference}
          status={payment.status}
          notes={payment.notes}
          reversalReason={payment.reversalReason}
          reversedAt={payment.reversedAt}
        />
        {paid ? (
          <>
            <AppTextInput
              label="Reversal reason"
              value={reason}
              onChangeText={setReason}
              placeholder="Why is this payment being reversed?"
              maxLength={300}
              multiline
            />
            <FieldError message={formError} />
            <AppButton label="Reverse Payment" loading={busy} disabled={busy} onPress={confirmReverse} />
          </>
        ) : null}
        {paid && data.salary?.id ? (
          <AppButton
            label="View Salary Receipt"
            onPress={() => navigation.navigate("SalaryReceipt", { salaryId: data.salary.id })}
          />
        ) : null}
        {data.salary?.id ? (
          <AppButton
            label="View Salary"
            variant="secondary"
            onPress={() => navigation.navigate("SalaryDetail", { salaryId: data.salary.id })}
          />
        ) : null}
        <AppButton label="Done" variant="secondary" onPress={() => navigation.goBack()} disabled={busy} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
});
