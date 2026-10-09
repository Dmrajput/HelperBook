import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import AttendanceCalendar from "../../components/attendance/AttendanceCalendar";
import { getEmployeeAttendance } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatMonth, todayKey } from "../../utils/attendanceFormat";

function shiftMonth(month, delta) {
  const [year, value] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, value - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function EmployeeAttendanceScreen() {
  const [month, setMonth] = useState(todayKey().slice(0, 7));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getEmployeeAttendance(month));
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const [year, monthNumber] = month.split("-").map(Number);
  const summary = data?.summary || { present: 0, absent: 0, halfDay: 0, leave: 0 };

  return (
    <AppScreen title="Attendance" subtitle={formatMonth(year, monthNumber)} icon="calendar" showBack={false}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Pressable onPress={() => setMonth(shiftMonth(month, -1))} accessibilityRole="button"><AppText variant="button">Previous</AppText></Pressable>
          <AppText variant="subtitle">{formatMonth(year, monthNumber)}</AppText>
          <Pressable onPress={() => setMonth(shiftMonth(month, 1))} accessibilityRole="button"><AppText variant="button">Next</AppText></Pressable>
        </View>
        {error ? <ErrorView message={error} onRetry={load} /> : null}
        <AppText variant="body">Present {summary.present}  Absent {summary.absent}</AppText>
        <AppText variant="body">Half Day {summary.halfDay}  Leave {summary.leave}</AppText>
        <AttendanceCalendar year={year} month={monthNumber} days={data?.records || []} today={todayKey()} onSelectDate={() => {}} />
        {!loading && !(data?.records || []).length ? (
          <AppText variant="body" color={colors.textSecondary}>No attendance records found for this month.</AppText>
        ) : null}
        {(data?.records || []).map((record) => (
          <AppText key={record.date} variant="body">{record.date}  {record.status.replace("_", " ")}</AppText>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
