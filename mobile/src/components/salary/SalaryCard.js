import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";
import PaymentStatusBadge from "./PaymentStatusBadge";
import SalaryStatusBadge from "./SalaryStatusBadge";

export default function SalaryCard({ name, amount, status, paymentStatus, detail, actionLabel, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${actionLabel}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && !disabled && styles.pressed]}
    >
      <View style={styles.copy}>
        <AppText variant="subtitle">{name}</AppText>
        <AppText variant="body">{amount == null ? "Not calculated" : formatInr(amount)}</AppText>
        {detail ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {detail}
          </AppText>
        ) : null}
      </View>
      <View style={styles.side}>
        <SalaryStatusBadge status={status} />
        {paymentStatus ? <PaymentStatusBadge status={paymentStatus} /> : null}
        <AppText variant="caption" color={colors.primary}>
          {actionLabel}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  side: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
});
