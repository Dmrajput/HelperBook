import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { leaveTypeLabel } from "./LeaveTypeBadge";
import LeaveStatusBadge from "./LeaveStatusBadge";

function rangeLabel(leave) {
  if (leave.startDate === leave.endDate) return formatAttendanceDate(leave.startDate);
  return `${formatAttendanceDate(leave.startDate)} – ${formatAttendanceDate(leave.endDate)}`;
}

export default function LeaveCard({ leave, onPress }) {
  const label = `${leave.employeeName || "Employee"}, ${leaveTypeLabel(leave.leaveType)}, ${rangeLabel(leave)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.top}>
        <AppText variant="label">{leave.employeeName || "Employee"}</AppText>
        <LeaveStatusBadge status={leave.status} />
      </View>
      <AppText variant="body">{leaveTypeLabel(leave.leaveType)}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {rangeLabel(leave)} · {leave.totalDays} {leave.totalDays === 1 ? "day" : "days"}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
});
