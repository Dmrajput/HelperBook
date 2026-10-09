import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr, peopleLabel } from "../../utils/dashboardFormat";

function salarySubtitle(salary) {
  if (!salary?.hasFinalized) return "No finalized salary yet";
  if (salary.allPaid) return "All finalized salaries paid";
  return peopleLabel(salary.pendingEmployees, "All finalized salaries paid");
}

function MoneyCard({ title, value, subtitle, icon, background, iconColor, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: background }, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <AppText variant="caption" color={colors.textSecondary}>{title}</AppText>
      <AppText variant="heading" style={styles.value} numberOfLines={1}>{value}</AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>{subtitle}</AppText>
    </Pressable>
  );
}

export default function FinancialSummary({ salary, advance, onPressSalary, onPressAdvance, onViewDetails }) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <AppText variant="subtitle" style={styles.title}>Salary & Advances</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="View salary details" onPress={onViewDetails}>
          <AppText variant="label" color={colors.primary} style={styles.link}>View Details ›</AppText>
        </Pressable>
      </View>
      <View style={styles.row}>
        <MoneyCard
          title="Salary Pending"
          value={formatInr(salary?.pendingAmount)}
          subtitle={salarySubtitle(salary)}
          icon="wallet"
          background="#E8F8EF"
          iconColor="#1C8A52"
          onPress={onPressSalary}
        />
        <MoneyCard
          title="Advance Outstanding"
          value={formatInr(advance?.outstandingAmount)}
          subtitle={peopleLabel(advance?.employeesWithOutstanding, "No outstanding advance")}
          icon="cash"
          background="#F3EEFF"
          iconColor="#7A5AF8"
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    fontWeight: "700",
    flex: 1,
  },
  link: {
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    padding: spacing.md,
    gap: 2,
    minHeight: 132,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.88,
  },
});
