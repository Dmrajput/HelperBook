import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const TILES = [
  { key: "present", label: "Present", color: colors.success, background: colors.successBackground },
  { key: "absent", label: "Absent", color: colors.error, background: colors.errorBackground },
  { key: "halfDay", label: "Half Day", color: colors.warning, background: colors.warningBackground },
  { key: "leave", label: "Leave", color: colors.info, background: colors.infoBackground },
];

export default function AttendanceSummary({ summary }) {
  if (!summary) {
    return null;
  }

  const tiles = TILES.filter((tile) => summary[tile.key] !== undefined && summary[tile.key] !== null);

  return (
    <View style={styles.wrap}>
      {summary.total === undefined || summary.total === null ? null : (
        <AppText variant="label">{`${summary.total} employees`}</AppText>
      )}
      <View style={styles.row}>
        {tiles.map((tile) => (
          <View key={tile.key} style={[styles.tile, { backgroundColor: tile.background }]}>
            <AppText variant="subtitle" align="center" color={tile.color} style={styles.value}>
              {String(summary[tile.key] ?? 0)}
            </AppText>
            <AppText variant="caption" align="center" color={colors.textSecondary} numberOfLines={1}>
              {tile.label}
            </AppText>
          </View>
        ))}
      </View>
      {summary.notMarked === undefined || summary.notMarked === null ? null : (
        <AppText variant="caption" color={colors.textSecondary}>
          {`${summary.notMarked} not marked yet`}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    alignItems: "center",
    gap: 2,
  },
  value: {
    fontWeight: "700",
  },
});
