import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";
import PaymentStatusBadge from "./PaymentStatusBadge";

export default function SalaryPaymentHistoryCard({ payment, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${payment.employeeName}, ${payment.periodLabel}, ${formatInr(payment.amount)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <AppText variant="subtitle">{payment.employeeName || "Employee"}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {payment.periodLabel || "Salary"}
      </AppText>
      <AppText variant="subtitle">{formatInr(payment.amount)}</AppText>
      <View style={styles.row}>
        <AppText variant="body">{methodLabel(payment.paymentMethod)}</AppText>
        <PaymentStatusBadge status={payment.status} />
      </View>
      <AppText variant="caption" color={colors.textSecondary}>
        {payment.paymentDate ? formatAttendanceDate(payment.paymentDate) : ""}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
});
