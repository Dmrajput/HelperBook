import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

export default function AttendanceHistoryItem({ day, onPress }) {
  const content = (
    <View style={styles.card}>
      <AppText variant="label">{formatAttendanceDate(day.date)}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {day.total} {day.total === 1 ? "employee" : "employees"}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        Present {day.present} · Absent {day.absent} · Half Day {day.halfDay} · Leave {day.leave}
      </AppText>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={formatAttendanceDate(day.date)} onPress={onPress}>
      {content}
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
});
