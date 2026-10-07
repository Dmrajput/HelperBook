import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import EmployeeCard from "../../components/EmployeeCard";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
import { colors, spacing } from "../../theme";
import { getEmployees } from "../../services/employeeService";

export default function EmployeeListScreen() {
  const navigation = useNavigation();
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

  const countLabel = status === "active" ? "Active Employees" : "Inactive Employees";
  const emptyTitle = search
    ? "No employees found"
    : status === "active"
      ? "No employees yet"
      : "No inactive employees";
  const emptyMessage = status === "active" && !search
    ? "Add your first helper to start managing attendance and salary."
    : "";

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <AppText variant="heading" accessibilityRole="header">
          Employees
        </AppText>
        <AppTextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search employees"
          autoCapitalize="words"
        />
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
                <AppText align="center" color={selected ? colors.textInverse : colors.text}>
                  {label}
                </AppText>
                <AppText variant="caption" align="center" color={selected ? colors.textInverse : colors.primary}>
                  {selected ? "Selected" : "Select"}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="body">{countLabel}: {pagination.total}</AppText>
      </View>
      {loading && employees.length === 0 ? (
        <AppText variant="body" color={colors.textSecondary}>
          Loading employees...
        </AppText>
      ) : error && employees.length === 0 ? (
        <ErrorView title="Unable to load employees." message={error} onRetry={() => loadPage(1)} />
      ) : (
        <FlatList
          style={styles.list}
          data={employees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPage(1, { refresh: true })} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText variant="subtitle">{emptyTitle}</AppText>
              {emptyMessage ? (
                <AppText variant="body" color={colors.textSecondary}>
                  {emptyMessage}
                </AppText>
              ) : null}
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <AppText variant="caption" color={colors.textSecondary}>
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
      {error && employees.length > 0 ? <FieldError message={error} /> : null}
      <View style={styles.footer}>
        <AppButton label="+ Add Employee" onPress={() => navigation.navigate("AddEmployee")} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filter: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  list: {
    flex: 1,
    marginTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
  empty: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
});
