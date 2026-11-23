import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

const METRICS = [
  { key: "present", label: "P", color: colors.success },
  { key: "absent", label: "A", color: colors.error },
  { key: "halfDay", label: "H", color: colors.warning },
  { key: "leave", label: "L", color: colors.info },
];

export default function AttendanceHistoryItem({ day, onPress }) {
  const content = (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <AppText variant="label" style={styles.date} numberOfLines={1}>
            {formatAttendanceDate(day.date)}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {`${day.total} ${day.total === 1 ? "employee" : "employees"}`}
          </AppText>
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.placeholder} /> : null}
      </View>
      <View style={styles.metrics}>
        {METRICS.map((metric, index) => (
          <View key={metric.key} style={[styles.metric, index > 0 && styles.metricDivider]}>
            <View style={[styles.dot, { backgroundColor: metric.color }]} />
            <AppText variant="caption" color={colors.textSecondary}>
              {metric.label}
            </AppText>
            <AppText variant="label" style={styles.metricValue}>
              {String(day[metric.key] ?? 0)}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formatAttendanceDate(day.date)}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
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
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  date: {
    fontWeight: "700",
  },
  metrics: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  metricDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metricValue: {
    fontWeight: "800",
  },
});
