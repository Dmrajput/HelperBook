import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import SalaryCard from "../../components/salary/SalaryCard";
import { methodLabel } from "../../constants/salaryPayment";
import { getEmployeeSalaryHistory } from "../../services/salaryService";
import { colors, spacing } from "../../theme";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SalaryHistoryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { employeeId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (isRefresh = false) => {
      setError("");
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        setData(await getEmployeeSalaryHistory(employeeId, { limit: 20 }));
      } catch (loadError) {
        setError(loadError.message || "Unable to load salary history. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [employeeId]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const name = data?.employee?.name || "Past salary records";
  const salaries = data?.salaries || [];

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
              Salary history
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {name}
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !data ? (
          <View style={styles.skeleton} accessibilityLabel="Loading salary history">
            <View style={styles.block} />
            <View style={styles.block} />
          </View>
        ) : null}
        {error && !data ? <ErrorView message={error} onRetry={() => load(false)} /> : null}

        {data ? (
          <View style={styles.sectionHeader}>
            <AppText variant="label" style={styles.sectionTitle}>
              Records
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {`${salaries.length} shown`}
            </AppText>
          </View>
        ) : null}

        {data && salaries.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            </View>
            <AppText variant="subtitle" align="center">
              No salary records yet
            </AppText>
            <AppText variant="body" color={colors.textSecondary} align="center">
              Calculated salaries for this employee will appear here.
            </AppText>
          </View>
        ) : null}

        {salaries.map((salary) => {
          const reversed = salary.paymentStatus !== "paid" && salary.payment?.status === "reversed";
          const paymentStatus =
            salary.status === "finalized" ? (reversed ? "reversed" : salary.paymentStatus || "unpaid") : "";
          const detail =
            salary.paymentStatus === "paid" && salary.payment
              ? methodLabel(salary.payment.paymentMethod)
              : reversed
                ? "Payment reversed"
                : "";
          return (
            <SalaryCard
              key={salary.id}
              name={`${MONTHS[salary.month - 1]} ${salary.year}`}
              role={detail || "Salary period"}
              amount={salary.calculation.netSalary}
              status={salary.status}
              paymentStatus={paymentStatus}
              actionLabel={salary.paymentStatus === "paid" ? "View receipt" : "View"}
              onPress={() =>
                navigation.navigate(salary.paymentStatus === "paid" ? "SalaryReceipt" : "SalaryDetail", {
                  salaryId: salary.id,
                })
              }
            />
          );
        })}
      </ScrollView>
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
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
});
