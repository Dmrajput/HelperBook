import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AttendanceDateSelector from "../../components/attendance/AttendanceDateSelector";
import AttendanceHistoryItem from "../../components/attendance/AttendanceHistoryItem";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import AttendanceStatusSelector from "../../components/attendance/AttendanceStatusSelector";
import { useMainTab } from "../../navigation/mainTabContext";
import { colors, spacing } from "../../theme";
import { getAttendanceHistory } from "../../services/attendanceService";
import { getEmployees } from "../../services/employeeService";
import { monthStartKey, todayKey } from "../../utils/attendanceFormat";

function ViewTabs({ navigation, openDaily }) {
  const tabs = [
    { id: "daily", label: "Daily", icon: "sunny", onPress: openDaily },
    { id: "bulk", label: "Bulk", icon: "people-outline", onPress: () => navigation.navigate("BulkAttendance") },
    { id: "monthly", label: "Monthly", icon: "calendar-outline", onPress: () => navigation.navigate("MonthlyAttendance") },
    { id: "history", label: "History", icon: "time-outline", active: true },
  ];

  return (
    <View style={styles.tabTrack}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: Boolean(tab.active) }}
          disabled={Boolean(tab.active)}
          onPress={tab.onPress}
          style={({ pressed }) => [styles.tab, tab.active && styles.tabActive, pressed && !tab.active && styles.pressed]}
        >
          <Ionicons name={tab.icon} size={15} color={tab.active ? colors.primary : colors.textSecondary} />
          <AppText
            variant="caption"
            color={tab.active ? colors.primary : colors.textSecondary}
            style={styles.tabLabel}
            numberOfLines={1}
          >
            {tab.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function FilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <AppText
        variant="caption"
        color={selected ? colors.primary : colors.textSecondary}
        style={styles.chipText}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default function AttendanceHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setTab } = useMainTab();
  const [startDate, setStartDate] = useState(monthStartKey());

  function openDaily() {
    setTab("Attendance");
    navigation.navigate("Home");
  }
  const [endDate, setEndDate] = useState(todayKey());
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [days, setDays] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (nextPage = 1) => {
      if (startDate > endDate) {
        setLoading(false);
        setDays([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [history, active] = await Promise.all([
          getAttendanceHistory({
            page: nextPage,
            limit: 20,
            startDate,
            endDate,
            status: status || undefined,
            employeeId: employeeId || undefined,
          }),
          getEmployees({ status: "active", limit: 50 }),
        ]);
        setEmployees(active.employees || []);
        setDays((current) => (nextPage === 1 ? history.days : [...current, ...history.days]));
        setPage(history.pagination.page);
        setTotalPages(history.pagination.totalPages);
      } catch (loadError) {
        if (nextPage === 1) {
          setDays([]);
        }
        setError(loadError);
      } finally {
        setLoading(false);
      }
    },
    [status, employeeId, startDate, endDate]
  );

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  function resetFilters() {
    setStartDate(monthStartKey());
    setEndDate(todayKey());
    setStatus("");
    setEmployeeId("");
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
              History
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Past attendance by day
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset filters"
            onPress={resetFilters}
            style={styles.headerAction}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ViewTabs navigation={navigation} openDaily={openDaily} />

        <View style={styles.filterCard}>
          <AppText variant="label" style={styles.sectionTitle}>
            Date range
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            From
          </AppText>
          <AttendanceDateSelector date={startDate} onChange={setStartDate} />
          <AppText variant="caption" color={colors.textSecondary}>
            To
          </AppText>
          <AttendanceDateSelector date={endDate} onChange={setEndDate} />
          {startDate > endDate ? (
            <AppText variant="caption" color={colors.error}>
              The start date must be on or before the end date.
            </AppText>
          ) : null}

          <AppText variant="label" style={styles.sectionTitle}>
            Status
          </AppText>
          <AttendanceStatusSelector value={status || null} onChange={(next) => setStatus(next === status ? "" : next)} />

          <AppText variant="label" style={styles.sectionTitle}>
            Employee
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <FilterChip label="All" selected={!employeeId} onPress={() => setEmployeeId("")} />
            {employees.map((employee) => (
              <FilterChip
                key={employee.id}
                label={employee.name}
                selected={employeeId === employee.id}
                onPress={() => setEmployeeId(employee.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="label" style={styles.sectionTitle}>
            Days
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {`${days.length} shown`}
          </AppText>
        </View>

        {loading && page === 1 ? (
          <View style={styles.skeleton} accessibilityLabel="Loading attendance">
            <View style={styles.block} />
            <View style={styles.block} />
          </View>
        ) : null}
        {error && days.length === 0 ? (
          <ErrorView
            title="Unable to load attendance."
            message={error.isNetworkError ? "Please check your internet connection and try again." : error.message}
            onRetry={() => load(1)}
          />
        ) : null}
        {!loading && !error && days.length === 0 ? (
          <AttendanceEmptyState
            title="No attendance records yet."
            message="Start marking attendance to see history here."
          />
        ) : null}

        {days.map((day) => (
          <AttendanceHistoryItem
            key={day.date}
            day={day}
            onPress={() => navigation.navigate("AttendanceDay", { date: day.date })}
          />
        ))}

        {page < totalPages ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Load more"
            onPress={() => load(page + 1)}
            style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}
          >
            <AppText variant="label" color={colors.primary}>
              Load more
            </AppText>
          </Pressable>
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
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
    minHeight: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tabLabel: {
    fontWeight: "700",
    fontSize: 12,
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
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
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontWeight: "700",
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 88,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  loadMore: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
  },
});
