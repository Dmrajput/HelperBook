import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { weekdayLabel } from "../../utils/dashboardFormat";
import MetricCard from "./MetricCard";

export default function AttendanceSummary({ attendance, timeZone }) {
  if (!attendance?.isWorkingDay) {
    return (
      <View style={styles.section}>
        <AppText variant="subtitle">Today's Overview</AppText>
        <View style={styles.closed}>
          <AppText variant="label">{weekdayLabel(timeZone)}</AppText>
          <AppText variant="body">Today is a weekly off</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Shop is closed today.
          </AppText>
          {attendance?.presentToday || attendance?.absentToday || attendance?.halfDayToday || attendance?.leaveToday ? (
            <AppText variant="caption" color={colors.textSecondary}>
              Present {attendance.presentToday} · Absent {attendance.absentToday} · Half Day {attendance.halfDayToday} · Leave {attendance.leaveToday}
            </AppText>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <AppText variant="subtitle">Today's Overview</AppText>
      <View style={styles.row}>
        <View style={styles.cell}>
          <MetricCard title="Present" value={String(attendance?.presentToday ?? 0)} compact />
        </View>
        <View style={styles.cell}>
          <MetricCard title="Absent" value={String(attendance?.absentToday ?? 0)} compact />
        </View>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Not Marked: {attendance?.notMarkedToday ?? 0}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        Half Day: {attendance?.halfDayToday ?? 0} · Leave: {attendance?.leaveToday ?? 0}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
  closed: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
