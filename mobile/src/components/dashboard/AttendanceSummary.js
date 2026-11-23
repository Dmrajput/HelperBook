import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { weekdayLabel } from "../../utils/dashboardFormat";

const STATS = [
  { key: "presentToday", label: "Present", color: colors.success },
  { key: "absentToday", label: "Absent", color: colors.error },
  { key: "notMarkedToday", label: "Not marked", color: colors.warning },
];

export default function AttendanceSummary({ attendance, timeZone, activeCount = 0, onPress }) {
  const present = Number(attendance?.presentToday) || 0;
  const total = Math.max(Number(activeCount) || 0, 0);
  const notMarked = Number(attendance?.notMarkedToday) || 0;
  const leaveToday = Number(attendance?.leaveToday) || 0;
  const halfDay = Number(attendance?.halfDayToday) || 0;
  const isWorkingDay = attendance?.isWorkingDay !== false;
  const needsMarking = isWorkingDay && notMarked > 0;
  const complete = isWorkingDay && total > 0 && notMarked === 0;
  const progress = total > 0 ? Math.min(1, present / total) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="label" style={styles.title}>
          Team attendance
        </AppText>
        <View style={styles.todayChip}>
          <AppText variant="caption" color={colors.primary} style={styles.chipText}>
            Today
          </AppText>
        </View>
      </View>

      {!isWorkingDay ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {`${weekdayLabel(timeZone)} is a weekly off. Shop is closed today.`}
        </AppText>
      ) : (
        <>
          <View style={styles.hero}>
            <AppText style={styles.metric}>
              {`${present} of ${total}`}
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              employees present
            </AppText>
          </View>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          <View style={styles.stats}>
            {STATS.map((stat) => (
              <View key={stat.key} style={styles.stat}>
                <View style={[styles.dot, { backgroundColor: stat.color }]} />
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {`${attendance?.[stat.key] ?? 0} ${stat.label}`}
                </AppText>
              </View>
            ))}
          </View>

          {leaveToday > 0 || halfDay > 0 ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {[
                leaveToday > 0 ? `On leave: ${leaveToday}` : null,
                halfDay > 0 ? `Half day: ${halfDay}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </AppText>
          ) : null}

          {needsMarking ? (
            <View style={styles.warning}>
              <Ionicons name="warning-outline" size={16} color="#B45309" />
              <AppText variant="caption" color="#92400E" style={styles.warningText}>
                {`${notMarked} employee${notMarked === 1 ? "" : "s"} need${notMarked === 1 ? "s" : ""} attendance`}
              </AppText>
            </View>
          ) : null}

          {complete ? (
            <View style={styles.done}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <AppText variant="caption" color={colors.success} style={styles.doneText}>
                Today's attendance is complete
              </AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark attendance"
            onPress={onPress}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.textInverse} />
            <AppText variant="button" color={colors.textInverse}>
              Mark attendance
            </AppText>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
  },
  todayChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontWeight: "700",
    fontSize: 11,
  },
  hero: {
    gap: 2,
  },
  metric: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.primary,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#EEF2F7",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  warningText: {
    flex: 1,
    fontWeight: "600",
  },
  done: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.successBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  doneText: {
    flex: 1,
    fontWeight: "700",
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
});
