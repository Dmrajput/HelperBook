import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import AttendanceDateSelector from "../../components/attendance/AttendanceDateSelector";
import AttendanceHistoryItem from "../../components/attendance/AttendanceHistoryItem";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import AttendanceStatusSelector from "../../components/attendance/AttendanceStatusSelector";
import { colors, spacing } from "../../theme";
import { getAttendanceHistory } from "../../services/attendanceService";
import { getEmployees } from "../../services/employeeService";
import { monthStartKey, todayKey } from "../../utils/attendanceFormat";

export default function AttendanceHistoryScreen({ navigation }) {
  const [startDate, setStartDate] = useState(monthStartKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [days, setDays] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (nextPage = 1) => {
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
  }, [status, employeeId, startDate, endDate]);

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  return (
    <AppScreen title="Attendance history" subtitle="Past attendance by day" icon="time">
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="label">From</AppText>
        <AttendanceDateSelector date={startDate} onChange={setStartDate} />
        <AppText variant="label">To</AppText>
        <AttendanceDateSelector date={endDate} onChange={setEndDate} />
        {startDate > endDate ? (
          <AppText color={colors.error}>The start date must be on or before the end date.</AppText>
        ) : null}
        <AttendanceStatusSelector value={status || null} onChange={(next) => setStatus(next === status ? "" : next)} />
        <View style={styles.filters}>
          <Filter label="All employees" selected={!employeeId} onPress={() => setEmployeeId("")} />
          {employees.map((employee) => (
            <Filter
              key={employee.id}
              label={employee.name}
              selected={employeeId === employee.id}
              onPress={() => setEmployeeId(employee.id)}
            />
          ))}
        </View>
        {loading && page === 1 ? <AppText color={colors.textSecondary}>Loading attendance...</AppText> : null}
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
        {page < totalPages ? <AppButton label="Load more" variant="secondary" onPress={() => load(page + 1)} /> : null}
      </ScrollView>
    </AppScreen>
  );
}

function Filter({ label, selected, onPress }) {
  return (
    <AppText
      variant="caption"
      color={selected ? colors.primary : colors.text}
      accessibilityRole="button"
      onPress={onPress}
    >
      {selected ? `${label} · Selected` : label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
});
