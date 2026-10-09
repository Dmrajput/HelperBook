import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import EmployeeCard from "../../components/EmployeeCard";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import { colors, spacing } from "../../theme";
import useSubscription from "../../hooks/useSubscription";
import { getEmployees } from "../../services/employeeService";
import { showEmployeeLimitAlert } from "../../utils/employeeLimit";

const PAGE_BG = "#F4F7F5";
const HEADER = "#0F6B4F";

function EmployeeListSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading employees">
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

export default function EmployeeListScreen({ embedded = false }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { subscription, canAddEmployee } = useSubscription();
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

  const countLabel = status === "active" ? "active staff" : "inactive staff";
  const subtitle = loading && employees.length === 0
    ? "Your team"
    : `${pagination.total} ${countLabel}`;
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
              <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
            </Pressable>
          )}
          <View style={styles.headerCopy}>
            <AppText variant="heading" color={colors.textInverse} accessibilityRole="header" style={styles.title}>
              Employees
            </AppText>
            <AppText variant="caption" color="#E7F6EF">
              {subtitle}
            </AppText>
          </View>
          <View style={styles.mark} accessibilityElementsHidden>
            <Ionicons name="people" size={26} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.toolbar}>
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
        <View style={styles.filters}>
          {["active", "inactive"].map((item) => {
            const selected = status === item;
            const label = item === "active" ? "Active" : "Inactive";
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                onPress={() => setStatus(item)}
                style={[styles.filter, selected && styles.filterSelected]}
              >
                <AppText variant="label" align="center" color={selected ? colors.textInverse : colors.text}>
                  {label}
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
            loadingMore ? (
              <AppText variant="caption" color={colors.textSecondary} align="center">
                Loading employees...
              </AppText>
            ) : null
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
      <View style={styles.footer}>
        {canAddEmployee === false ? (
          <View style={styles.limitNote}>
            <AppText variant="caption" color="#9A5B12">
              {`${subscription?.plan?.name || "Your plan"} allows ${subscription?.plan?.employeeLimit} active employees. Upgrade to add more.`}
            </AppText>
          </View>
        ) : null}
        <AppButton label="Add Employee" onPress={openAddEmployee} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    backgroundColor: HEADER,
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
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
    fontSize: 26,
    lineHeight: 32,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F7F3EA",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    marginTop: -22,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    zIndex: 1,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: colors.text,
    fontSize: 16,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSelected: {
    backgroundColor: HEADER,
  },
  list: {
    flex: 1,
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
  skeleton: {
    flex: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  skeletonRow: {
    height: 72,
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
    padding: spacing.xl,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  limitNote: {
    backgroundColor: "#FFF4E8",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
