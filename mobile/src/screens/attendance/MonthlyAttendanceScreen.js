import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AttendanceCalendar from "../../components/attendance/AttendanceCalendar";
import AttendanceSummary from "../../components/attendance/AttendanceSummary";
import { useMainTab } from "../../navigation/mainTabContext";
import { colors, spacing } from "../../theme";
import { getEmployees } from "../../services/employeeService";
import { getMonthlyAttendance } from "../../services/attendanceService";
import { currentYearMonth, formatMonth, todayKey } from "../../utils/attendanceFormat";

function ViewTabs({ navigation, openDaily }) {
  const tabs = [
    { id: "daily", label: "Daily", icon: "sunny", onPress: openDaily },
    { id: "bulk", label: "Bulk", icon: "people-outline", onPress: () => navigation.navigate("BulkAttendance") },
    { id: "monthly", label: "Monthly", icon: "calendar-outline", active: true },
    {
      id: "history",
      label: "History",
      icon: "time-outline",
      onPress: () => navigation.navigate("AttendanceHistory"),
    },
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
      <AppText variant="caption" color={selected ? colors.primary : colors.textSecondary} style={styles.chipText} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function MonthlyAttendanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setTab } = useMainTab();
  const initial = currentYearMonth();

  function openDaily() {
    setTab("Attendance");
    navigation.navigate("Home");
  }
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = todayKey();
  const current = currentYearMonth(today);
  const nextDisabled = year > current.year || (year === current.year && month >= current.month);
  const isCurrentMonth = year === current.year && month === current.month;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [monthData, active, inactive] = await Promise.all([
        getMonthlyAttendance(year, month, employeeId),
        getEmployees({ status: "active", limit: 50 }),
        getEmployees({ status: "inactive", limit: 50 }),
      ]);
      setData(monthData);
      setEmployees([...(active.employees || []), ...(inactive.employees || [])]);
    } catch (loadError) {
      setData(null);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [year, month, employeeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function shiftMonth(step) {
    const next = new Date(Date.UTC(year, month - 1 + step, 1));
    const nextYear = next.getUTCFullYear();
    const nextMonth = next.getUTCMonth() + 1;
    if (step > 0 && (nextYear > current.year || (nextYear === current.year && nextMonth > current.month))) {
      return;
    }
    setYear(nextYear);
    setMonth(nextMonth);
  }

  const selectedName = employees.find((employee) => employee.id === employeeId)?.name || "All employees";

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
              Monthly
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {selectedName}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to current month"
            onPress={() => {
              setYear(current.year);
              setMonth(current.month);
            }}
            style={styles.headerAction}
          >
            <Ionicons name="today-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ViewTabs navigation={navigation} openDaily={openDaily} />

        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => shiftMonth(-1)}
            style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <View style={styles.monthCenter}>
            <AppText variant="label" style={styles.monthLabel}>
              {formatMonth(year, month)}
            </AppText>
            {isCurrentMonth ? (
              <View style={styles.todayChip}>
                <AppText variant="caption" color={colors.primary} style={styles.todayText}>
                  This month
                </AppText>
              </View>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            disabled={nextDisabled}
            onPress={() => shiftMonth(1)}
            style={({ pressed }) => [
              styles.monthButton,
              nextDisabled && styles.monthDisabled,
              pressed && !nextDisabled && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={nextDisabled ? colors.disabledText : colors.text} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="label" style={styles.sectionTitle}>
            Employee
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {selectedName}
          </AppText>
        </View>
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

        {loading ? (
          <View style={styles.skeleton} accessibilityLabel="Loading attendance">
            <View style={styles.block} />
            <View style={[styles.block, styles.calendarBlock]} />
          </View>
        ) : null}
        {error ? (
          <ErrorView
            title="Unable to load attendance."
            message={error.isNetworkError ? "Please check your internet connection and try again." : error.message}
            onRetry={load}
          />
        ) : null}

        {data ? (
          <>
            <AttendanceSummary summary={{ ...data.summary, total: undefined }} />
            {data.employee ? (
              <View style={styles.employeeBanner}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.employeeBannerText}>
                  {`${data.employee.name} — ${formatMonth(year, month)}`}
                </AppText>
              </View>
            ) : null}
            <AttendanceCalendar
              year={year}
              month={month}
              days={data.days}
              today={today}
              onSelectDate={(date) => navigation.navigate("AttendanceDay", { date })}
            />
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
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  monthDisabled: {
    opacity: 0.4,
  },
  monthCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  monthLabel: {
    fontWeight: "700",
  },
  todayChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayText: {
    fontWeight: "700",
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
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
    backgroundColor: colors.surface,
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
  employeeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  employeeBannerText: {
    flex: 1,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  calendarBlock: {
    height: 280,
  },
  pressed: {
    opacity: 0.9,
  },
});
