import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";
import PaymentStatusBadge from "./PaymentStatusBadge";

export default function SalaryPaymentHistoryCard({ payment, onPress }) {
  const initial = String(payment.employeeName || "E").trim().charAt(0).toUpperCase() || "E";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${payment.employeeName}, ${payment.periodLabel}, ${formatInr(payment.amount)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.avatar}>
          <AppText variant="label" color={colors.primary} style={styles.avatarLetter}>
            {initial}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="label" style={styles.name} numberOfLines={1}>
            {payment.employeeName || "Employee"}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {payment.periodLabel || "Salary"}
          </AppText>
        </View>
        <PaymentStatusBadge status={payment.status} />
        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottom}>
        <View style={styles.amountBlock}>
          <AppText variant="caption" color={colors.textSecondary}>
            Amount paid
          </AppText>
          <AppText variant="label" style={styles.amount}>
            {formatInr(payment.amount)}
          </AppText>
        </View>
        <View style={styles.meta}>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {methodLabel(payment.paymentMethod)}
          </AppText>
          <AppText variant="caption" color={colors.placeholder}>
            {payment.paymentDate ? formatAttendanceDate(payment.paymentDate) : ""}
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
  pressed: {
    opacity: 0.9,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  amountBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  amount: {
    fontWeight: "800",
    fontSize: 16,
  },
  meta: {
    alignItems: "flex-end",
    gap: 2,
  },
});
