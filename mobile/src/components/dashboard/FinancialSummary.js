import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import { colors, spacing } from "../../theme";
import { formatInr, payPeriodLabel, peopleLabel } from "../../utils/dashboardFormat";

function MoneyCard({ title, value, subtitle, footnote, icon, iconColor, iconBackground, statusOk, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.cardTitle}>
        {title}
      </AppText>
      <AppText style={styles.value} numberOfLines={1}>
        {value}
      </AppText>
      {statusOk ? (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <AppText variant="caption" color={colors.success} numberOfLines={1} style={styles.statusText}>
            {subtitle}
          </AppText>
        </View>
      ) : (
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </AppText>
      )}
      {footnote ? (
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {footnote}
        </AppText>
      ) : null}
    </Pressable>
  );
}

export default function FinancialSummary({
  salary,
  advance,
  timeZone,
  onPressSalary,
  onPressAdvance,
  onViewDetails,
}) {
  const period = payPeriodLabel(timeZone);
  const salaryOk = Boolean(salary?.hasFinalized && salary?.allPaid);
  const salarySubtitle = !salary?.hasFinalized
    ? "No pending salary payments"
    : salary.allPaid
      ? "All salaries paid"
      : peopleLabel(salary.pendingEmployees, "Ready to pay");

  const advanceAmount = Number(advance?.outstandingAmount) || 0;
  const advanceSubtitle =
    advanceAmount > 0 ? peopleLabel(advance?.employeesWithOutstanding, "Outstanding advances") : "No outstanding advances";

  return (
    <View style={styles.section}>
      <SectionHeader title="Salary & advances" actionLabel="View all ›" onAction={onViewDetails} />
      <View style={styles.row}>
        <MoneyCard
          title="Salary to pay"
          value={formatInr(salary?.pendingAmount)}
          subtitle={salarySubtitle}
          footnote={period}
          icon="wallet-outline"
          iconColor={colors.primary}
          iconBackground={colors.primaryLight}
          statusOk={salaryOk}
          onPress={onPressSalary}
        />
        <MoneyCard
          title="Advance balance"
          value={formatInr(advance?.outstandingAmount)}
          subtitle={advanceSubtitle}
          icon="cash-outline"
          iconColor={colors.secondary}
          iconBackground={colors.secondaryLight}
          onPress={onPressAdvance}
        />
      </View>
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
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: "600",
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    flex: 1,
    fontWeight: "700",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.9,
  },
});
