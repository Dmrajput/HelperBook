import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import EmployeeCard from "../../components/EmployeeCard";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import { colors, spacing } from "../../theme";
import useSubscription from "../../hooks/useSubscription";
import { getEmployees } from "../../services/employeeService";
import { showEmployeeLimitAlert } from "../../utils/employeeLimit";

function EmployeeListSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading employees">
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

function PlanUsageCard({ subscription, onUpgrade }) {
  if (!subscription?.plan) return null;
  const used = Number(subscription.activeEmployeeCount) || 0;
  const limit = Number(subscription.plan.employeeLimit) || 0;
  const full = limit > 0 && used >= limit;
  const progress = limit > 0 ? Math.min(1, used / limit) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subscription.plan.name} plan usage`}
      onPress={onUpgrade}
      style={({ pressed }) => [styles.planCard, pressed && styles.pressed]}
    >
      <View style={styles.planTop}>
        <View style={styles.planTitleRow}>
          <View style={styles.planIcon}>
            <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
          </View>
          <AppText variant="label" style={styles.planName}>
            {`${subscription.plan.name} plan`}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={styles.planCount}>
          {`${used} / ${limit} used`}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <AppText variant="label" style={styles.planMessage}>
        {full ? "Active employee limit reached" : `${Math.max(limit - used, 0)} slot${limit - used === 1 ? "" : "s"} remaining`}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {full ? "Upgrade to add more employees" : "Upgrade anytime for more employee slots"}
      </AppText>
    </Pressable>
  );
}

export default function EmployeeListScreen({ embedded = false }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { subscription, canAddEmployee } = useSubscription({ includePlans: false });
  const [status, setStatus] = useState("active");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadPage = useCallback(async (page, { append, refresh } = {}) => {
    const id = ++requestId.current;
    if (refresh) {
      setRefreshing(true);
    } else if (append) {
      setLoadingMore(true);
    } else {
      setEmployees([]);
      setLoading(true);
    }
    setError("");

    try {
      const data = await getEmployees({ status, search, page, limit: 20 });
      if (id !== requestId.current) {
        return;
      }
      setEmployees((current) => (append ? [...current, ...data.employees] : data.employees));
      setPagination(data.pagination);
    } catch (loadError) {
      if (id !== requestId.current) {
        return;
      }
      if (!append) {
        setEmployees([]);
      }
      setError(loadError.message);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      loadPage(1);
    }, [loadPage])
  );

  function loadMore() {
    if (loading || loadingMore || refreshing || pagination.page >= pagination.totalPages) {
      return;
    }
    loadPage(pagination.page + 1, { append: true });
  }

  function openUpgrade() {
    navigation.navigate("Subscription");
  }

  function openAddEmployee() {
    if (canAddEmployee === false) {
      showEmployeeLimitAlert(navigation, {
        message: "Upgrade your plan to add more employees.",
        details: {
          planName: subscription?.plan?.name,
          limit: subscription?.plan?.employeeLimit,
        },
      });
      return;
    }
    navigation.navigate("AddEmployee");
  }

  const emptyTitle = search
    ? "No employees found"
    : status === "active"
      ? "No employees yet"
      : "No inactive employees";
  const emptyMessage = status === "active" && !search
    ? "Add your first helper to start managing attendance and salary."
    : search
      ? "Try a different name."
      : "Inactive staff will appear here.";

  const planFull = canAddEmployee === false;
  const activeCountLabel = pagination.total === 1 ? "1 employee" : `${pagination.total} employees`;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          {embedded ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => navigation.goBack()}
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          )}
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Employees
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Manage your team
            </AppText>
          </View>
          <View style={styles.mark} accessibilityElementsHidden>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.placeholder} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search employees"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Search employees"
              style={styles.searchInput}
            />
            {searchInput ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchInput("")}>
                <Ionicons name="close-circle" size={18} color={colors.placeholder} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter employees"
            onPress={() => setStatus((current) => (current === "active" ? "inactive" : "active"))}
            style={styles.filterButton}
          >
            <Ionicons name="funnel-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.tabTrack}>
          {[
            { id: "active", label: status === "active" && !loading ? `Active (${pagination.total})` : "Active" },
            { id: "inactive", label: status === "inactive" && !loading ? `Inactive (${pagination.total})` : "Inactive" },
          ].map((tab) => {
            const selected = status === tab.id;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={tab.label}
                onPress={() => setStatus(tab.id)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <AppText
                  variant="label"
                  align="center"
                  color={selected ? colors.primary : colors.textSecondary}
                  style={styles.tabLabel}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading && employees.length === 0 ? (
        <EmployeeListSkeleton />
      ) : error && employees.length === 0 ? (
        <View style={styles.errorWrap}>
          <ErrorView title="Unable to load employees." message={error} onRetry={() => loadPage(1)} />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={employees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPage(1, { refresh: true })}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            employees.length > 0 ? (
              <View style={styles.sectionHeader}>
                <AppText variant="label" style={styles.sectionTitle}>
                  Your team
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {activeCountLabel}
                </AppText>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={28} color={colors.primary} />
              </View>
              <AppText variant="subtitle" align="center">{emptyTitle}</AppText>
              {emptyMessage ? (
                <AppText variant="body" color={colors.textSecondary} align="center">
                  {emptyMessage}
                </AppText>
              ) : null}
            </View>
          }
          ListFooterComponent={
            <View style={styles.listFooter}>
              {loadingMore ? (
                <AppText variant="caption" color={colors.textSecondary} align="center">
                  Loading employees...
                </AppText>
              ) : null}
              {status === "active" ? (
                <PlanUsageCard subscription={subscription} onUpgrade={openUpgrade} />
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              onPress={() => navigation.navigate("EmployeeProfile", { employeeId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {error && employees.length > 0 ? (
        <View style={styles.errorWrap}>
          <FieldError message={error} />
        </View>
      ) : null}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {planFull ? (
          <>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              {`Your ${subscription?.plan?.name || "current"} plan is full`}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upgrade to add employees"
              onPress={openUpgrade}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.textInverse} />
              <AppText variant="button" color={colors.textInverse}>
                Upgrade to add employees
              </AppText>
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add employee"
            onPress={openAddEmployee}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.textInverse} />
            <AppText variant="button" color={colors.textInverse}>
              Add employee
            </AppText>
          </Pressable>
        )}
      </View>
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
    gap: spacing.md,
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
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: colors.text,
    fontSize: 15,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
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
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  separator: {
    height: spacing.sm,
  },
  skeleton: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  skeletonRow: {
    height: 104,
    borderRadius: 18,
    backgroundColor: colors.disabled,
  },
  errorWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  listFooter: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  planIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  planName: {
    fontWeight: "700",
  },
  planCount: {
    fontWeight: "600",
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#EEF2F7",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  planMessage: {
    fontWeight: "700",
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.9,
  },
});
