import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const LABELS = {
  unpaid: "UNPAID",
  paid: "PAID",
  reversed: "PAYMENT REVERSED",
};

export default function PaymentStatusBadge({ status }) {
  const label = LABELS[status] || "UNPAID";
  const paid = status === "paid";
  const reversed = status === "reversed";

  return (
    <View
      style={[styles.badge, paid ? styles.paid : reversed ? styles.reversed : styles.unpaid]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <AppText variant="caption" color={paid ? colors.success : reversed ? colors.error : colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unpaid: {
    backgroundColor: colors.disabled,
  },
  paid: {
    backgroundColor: colors.successBackground,
  },
  reversed: {
    backgroundColor: colors.errorBackground,
  },
});
