import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import { colors, spacing } from "../../theme";
import { formatInr, payPeriodLabel, peopleLabel } from "../../utils/dashboardFormat";

function salarySubtitle(salary, period) {
  if (!salary?.hasFinalized) return `No pending salary payments`;
  if (salary.allPaid) return `All salaries paid · ${period}`;
  return `${peopleLabel(salary.pendingEmployees, "Ready to pay")} · ${period}`;
}

function MoneyCard({ title, value, subtitle, icon, background, iconColor, iconBackground, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: background }, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {title}
      </AppText>
      <AppText style={styles.value} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.subtitle}>
        {subtitle}
      </AppText>
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

  return (
    <View style={styles.section}>
      <SectionHeader title="Salary & advances" actionLabel="View all ›" onAction={onViewDetails} />
      <View style={styles.row}>
        <MoneyCard
          title="Salary to pay"
          value={formatInr(salary?.pendingAmount)}
          subtitle={salarySubtitle(salary, period)}
          icon="wallet-outline"
          background={colors.surface}
          iconColor={colors.primary}
          iconBackground={colors.primaryLight}
          onPress={onPressSalary}
        />
        <MoneyCard
          title="Advance balance"
          value={formatInr(advance?.outstandingAmount)}
          subtitle={
            (Number(advance?.outstandingAmount) || 0) > 0
              ? peopleLabel(advance?.employeesWithOutstanding, "Outstanding advances")
              : "No outstanding advances"
          }
          icon="cash-outline"
          background={colors.surface}
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
    borderRadius: 14,
    padding: spacing.md,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.9,
  },
});
