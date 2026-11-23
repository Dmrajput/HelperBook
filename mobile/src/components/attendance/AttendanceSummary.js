import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const TILES = [
  { key: "present", label: "Present", color: colors.success },
  { key: "absent", label: "Absent", color: colors.error },
  { key: "halfDay", label: "Half day", color: colors.warning },
  { key: "leave", label: "Leave", color: colors.info },
];

export default function AttendanceSummary({ summary }) {
  if (!summary) {
    return null;
  }

  return (
    <View style={styles.card}>
      {TILES.map((tile, index) => (
        <View key={tile.key} style={[styles.tile, index > 0 && styles.divider]}>
          <View style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: tile.color }]} />
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.label}>
              {tile.label}
            </AppText>
          </View>
          <AppText style={styles.value}>{String(summary[tile.key] ?? 0)}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  value: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.text,
  },
});
