import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const TILES = [
  { key: "pending", label: "Pending", color: colors.warning },
  { key: "paid", label: "Paid", color: colors.success },
  { key: "unpaid", label: "Unpaid", color: colors.error },
  { key: "sick", label: "Sick", color: "#EA580C" },
];

export default function LeaveSummaryCard({ summary, title = "This month" }) {
  const values = summary || {};
  const pending = values.pendingRequests ?? values.pending ?? 0;
  const counts = {
    pending: String(pending),
    paid: `${values.paidDays ?? 0}d`,
    unpaid: `${values.unpaidDays ?? 0}d`,
    sick: `${values.sickDays ?? 0}d`,
  };

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={`${title} leave summary`}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.icon}>
            <Ionicons name="calendar-outline" size={18} color="#EA580C" />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="caption" color={colors.textSecondary}>
              {title}
            </AppText>
            <AppText style={styles.heroValue}>{`${pending} pending`}</AppText>
          </View>
          <View style={styles.chip}>
            <AppText variant="caption" color="#EA580C" style={styles.chipText}>
              Leave
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.statusCard}>
        {TILES.map((tile, index) => (
          <View key={tile.key} style={[styles.statusTile, index > 0 && styles.statusDivider]}>
            <View style={styles.statusLabelRow}>
              <View style={[styles.dot, { backgroundColor: tile.color }]} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.statusLabel}>
                {tile.label}
              </AppText>
            </View>
            <AppText style={styles.statusValue}>{counts[tile.key]}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.text,
  },
  chip: {
    backgroundColor: "#FFF7ED",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontWeight: "700",
  },
  statusCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  statusTile: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  statusDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  statusLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.text,
  },
});
