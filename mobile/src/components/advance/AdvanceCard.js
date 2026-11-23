import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
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
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="cash-outline" size={16} color={colors.secondary} />
        </View>
        <View style={styles.copy}>
          <AppText variant="label" style={styles.title} numberOfLines={1}>
            {label}
          </AppText>
          {advance.repaymentSettings?.method === "salary_deduction" ? (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {`Salary deduction ${formatInr(advance.repaymentSettings.monthlyAmount)} / month`}
            </AppText>
          ) : (
            <AppText variant="caption" color={colors.textSecondary}>
              Manual repayment
            </AppText>
          )}
        </View>
        <AdvanceStatusBadge status={advance.status} />
        {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.placeholder} /> : null}
      </View>
      <View style={styles.divider} />
      <View style={styles.bottom}>
        <View style={styles.metric}>
          <AppText variant="caption" color={colors.textSecondary}>
            Given
          </AppText>
          <AppText variant="label" style={styles.metricValue}>
            {formatInr(advance.originalAmount)}
          </AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="caption" color={colors.textSecondary}>
            Outstanding
          </AppText>
          <AppText variant="label" style={styles.metricValue}>
            {formatInr(advance.outstandingBalance)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.9 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bottom: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metricValue: {
    fontWeight: "800",
  },
});
