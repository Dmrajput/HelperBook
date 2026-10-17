import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import { colors, spacing } from "../../theme";
import { formatInr, payPeriodLabel, peopleLabel } from "../../utils/dashboardFormat";

function salarySubtitle(salary, period) {
  if (!salary?.hasFinalized) return `No finalized salary yet · ${period}`;
  if (salary.allPaid) return `All finalized salaries paid · ${period}`;
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
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {title}
      </AppText>
      <AppText variant="heading" style={styles.value} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
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
          background={colors.primaryLight}
          iconColor={colors.primary}
          iconBackground={colors.surface}
          onPress={onPressSalary}
        />
        <MoneyCard
          title="Advance balance"
          value={formatInr(advance?.outstandingAmount)}
          subtitle={peopleLabel(advance?.employeesWithOutstanding, "No outstanding advance")}
          icon="swap-horizontal-outline"
          background={colors.secondaryLight}
          iconColor={colors.secondary}
          iconBackground={colors.surface}
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
    minHeight: 128,
    borderRadius: 14,
    padding: spacing.md,
    gap: 4,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
  },
});
