import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import AttendanceCalendar from "../../components/attendance/AttendanceCalendar";
import AttendanceSummary from "../../components/attendance/AttendanceSummary";
import { colors, spacing } from "../../theme";
import { getEmployees } from "../../services/employeeService";
import { getMonthlyAttendance } from "../../services/attendanceService";
import { currentYearMonth, formatMonth, todayKey } from "../../utils/attendanceFormat";

export default function MonthlyAttendanceScreen({ navigation }) {
  const initial = currentYearMonth();
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

  const selectedName = employees.find((employee) => employee.id === employeeId)?.name || "All Employees";

  return (
    <AppScreen title="Monthly attendance" subtitle={selectedName} icon="calendar">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.monthRow}>
          <AppButton label="Previous" variant="secondary" onPress={() => shiftMonth(-1)} />
          <AppText variant="label">{formatMonth(year, month)}</AppText>
          <AppButton label="Next" variant="secondary" onPress={() => shiftMonth(1)} disabled={nextDisabled} />
        </View>
        <AppText variant="caption" color={colors.textSecondary}>
          {selectedName}
        </AppText>
        <View style={styles.filters}>
          <FilterChip label="All Employees" selected={!employeeId} onPress={() => setEmployeeId("")} />
          {employees.map((employee) => (
            <FilterChip
              key={employee.id}
              label={employee.name}
              selected={employeeId === employee.id}
              onPress={() => setEmployeeId(employee.id)}
            />
          ))}
        </View>
        {loading ? <AppText color={colors.textSecondary}>Loading attendance...</AppText> : null}
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
              <AppText variant="body">
                {data.employee.name} — {formatMonth(year, month)}
              </AppText>
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
    </AppScreen>
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
      <AppText variant="caption" color={selected ? colors.textInverse : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  monthRow: { gap: spacing.sm },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
