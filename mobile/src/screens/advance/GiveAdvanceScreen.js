import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import AdvanceAmountForm from "../../components/advance/AdvanceAmountForm";
import { colors, spacing } from "../../theme";
import { createAdvance } from "../../services/advanceService";

export default function GiveAdvanceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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
              Give advance
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {employeeName || "Record money given"}
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="cash-outline" size={20} color={colors.secondary} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.secondary} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.noteText}>
              This amount is added to the khata. You can deduct it from salary each month, or leave that blank and
              record repayments later.
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
      </KeyboardAvoidingView>
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
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.secondaryLight,
    borderRadius: 16,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
