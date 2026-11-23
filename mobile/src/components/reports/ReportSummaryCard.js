import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function ReportSummaryCard({ items }) {
  return (
    <View style={styles.card}>
      <AppText variant="label" style={styles.title}>
        Summary
      </AppText>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View key={item.label} style={[styles.tile, index % 2 === 1 && styles.tileRight]}>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
              {item.label}
            </AppText>
            <AppText variant="label" style={styles.value} numberOfLines={1}>
              {item.value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  tile: {
    width: "50%",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tileRight: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  value: {
    fontWeight: "800",
    fontSize: 15,
  },
});
