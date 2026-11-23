import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
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
  const name = leave.employeeName || "Employee";
  const initial = String(name).trim().charAt(0).toUpperCase() || "E";
  const label = `${name}, ${leaveTypeLabel(leave.leaveType)}, ${rangeLabel(leave)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.avatar}>
          <AppText variant="label" color="#EA580C" style={styles.avatarLetter}>
            {initial}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="label" style={styles.name} numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {leaveTypeLabel(leave.leaveType)}
          </AppText>
        </View>
        <LeaveStatusBadge status={leave.status} />
        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottom}>
        <View style={styles.meta}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.metaText}>
            {rangeLabel(leave)}
          </AppText>
        </View>
        <View style={styles.daysChip}>
          <AppText variant="caption" color={colors.primary} style={styles.daysText}>
            {`${leave.totalDays} ${leave.totalDays === 1 ? "day" : "days"}`}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    flex: 1,
  },
  daysChip: {
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  daysText: {
    fontWeight: "700",
  },
});
