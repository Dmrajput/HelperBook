import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";
import AdvanceStatusBadge from "./AdvanceStatusBadge";

export default function AdvanceCard({ advance, onPress }) {
  const label = advance.label || "Advance";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, outstanding ${formatInr(advance.outstandingBalance)}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      <View style={styles.row}>
        <AppText variant="subtitle">{label}</AppText>
        <AdvanceStatusBadge status={advance.status} />
      </View>
      <AppText variant="body">Given {formatInr(advance.originalAmount)}</AppText>
      <AppText variant="body">Outstanding {formatInr(advance.outstandingBalance)}</AppText>
      {advance.repaymentSettings?.method === "salary_deduction" ? (
        <AppText variant="caption" color={colors.textSecondary}>
          Salary deduction {formatInr(advance.repaymentSettings.monthlyAmount)} each month
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
});
