import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";
import PaymentStatusBadge from "./PaymentStatusBadge";

function Row({ icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText variant="label" style={styles.rowValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

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
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="cash-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.topCopy}>
          <AppText variant="caption" color={colors.textSecondary}>
            Salary payment
          </AppText>
          <AppText style={styles.amount}>{formatInr(amount)}</AppText>
        </View>
        <PaymentStatusBadge status={status} />
      </View>

      <Row icon="person-outline" label="Employee" value={employeeName || "Employee"} />
      <Row icon="calendar-outline" label="Salary period" value={periodLabel} />
      <Row icon="card-outline" label="Payment method" value={methodLabel(paymentMethod)} />
      <Row
        icon="time-outline"
        label="Payment date"
        value={paymentDate ? formatAttendanceDate(paymentDate) : ""}
      />
      <Row icon="pricetag-outline" label="Reference" value={paymentReference || "None"} />
      <Row icon="document-text-outline" label="Notes" value={notes} />
      {status === "reversed" && reversedAt ? (
        <Row
          icon="return-down-back-outline"
          label="Reversed on"
          value={formatAttendanceDate(reversedAt.slice(0, 10))}
        />
      ) : null}
      <Row icon="alert-circle-outline" label="Reason" value={reversalReason} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  topCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  amount: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowValue: {
    fontWeight: "700",
  },
});
