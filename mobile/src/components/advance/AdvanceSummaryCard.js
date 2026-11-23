import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

const TILES = [
  { key: "totalGiven", label: "Given", color: colors.secondary },
  { key: "totalRepaid", label: "Repaid", color: colors.success },
  { key: "totalSalaryDeducted", label: "Deducted", color: colors.warning },
];

export default function AdvanceSummaryCard({ summary }) {
  const values = summary || {};

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
          <AppText style={styles.value} numberOfLines={1}>
            {formatInr(values[tile.key])}
          </AppText>
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
    paddingHorizontal: 4,
  },
  divider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: colors.text,
  },
});
