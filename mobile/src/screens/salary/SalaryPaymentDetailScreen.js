import { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import SalaryPaymentSummary from "../../components/salary/SalaryPaymentSummary";
import { getSalaryPaymentById, reverseSalaryPayment } from "../../services/salaryService";
import { colors, spacing } from "../../theme";

export default function SalaryPaymentDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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
    Alert.alert("Reverse Payment?", "The payment stays in history and the salary returns to unpaid.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reverse Payment", onPress: submitReverse },
    ]);
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

  const name = data?.employee?.name || "Salary payment";

  if (loading && !data) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Header title="Payment details" subtitle={name} onBack={() => navigation.goBack()} />
        </View>
        <View style={styles.loadingWrap}>
          <View style={styles.block} accessibilityLabel="Loading payment history" />
        </View>
      </View>
    );
  }

  if (!data?.payment) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Header title="Payment details" subtitle={name} onBack={() => navigation.goBack()} />
        </View>
        <View style={styles.loadingWrap}>
          <ErrorView message={error || "Unable to load payment history."} onRetry={load} />
        </View>
      </View>
    );
  }

  const payment = data.payment;
  const paid = payment.status === "paid";

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Header title="Payment details" subtitle={name} onBack={() => navigation.goBack()} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <View style={styles.reverseCard}>
              <AppText variant="label" style={styles.sectionTitle}>
                Reverse payment
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                The payment stays in history and the salary returns to unpaid.
              </AppText>
              <AppTextInput
                label="Reversal reason"
                value={reason}
                onChangeText={setReason}
                placeholder="Why is this payment being reversed?"
                maxLength={300}
                multiline
              />
              <FieldError message={formError} />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {paid ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reverse payment"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={confirmReverse}
              style={({ pressed }) => [
                styles.footerDanger,
                pressed && !busy && styles.pressed,
                busy && styles.footerDisabled,
              ]}
            >
              <Ionicons name="return-down-back-outline" size={18} color={busy ? colors.disabledText : colors.error} />
              <AppText variant="label" color={busy ? colors.disabledText : colors.error}>
                {busy ? "Reversing..." : "Reverse payment"}
              </AppText>
            </Pressable>
          ) : null}
          {paid && data.salary?.id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View salary receipt"
              onPress={() => navigation.navigate("SalaryReceipt", { salaryId: data.salary.id })}
              style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.textInverse} />
              <AppText variant="label" color={colors.textInverse}>
                View receipt
              </AppText>
            </Pressable>
          ) : null}
          {data.salary?.id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View salary"
              onPress={() => navigation.navigate("SalaryDetail", { salaryId: data.salary.id })}
              style={({ pressed }) => [styles.footerSecondary, pressed && styles.pressed]}
            >
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              <AppText variant="label" color={colors.primary}>
                View salary
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            disabled={busy}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.footerSecondary, pressed && !busy && styles.pressed]}
          >
            <AppText variant="label" color={colors.primary}>
              Done
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Header({ title, subtitle, onBack }) {
  return (
    <View style={styles.headerRow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <View style={styles.headerCopy}>
        <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <View style={styles.headerAction}>
        <Ionicons name="cash-outline" size={20} color={colors.primary} />
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
  loadingWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  reverseCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
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
  footerDanger: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerDisabled: {
    borderColor: colors.disabled,
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
