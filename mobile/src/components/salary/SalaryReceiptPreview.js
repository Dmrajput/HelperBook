import { Image, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, formatMonth } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

function Row({ label, value, strong = false }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <AppText variant={strong ? "subtitle" : "body"} color={strong ? colors.text : colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant={strong ? "subtitle" : "body"}>{value}</AppText>
    </View>
  );
}

function Block({ title, children }) {
  return (
    <View style={styles.card}>
      <AppText variant="subtitle">{title}</AppText>
      {children}
    </View>
  );
}

export default function SalaryReceiptPreview({ receipt }) {
  if (!receipt) return null;
  const shop = receipt.shop || {};
  const employee = receipt.employee || {};
  const attendance = receipt.attendance || {};
  const payment = receipt.payment || {};
  const period = receipt.period ? `${formatAttendanceDate(receipt.period.startDate)} – ${formatAttendanceDate(receipt.period.endDate)}` : "";

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        {shop.logoUrl ? (
          <Image source={{ uri: shop.logoUrl }} style={styles.logo} accessibilityLabel={`${shop.name || "Shop"} logo`} />
        ) : null}
        <AppText variant="heading">{shop.name || "Salary Receipt"}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          SALARY RECEIPT
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {receipt.receipt?.receiptNumber}
        </AppText>
      </View>
      <Block title="Employee">
        <AppText variant="body">{employee.name}</AppText>
        {employee.role ? <AppText variant="body">{employee.role}</AppText> : null}
        {employee.phone ? <AppText variant="body">{employee.phone}</AppText> : null}
        {employee.joiningDate ? <AppText variant="body">Joined {formatAttendanceDate(employee.joiningDate)}</AppText> : null}
      </Block>
      <Block title="Salary Period">
        <AppText variant="body">{period}</AppText>
        {receipt.period ? <AppText variant="caption" color={colors.textSecondary}>{formatMonth(receipt.period.year, receipt.period.month)}</AppText> : null}
      </Block>
      <Block title="Attendance">
        <Row label="Working Days" value={String(attendance.workingDays ?? 0)} />
        <Row label="Present" value={String(attendance.presentDays ?? 0)} />
        <Row label="Half Days" value={String(attendance.halfDays ?? 0)} />
        <Row label="Absent" value={String(attendance.absentDays ?? 0)} />
        <Row label="Leave" value={String(attendance.leaveDays ?? 0)} />
        {Number(attendance.paidLeaveDays) > 0 ? <Row label="Paid Leave" value={`${attendance.paidLeaveDays} days`} /> : null}
      </Block>
      <Block title="Salary Breakdown">
        {(receipt.lines || []).map((line) => (
          <Row key={`${line.section}-${line.label}-${line.amount}`} label={line.label} value={formatInr(line.amount)} />
        ))}
        <View style={styles.line} />
        <Row label="Final Salary" value={formatInr(receipt.finalSalary)} strong />
      </Block>
      <Block title="Payment">
        <PaymentStatusBadge status="paid" />
        <Row label="Amount" value={formatInr(payment.amount)} />
        <Row label="Method" value={payment.methodLabel} />
        <Row label="Payment Date" value={payment.paymentDate ? formatAttendanceDate(payment.paymentDate) : ""} />
        {payment.method === "cash" && !payment.reference ? null : <Row label="Reference" value={payment.reference || "—"} />}
      </Block>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  header: { alignItems: "center", gap: spacing.xs },
  logo: { width: 64, height: 64, borderRadius: 12, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  line: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
});
