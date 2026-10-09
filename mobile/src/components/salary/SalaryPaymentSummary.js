import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";
import PaymentStatusBadge from "./PaymentStatusBadge";

export default function SalaryPaymentSummary({
  employeeName,
  periodLabel,
  amount,
  paymentMethod,
  paymentDate,
  paymentReference,
  status,
  notes,
  reversalReason,
  reversedAt,
}) {
  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Salary Payment</AppText>
      <AppText variant="body">Employee {employeeName || "Employee"}</AppText>
      {periodLabel ? <AppText variant="body">Salary Period {periodLabel}</AppText> : null}
      <AppText variant="body">Amount Paid {formatInr(amount)}</AppText>
      <AppText variant="body">Payment Method {methodLabel(paymentMethod)}</AppText>
      {paymentDate ? <AppText variant="body">Payment Date {formatAttendanceDate(paymentDate)}</AppText> : null}
      <AppText variant="body">Reference {paymentReference || "None"}</AppText>
      {notes ? <AppText variant="body">Notes {notes}</AppText> : null}
      <PaymentStatusBadge status={status} />
      {status === "reversed" && reversedAt ? (
        <AppText variant="body">Reversed On {formatAttendanceDate(reversedAt.slice(0, 10))}</AppText>
      ) : null}
      {reversalReason ? <AppText variant="body">Reason {reversalReason}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
