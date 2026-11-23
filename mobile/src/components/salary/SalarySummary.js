import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

const STATUS_TILES = [
  { key: "calculated", label: "Calculated", color: colors.primary },
  { key: "draft", label: "Draft", color: colors.warning },
  { key: "finalized", label: "Finalized", color: colors.success },
  { key: "unpaid", label: "Unpaid", color: colors.error },
];

export default function SalarySummary({ summary, unpaidCount = 0 }) {
  const totals = summary || {};
  const employees = Number(totals.totalEmployees) || 0;
  const calculated = Number(totals.calculated) || 0;
  const values = {
    calculated: `${calculated}/${employees}`,
    draft: String(totals.draft || 0),
    finalized: String(totals.finalized || 0),
    unpaid: String(unpaidCount),
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.netCard}>
        <View style={styles.netTop}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.netCopy}>
            <AppText variant="caption" color={colors.textSecondary}>
              Net salary this month
            </AppText>
            <AppText style={styles.netAmount} numberOfLines={1}>
              {formatInr(totals.totalNetSalary)}
            </AppText>
          </View>
          <View style={styles.employeeChip}>
            <AppText variant="caption" color={colors.primary} style={styles.chipText}>
              {`${employees} staff`}
            </AppText>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <AppText variant="caption" color={colors.textSecondary}>
              Gross
            </AppText>
            <AppText variant="label" numberOfLines={1} style={styles.metricValue}>
              {formatInr(totals.totalGrossSalary)}
            </AppText>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <AppText variant="caption" color={colors.textSecondary}>
              Deductions
            </AppText>
            <AppText variant="label" numberOfLines={1} style={styles.metricValue}>
              {formatInr(totals.totalDeductions)}
            </AppText>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <AppText variant="caption" color={colors.textSecondary}>
              Advances
            </AppText>
            <AppText variant="label" numberOfLines={1} style={styles.metricValue}>
              {formatInr(totals.totalAdvances)}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.statusCard}>
        {STATUS_TILES.map((tile, index) => (
          <View key={tile.key} style={[styles.statusTile, index > 0 && styles.statusDivider]}>
            <View style={styles.statusLabelRow}>
              <View style={[styles.dot, { backgroundColor: tile.color }]} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.statusLabel}>
                {tile.label}
              </AppText>
            </View>
            <AppText style={styles.statusValue}>{values[tile.key]}</AppText>
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
  netCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  netTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  netCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  netAmount: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  employeeChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    alignItems: "center",
  },
  metricValue: {
    fontWeight: "700",
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
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
