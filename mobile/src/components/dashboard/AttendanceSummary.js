import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../AppButton";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import { colors, spacing } from "../../theme";
import { weekdayLabel } from "../../utils/dashboardFormat";

const TILES = [
  { key: "presentToday", label: "Present", icon: "checkmark-circle", background: colors.successBackground, iconColor: colors.success },
  { key: "absentToday", label: "Absent", icon: "close-circle", background: colors.errorBackground, iconColor: colors.error },
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
            <Ionicons name={tile.icon} size={18} color={tile.iconColor} />
            <AppText variant="heading" style={styles.value}>
              {String(attendance?.[tile.key] ?? 0)}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
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
        <View style={styles.alert}>
          <View style={styles.alertIcon}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
          </View>
          <View style={styles.alertCopy}>
            <AppText variant="label">Attendance needs attention</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {`${notMarked} employee${notMarked === 1 ? "" : "s"} still not marked for today's shift`}
            </AppText>
          </View>
          <AppButton label="Mark attendance →" onPress={onPress} />
        </View>
      ) : null}
      {complete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attendance complete for today"
          onPress={onPress}
          style={styles.done}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <AppText variant="label" color={colors.success} style={styles.doneText}>
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
    minHeight: 96,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
  },
  alert: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCopy: {
    gap: 2,
  },
  done: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    backgroundColor: colors.successBackground,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
  },
  doneText: {
    flex: 1,
  },
});
