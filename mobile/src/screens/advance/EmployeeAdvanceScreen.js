import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AdvanceCard from "../../components/advance/AdvanceCard";
import AdvanceSummaryCard from "../../components/advance/AdvanceSummaryCard";
import AdvanceTransactionItem from "../../components/advance/AdvanceTransactionItem";
import OutstandingBalanceCard from "../../components/advance/OutstandingBalanceCard";
import useAdvance from "../../hooks/useAdvance";
import { getEmployeeAdvanceTransactions, reverseTransaction } from "../../services/advanceService";
import { colors, spacing } from "../../theme";

const FILTERS = [
  { id: "", label: "All" },
  { id: "advance", label: "Advance" },
  { id: "repayment", label: "Repayment" },
  { id: "salary_deduction", label: "Deduction" },
];

export default function EmployeeAdvanceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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
  const canRepay = advances.some((advance) => advance.status === "active");
  const inactive = employee?.status === "inactive";
  const name = employee?.name || "Khata";

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
            <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
              {name}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Advance / Khata
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="book-outline" size={20} color={colors.secondary} />
          </View>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loading && !summary ? (
            <View style={styles.skeleton} accessibilityLabel="Loading khata">
              <View style={styles.block} />
              <View style={styles.block} />
            </View>
          ) : null}
          {error && !summary ? <ErrorView message={error} onRetry={reload} /> : null}

          {summary ? (
            <>
              <OutstandingBalanceCard amount={outstanding} label="Outstanding balance" />
              <AdvanceSummaryCard summary={summary} />

              {inactive ? (
                <View style={styles.note}>
                  <Ionicons name="alert-circle-outline" size={16} color="#9A5B12" />
                  <AppText variant="caption" color="#9A5B12" style={styles.noteText}>
                    This employee is inactive. New advances cannot be given.
                  </AppText>
                </View>
              ) : null}

              {outstanding === 0 && advances.length > 0 ? (
                <View style={styles.clearBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <AppText variant="caption" color={colors.success}>
                    No outstanding advance
                  </AppText>
                </View>
              ) : null}

              {advances.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="book-outline" size={24} color={colors.secondary} />
                  </View>
                  <AppText variant="subtitle" align="center">
                    No advance yet
                  </AppText>
                  <AppText variant="body" color={colors.textSecondary} align="center">
                    This employee currently has no outstanding advance.
                  </AppText>
                </View>
              ) : (
                <>
                  <View style={styles.sectionHeader}>
                    <AppText variant="label" style={styles.sectionTitle}>
                      Advances
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {`${advances.length}`}
                    </AppText>
                  </View>
                  {advances.map((advance) => (
                    <AdvanceCard key={advance.id} advance={advance} />
                  ))}
                </>
              )}

              <View style={styles.sectionHeader}>
                <AppText variant="label" style={styles.sectionTitle}>
                  Khata history
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {`${rows.length} entries`}
                </AppText>
              </View>

              <View style={styles.tabTrack}>
                {FILTERS.map((item) => {
                  const selected = filter === item.id;
                  return (
                    <Pressable
                      key={item.id || "all"}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => applyFilter(item.id)}
                      style={[styles.tab, selected && styles.tabSelected]}
                    >
                      <AppText
                        variant="caption"
                        color={selected ? colors.primary : colors.textSecondary}
                        style={styles.tabLabel}
                        numberOfLines={1}
                      >
                        {item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {historyError ? (
                <AppText variant="caption" color={colors.error}>
                  {historyError}
                </AppText>
              ) : null}

              {rows.length === 0 ? (
                <View style={styles.empty}>
                  <AppText variant="body" color={colors.textSecondary} align="center">
                    No khata entries yet.
                  </AppText>
                </View>
              ) : (
                <View style={styles.history}>
                  {rows.map((transaction, index) => (
                    <View key={transaction.id}>
                      {index > 0 ? <View style={styles.historyDivider} /> : null}
                      <AdvanceTransactionItem
                        transaction={transaction}
                        onReverse={reversing ? undefined : confirmReverse}
                      />
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>

        {summary && !inactive ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Record repayment"
              accessibilityState={{ disabled: !canRepay }}
              disabled={!canRepay}
              onPress={() => navigation.navigate("Repayment", { employeeId, employeeName: employee?.name })}
              style={({ pressed }) => [
                styles.footerSecondary,
                pressed && canRepay && styles.pressed,
                !canRepay && styles.footerMuted,
              ]}
            >
              <Ionicons name="return-down-back-outline" size={18} color={canRepay ? colors.primary : colors.disabledText} />
              <AppText variant="label" color={canRepay ? colors.primary : colors.disabledText}>
                Record repayment
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Give advance"
              onPress={() => navigation.navigate("GiveAdvance", { employeeId, employeeName: employee?.name })}
              style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={18} color={colors.textInverse} />
              <AppText variant="label" color={colors.textInverse}>
                Give advance
              </AppText>
            </Pressable>
          </View>
        ) : null}
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
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.warningBackground,
    borderRadius: 14,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
  },
  clearBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successBackground,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  empty: {
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  tabTrack: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  tabSelected: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tabLabel: {
    fontWeight: "700",
    fontSize: 11,
  },
  history: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  historyDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
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
  footerMuted: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.9,
  },
});
