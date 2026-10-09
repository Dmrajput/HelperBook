import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AdvanceCard from "../../components/advance/AdvanceCard";
import AdvanceSummaryCard from "../../components/advance/AdvanceSummaryCard";
import AdvanceTransactionItem from "../../components/advance/AdvanceTransactionItem";
import OutstandingBalanceCard from "../../components/advance/OutstandingBalanceCard";
import AppScreen from "../../components/AppScreen";
import useAdvance from "../../hooks/useAdvance";
import { getEmployeeAdvanceTransactions, reverseTransaction } from "../../services/advanceService";
import { colors, spacing } from "../../theme";

const FILTERS = [
  { id: "", label: "All" },
  { id: "advance", label: "Advance" },
  { id: "repayment", label: "Repayment" },
  { id: "salary_deduction", label: "Salary deduction" },
];

export default function EmployeeAdvanceScreen({ navigation, route }) {
  const { employeeId } = route.params;
  const { summary, advances, transactions, employee, loading, error, reload } = useAdvance(employeeId);
  const [filter, setFilter] = useState("");
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [reversing, setReversing] = useState(false);

  function confirmReverse(transaction) {
    if (reversing) {
      return;
    }
    Alert.alert("Reverse this entry?", "The original entry stays in the khata. A reversal cancels its effect.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reverse",
        style: "destructive",
        onPress: async () => {
          setReversing(true);
          setHistoryError("");
          try {
            await reverseTransaction(transaction.id);
            setHistory(null);
            setFilter("");
            await reload();
          } catch (reverseError) {
            setHistoryError(reverseError.message || "This entry could not be reversed. Please try again.");
          } finally {
            setReversing(false);
          }
        },
      },
    ]);
  }

  async function applyFilter(next) {
    setFilter(next);
    setHistoryError("");
    if (!next) {
      setHistory(null);
      return;
    }
    try {
      const data = await getEmployeeAdvanceTransactions(employeeId, { type: next, limit: 20 });
      setHistory(data.transactions);
    } catch (filterError) {
      setHistoryError(filterError.message || "Unable to load advance information. Please try again.");
    }
  }

  const rows = history || transactions;
  const outstanding = summary?.outstanding;

  return (
    <AppScreen title={employee?.name || "Khata"} subtitle="Advance history" icon="book">
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && !summary ? <View style={styles.block} accessibilityLabel="Loading khata" /> : null}
        {error && !summary ? <ErrorView message={error} onRetry={reload} /> : null}
        {summary ? (
          <>
            <OutstandingBalanceCard amount={outstanding} />
            <AdvanceSummaryCard summary={summary} />
            {outstanding === 0 && advances.length > 0 ? (
              <AppText variant="caption" color={colors.textSecondary}>No outstanding advance</AppText>
            ) : null}
            {advances.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="book-outline" size={24} color="#7A5AF8" />
                </View>
                <AppText variant="subtitle" align="center">No advance yet</AppText>
                <AppText variant="body" color={colors.textSecondary} align="center">
                  This employee currently has no outstanding advance.
                </AppText>
              </View>
            ) : null}
            {employee?.status === "inactive" ? (
              <View style={styles.note}>
                <AppText variant="caption" color="#9A5B12">
                  This employee is inactive. New advances cannot be given.
                </AppText>
              </View>
            ) : (
              <AppButton
                label="Give Advance"
                onPress={() => navigation.navigate("GiveAdvance", { employeeId, employeeName: employee?.name })}
              />
            )}
            <AppButton
              label="Record Repayment"
              variant="secondary"
              disabled={!advances.some((advance) => advance.status === "active")}
              onPress={() => navigation.navigate("Repayment", { employeeId, employeeName: employee?.name })}
            />
            {advances.map((advance) => (
              <AdvanceCard key={advance.id} advance={advance} />
            ))}
            <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>Khata history</AppText>
            <View style={styles.filters}>
              {FILTERS.map((item) => (
                <Pressable
                  key={item.id || "all"}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === item.id }}
                  onPress={() => applyFilter(item.id)}
                  style={[styles.filter, filter === item.id && styles.selected]}
                >
                  <AppText variant="caption" color={filter === item.id ? colors.textInverse : colors.text}>
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            {historyError ? (
              <AppText variant="caption" color={colors.error}>
                {historyError}
              </AppText>
            ) : null}
            {rows.length === 0 ? (
              <AppText variant="body" color={colors.textSecondary}>
                No khata entries yet.
              </AppText>
            ) : (
              <View style={styles.history}>
                {rows.map((transaction) => (
                  <AdvanceTransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onReverse={reversing ? undefined : confirmReverse}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { height: 140, borderRadius: 18, backgroundColor: colors.disabled },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    backgroundColor: "#FFF4E8",
    borderRadius: 14,
    padding: spacing.md,
  },
  sectionTitle: {
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  history: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filter: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
