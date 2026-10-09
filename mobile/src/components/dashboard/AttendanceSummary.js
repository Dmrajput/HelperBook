import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { weekdayLabel } from "../../utils/dashboardFormat";

const TILES = [
  { key: "presentToday", label: "Present", icon: "checkmark", background: "#E8F8EF", iconBackground: "#D3F3E2", iconColor: "#1C8A52" },
  { key: "absentToday", label: "Absent", icon: "close", background: "#FDECEC", iconBackground: "#F8D4D6", iconColor: "#D4535E" },
  { key: "notMarkedToday", label: "Not Marked", icon: "time", background: "#FFF6E4", iconBackground: "#FDE8B8", iconColor: "#C8881A" },
  { key: "leaveToday", label: "On Leave", icon: "calendar", background: "#EEF3FF", iconBackground: "#D9E4FF", iconColor: "#4C6FE0" },
];

export default function AttendanceSummary({ attendance, timeZone, onPress }) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <AppText variant="subtitle" style={styles.title}>Today's Overview</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="View attendance details" onPress={onPress}>
          <AppText variant="label" color={colors.primary} style={styles.link}>View Details ›</AppText>
        </Pressable>
      </View>
      {attendance && !attendance.isWorkingDay ? (
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
            <View style={styles.tileTop}>
              <View style={[styles.icon, { backgroundColor: tile.iconBackground }]}>
                <Ionicons name={tile.icon} size={14} color={tile.iconColor} />
              </View>
              <Ionicons name="arrow-forward" size={12} color={tile.iconColor} />
            </View>
            <AppText variant="heading" style={styles.value}>{String(attendance?.[tile.key] ?? 0)}</AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.label}>
              {tile.label}
            </AppText>
          </Pressable>
        ))}
      </View>
      {attendance?.halfDayToday ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {`Half day: ${attendance.halfDayToday}`}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    fontWeight: "700",
    flex: 1,
  },
  link: {
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    minHeight: 108,
    borderRadius: 16,
    padding: spacing.sm,
    gap: 2,
  },
  tileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
