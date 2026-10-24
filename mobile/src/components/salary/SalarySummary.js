import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

function StatusTile({ label, value, icon, color, background }) {
  return (
    <View style={[styles.statusTile, { backgroundColor: background }]}>
      <Ionicons name={icon} size={14} color={color} />
      <AppText variant="label" color={color} style={styles.statusValue} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color={color} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export default function SalarySummary({ summary, unpaidCount = 0 }) {
  const totals = summary || {};
  const employees = Number(totals.totalEmployees) || 0;
  const calculated = Number(totals.calculated) || 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.netBlock}>
          <View style={styles.netLabelRow}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={16} color={colors.primary} />
            </View>
            <AppText variant="caption" color={colors.textSecondary}>
              Net Salary (after deductions)
            </AppText>
          </View>
          <AppText variant="heading" style={styles.netAmount} numberOfLines={1}>
            {formatInr(totals.totalNetSalary)}
          </AppText>
        </View>
        <View style={styles.employeeChip}>
          <Ionicons name="people" size={16} color={colors.secondary} />
          <AppText variant="caption" color={colors.textSecondary}>
            Employees
          </AppText>
          <AppText variant="subtitle" style={styles.employeeCount}>
            {String(employees)}
          </AppText>
        </View>
      </View>

      <View style={styles.statusRow}>
        <StatusTile
          label="Calculated"
          value={`${calculated} / ${employees}`}
          icon="calculator-outline"
          color={colors.primary}
          background={colors.primaryLight}
        />
        <StatusTile
          label="Draft"
          value={String(totals.draft || 0)}
          icon="document-text-outline"
          color={colors.warning}
          background={colors.warningBackground}
        />
        <StatusTile
          label="Finalized"
          value={String(totals.finalized || 0)}
          icon="checkmark-circle"
          color={colors.success}
          background={colors.successBackground}
        />
        <StatusTile
          label="Unpaid"
          value={String(unpaidCount)}
          icon="hourglass-outline"
          color={colors.error}
          background={colors.errorBackground}
        />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <AppText variant="caption" color={colors.textSecondary}>
            Gross Salary
          </AppText>
          <AppText variant="label" numberOfLines={1}>
            {formatInr(totals.totalGrossSalary)}
          </AppText>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <AppText variant="caption" color={colors.textSecondary}>
            Deductions
          </AppText>
          <AppText variant="label" numberOfLines={1}>
            {formatInr(totals.totalDeductions)}
          </AppText>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <AppText variant="caption" color={colors.textSecondary}>
            Advances
          </AppText>
          <AppText variant="label" numberOfLines={1}>
            {formatInr(totals.totalAdvances)}
          </AppText>
        </View>
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
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  netBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  netLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  netAmount: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  employeeChip: {
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.secondaryLight,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 72,
  },
  employeeCount: {
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 2,
    minHeight: 72,
  },
  statusValue: {
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    alignItems: "center",
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});
