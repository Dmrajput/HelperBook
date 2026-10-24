import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import { colors, spacing } from "../../theme";
import { weekdayLabel } from "../../utils/dashboardFormat";

const TILES = [
  { key: "presentToday", label: "Present", icon: "person", background: colors.successBackground, iconColor: colors.success },
  { key: "absentToday", label: "Absent", icon: "person-remove", background: colors.errorBackground, iconColor: colors.error },
  { key: "notMarkedToday", label: "Not marked", icon: "time", background: colors.warningBackground, iconColor: colors.warning },
];

export default function AttendanceSummary({ attendance, timeZone, onPress }) {
  const notMarked = Number(attendance?.notMarkedToday) || 0;
  const leaveToday = Number(attendance?.leaveToday) || 0;
  const halfDay = Number(attendance?.halfDayToday) || 0;
  const isWorkingDay = attendance?.isWorkingDay !== false;
  const needsMarking = isWorkingDay && notMarked > 0;
  const complete = isWorkingDay && notMarked === 0;

  return (
    <View style={styles.section}>
      <SectionHeader title="Today's attendance" actionLabel="View all ›" onAction={onPress} />
      {!isWorkingDay ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {`${weekdayLabel(timeZone)} is a weekly off. Shop is closed today.`}
        </AppText>
      ) : null}
      <View style={styles.row}>
        {TILES.map((tile) => (
          <Pressable
            key={tile.key}
            accessibilityRole="button"
            accessibilityLabel={`${tile.label}, ${attendance?.[tile.key] ?? 0}`}
            onPress={onPress}
            style={({ pressed }) => [styles.tile, { backgroundColor: tile.background }, pressed && styles.pressed]}
          >
            <Ionicons name={tile.icon} size={16} color={tile.iconColor} />
            <AppText style={[styles.value, { color: tile.iconColor }]}>
              {String(attendance?.[tile.key] ?? 0)}
            </AppText>
            <AppText variant="caption" color={tile.iconColor} numberOfLines={1} style={styles.tileLabel}>
              {tile.label}
            </AppText>
          </Pressable>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark attendance"
          onPress={onPress}
          style={({ pressed }) => [styles.alert, pressed && styles.pressed]}
        >
          <View style={styles.alertIcon}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
          </View>
          <View style={styles.alertCopy}>
            <AppText variant="caption" style={styles.alertTitle}>
              Attendance needs attention
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {`${notMarked} not marked today`}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.primary} style={styles.alertAction}>
            Mark ›
          </AppText>
        </Pressable>
      ) : null}
      {complete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attendance complete for today"
          onPress={onPress}
          style={({ pressed }) => [styles.done, pressed && styles.pressed]}
        >
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <AppText variant="caption" color={colors.success} style={styles.doneText}>
            Today's attendance is complete
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    gap: 2,
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.88,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  alertTitle: {
    fontWeight: "700",
    color: colors.text,
  },
  alertAction: {
    fontWeight: "700",
  },
  done: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    backgroundColor: colors.successBackground,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  doneText: {
    flex: 1,
    fontWeight: "700",
  },
});
