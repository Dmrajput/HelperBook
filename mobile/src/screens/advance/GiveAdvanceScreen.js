import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import AdvanceAmountForm from "../../components/advance/AdvanceAmountForm";
import AppScreen from "../../components/AppScreen";
import { colors, spacing } from "../../theme";
import { createAdvance } from "../../services/advanceService";

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
    <AppScreen title="Give advance" subtitle={employeeName || "Record money given"} icon="cash">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color="#7A5AF8" />
          <AppText variant="caption" color={colors.textSecondary} style={styles.noteText}>
            This amount is added to the khata. You can deduct it from salary each month, or leave that blank and record repayments later.
          </AppText>
        </View>
        <View style={styles.card}>
          <AdvanceAmountForm
            employeeName={employeeName}
            submitLabel="Give Advance"
            showMonthly
            loading={loading}
            disabled={loading}
            onSubmit={submit}
          />
        </View>
        <FieldError message={error} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#F3EEFF",
    borderRadius: 16,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
  },
});
