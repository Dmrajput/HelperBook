import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import AdvanceAmountForm from "../../components/advance/AdvanceAmountForm";
import ScreenContainer from "../../components/ScreenContainer";
import { createAdvance } from "../../services/advanceService";
import { spacing } from "../../theme";

export default function GiveAdvanceScreen({ navigation, route }) {
  const { employeeId, employeeName } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(values) {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await createAdvance({
        employeeId,
        amount: values.amount,
        date: values.date,
        notes: values.notes,
        requestId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...(values.monthlyAmount > 0
          ? { repaymentSettings: { method: "salary_deduction", monthlyAmount: values.monthlyAmount } }
          : {}),
      });
      navigation.goBack();
    } catch (submitError) {
      setError(submitError.message || "Unable to record the advance. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="heading">Give Advance</AppText>
        <AdvanceAmountForm
          employeeName={employeeName}
          submitLabel="Give Advance"
          showMonthly
          loading={loading}
          disabled={loading}
          onSubmit={submit}
        />
        <FieldError message={error} />
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} disabled={loading} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
});
