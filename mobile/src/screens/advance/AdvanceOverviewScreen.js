import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import OutstandingBalanceCard from "../../components/advance/OutstandingBalanceCard";
import AdvanceSummaryCard from "../../components/advance/AdvanceSummaryCard";
import { getAdvances } from "../../services/advanceService";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

const FILTERS = [
  { id: "active", label: "Outstanding" },
  { id: "all", label: "All" },
  { id: "closed", label: "Closed" },
];

export default function AdvanceOverviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    setError("");
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setData(await getAdvances({ status, search: search.trim(), limit: 100 }));
    } catch (loadError) {
      setError(loadError.message || "Unable to load advance information. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      load(false);
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
              Track employee advances
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search and filters"
            onPress={() => {
              setSearch("");
              setStatus("active");
            }}
            style={styles.headerAction}
          >
            <Ionicons name="options-outline" size={20} color={colors.secondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading && !data ? (
          <View style={styles.skeleton} accessibilityLabel="Loading advances">
            <View style={styles.block} />
            <View style={styles.block} />
          </View>
        ) : null}
        {error && !data ? <ErrorView message={error} onRetry={() => load(false)} /> : null}

        {data ? (
          <>
            <OutstandingBalanceCard
              amount={data.summary.outstanding}
              label="Total outstanding"
              staffCount={data.employees?.length}
            />
            <AdvanceSummaryCard summary={data.summary} />

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.placeholder} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search employee"
                placeholderTextColor={colors.placeholder}
                style={styles.searchInput}
                accessibilityLabel="Search employee"
              />
              {search ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color={colors.placeholder} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.tabTrack}>
              {FILTERS.map((filter) => {
                const selected = status === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setStatus(filter.id)}
                    style={[styles.tab, selected && styles.tabSelected]}
                  >
                    <AppText
                      variant="caption"
                      color={selected ? colors.primary : colors.textSecondary}
                      style={styles.tabLabel}
                      numberOfLines={1}
                    >
                      {filter.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <AppText variant="label" style={styles.sectionTitle}>
                Employees
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {`${data.employees.length} shown`}
              </AppText>
            </View>

            {data.employees.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="book-outline" size={24} color={colors.secondary} />
                </View>
                <AppText variant="subtitle" align="center">
                  {status === "active" ? "No outstanding advance" : "No advance records yet"}
                </AppText>
                <AppText variant="body" color={colors.textSecondary} align="center">
                  {status === "active"
                    ? "Staff with open khata will appear here."
                    : "Give an advance from an employee profile to get started."}
                </AppText>
              </View>
            ) : null}

            {data.employees.map((item) => {
              const name = item.employee.name;
              const initial = String(name || "E").trim().charAt(0).toUpperCase();
              const outstanding = item.outstanding > 0;
              return (
                <Pressable
                  key={item.employee.id}
                  accessibilityRole="button"
                  accessibilityLabel={`View khata for ${name}`}
                  onPress={() => navigation.navigate("EmployeeAdvance", { employeeId: item.employee.id })}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <AppText variant="label" color={colors.secondary} style={styles.avatarLetter}>
                        {initial}
                      </AppText>
                    </View>
                    <View style={styles.cardCopy}>
                      <AppText variant="label" style={styles.cardName} numberOfLines={1}>
                        {name}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                        {outstanding ? "Advance outstanding" : "No outstanding"}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: outstanding ? colors.errorBackground : colors.successBackground },
                      ]}
                    >
                      <View
                        style={[styles.dot, { backgroundColor: outstanding ? colors.error : colors.success }]}
                      />
                      <AppText
                        variant="caption"
                        color={outstanding ? colors.error : colors.success}
                        style={styles.badgeText}
                      >
                        {outstanding ? "Open" : "Clear"}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.cardBottom}>
                    <View style={styles.amountBlock}>
                      <AppText variant="caption" color={colors.textSecondary}>
                        Outstanding
                      </AppText>
                      <AppText variant="label" style={styles.amount}>
                        {formatInr(item.outstanding)}
                      </AppText>
                    </View>
                    <View style={styles.actionChip}>
                      <AppText variant="caption" color={colors.secondary} style={styles.actionText}>
                        View khata
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : null}
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
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  searchBox: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.sm,
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
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "800",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardName: {
    fontWeight: "700",
    fontSize: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 11,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  amountBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  amount: {
    fontWeight: "800",
    fontSize: 16,
  },
  actionChip: {
    borderRadius: 999,
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontWeight: "700",
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
});
