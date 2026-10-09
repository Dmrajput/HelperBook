import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import { colors, spacing } from "../../theme";
import { getEmployeeAttendance } from "../../services/attendanceService";
import { formatAttendanceDate, monthStartKey, statusLabel, todayKey } from "../../utils/attendanceFormat";

export default function EmployeeAttendanceScreen({ navigation, route }) {
  const { employeeId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = todayKey();
      const next = await getEmployeeAttendance(employeeId, {
        startDate: monthStartKey(today),
        endDate: today,
        limit: 31,
      });
      setData(next);
    } catch (loadError) {
      setData(null);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <AppScreen title={data?.employee?.name || "Attendance"} subtitle="Attendance records" icon="calendar">
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <AppText color={colors.textSecondary}>Loading attendance...</AppText> : null}
        {error ? (
          <ErrorView
            title="Unable to load attendance."
            message={error.isNetworkError ? "Please check your internet connection and try again." : error.message}
            onRetry={load}
          />
        ) : null}
        {data ? (
          <View style={styles.summary}>
            <Summary label="Present" value={data.summary.present} />
            <Summary label="Absent" value={data.summary.absent} />
            <Summary label="Half Day" value={data.summary.halfDay} />
            <Summary label="Leave" value={data.summary.leave} />
          </View>
        ) : null}
        {data && data.records.length === 0 ? (
          <AttendanceEmptyState
            title="No attendance records yet."
            message="Start marking attendance to see history here."
          />
        ) : null}
        {data?.records.map((record) => (
          <View key={record.id} style={styles.row}>
            <AppText variant="label">{formatAttendanceDate(record.date)}</AppText>
            <AppText variant="body">{statusLabel(record.status)}</AppText>
            {record.notes ? (
              <AppText variant="caption" color={colors.textSecondary}>
                {record.notes}
              </AppText>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

function Summary({ label, value }) {
  return (
    <View style={styles.metric}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
