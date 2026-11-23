import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import { getEmployeeAdvances, getEmployeeAdvanceTransactions } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

const TYPE_META = {
  advance: { label: "Advance given", icon: "arrow-up-circle-outline", color: colors.secondary },
  repayment: { label: "Repayment", icon: "arrow-down-circle-outline", color: colors.success },
  salary_deduction: { label: "Salary deduction", icon: "wallet-outline", color: colors.warning },
  adjustment: { label: "Adjustment", icon: "swap-horizontal-outline", color: colors.info },
  reversal: { label: "Reversal", icon: "refresh-outline", color: colors.error },
};

export default function EmployeeAdvanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSummary, nextTransactions] = await Promise.all([getEmployeeAdvances(), getEmployeeAdvanceTransactions()]);
      setSummary(nextSummary);
      setTransactions(nextTransactions.transactions || []);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load advance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
              Advance / Khata
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Your outstanding balance
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="book-outline" size={20} color={colors.secondary} />
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {error ? <ErrorView message={error} onRetry={load} /> : null}

        <View style={styles.balanceCard}>
          <AppText variant="caption" color={colors.textSecondary}>
            Outstanding
          </AppText>
          <AppText variant="heading" style={styles.balance}>
            {formatInr(summary?.outstanding || 0)}
          </AppText>
          <View style={styles.summaryGrid}>
            <MiniStat label="Given" value={formatInr(summary?.totalAdvances || 0)} />
            <MiniStat label="Repaid" value={formatInr(summary?.repayments || 0)} />
            <MiniStat label="Deducted" value={formatInr(summary?.salaryDeductions || 0)} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="label" style={styles.sectionTitle}>
            Transactions
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {transactions.length ? `${transactions.length} shown` : "None yet"}
          </AppText>
        </View>

        {!loading && !transactions.length && !error ? (
          <View style={styles.empty}>
            <AppText variant="label" style={styles.emptyTitle}>
              No advance records found
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              Advances and repayments will appear here.
            </AppText>
          </View>
        ) : null}

        {transactions.map((item) => {
          const meta = TYPE_META[item.type] || {
            label: item.type,
            icon: "ellipse-outline",
            color: colors.textSecondary,
          };
          const positive = item.signedAmount > 0;
          return (
            <View key={item.id} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.secondaryLight }]}>
                <Ionicons name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={styles.rowCopy}>
                <AppText variant="label" style={styles.rowTitle} numberOfLines={1}>
                  {meta.label}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {formatAttendanceDate(item.date)}
                </AppText>
              </View>
              <AppText variant="label" color={positive ? colors.error : colors.success} style={styles.amount}>
                {`${positive ? "+" : ""}${formatInr(item.signedAmount)}`}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MiniStat({ label, value }) {
  return (
    <View style={styles.miniStat}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="label" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  balanceCard: {
    backgroundColor: colors.successBackground,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
  },
  balance: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  miniStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    gap: 2,
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
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  emptyTitle: {
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontWeight: "700",
  },
  amount: {
    fontWeight: "700",
  },
});
