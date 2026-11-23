import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import RepaymentForm from "../../components/advance/RepaymentForm";
import { getEmployeeAdvances, recordRepayment } from "../../services/advanceService";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

export default function RepaymentScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { employeeId, employeeName } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getEmployeeAdvances(employeeId, { status: "active", limit: 50 }));
    } catch (loadError) {
      setError(loadError.message || "Unable to load advance information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function submit(values) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await recordRepayment({
        employeeId,
        ...values,
        requestId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      });
      navigation.goBack();
    } catch (submitError) {
      setError(submitError.message || "Repayment could not be recorded. Please try again.");
    } finally {
      setSaving(false);
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
              Record repayment
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {employeeName || "Money paid back"}
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="return-down-back-outline" size={20} color={colors.secondary} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading && !data ? (
            <View style={styles.skeleton} accessibilityLabel="Loading repayment">
              <View style={styles.block} />
            </View>
          ) : null}
          {error && !data ? <ErrorView message={error} onRetry={load} /> : null}

          {data ? (
            <>
              <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="book-outline" size={18} color={colors.secondary} />
                </View>
                <View style={styles.summaryCopy}>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Outstanding balance
                  </AppText>
                  <AppText style={styles.summaryAmount}>{formatInr(data.summary.outstanding)}</AppText>
                </View>
              </View>
              <View style={styles.card}>
                <RepaymentForm
                  advances={data.advances}
                  outstanding={data.summary.outstanding}
                  loading={saving}
                  onSubmit={submit}
                />
              </View>
            </>
          ) : null}
          <FieldError message={data ? error : ""} />
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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  summaryAmount: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
});
