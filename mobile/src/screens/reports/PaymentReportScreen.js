import ReportBrowser from "../../components/reports/ReportBrowser";
import ReportRow from "../../components/reports/ReportRow";
import { exportPaymentExcel, exportPaymentPdf, getPaymentReport } from "../../services/reportService";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

const METHODS = [
  { value: "all", label: "All" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank Transfer" },
];
const STATUSES = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "reversed", label: "Reversed" },
];

export default function PaymentReportScreen() {
  return (
    <ReportBrowser
      title="Payment Report"
      description="Payments are filtered by the date they were paid."
      loader={getPaymentReport}
      exportPdf={exportPaymentPdf}
      exportExcel={exportPaymentExcel}
      emptyTitle="No salary payments found for this period."
      emptyMessage="Try selecting another month or employee."
      groupsFor={(filters, onChange) => [
        { key: "paymentMethod", value: filters.paymentMethod || "all", options: METHODS, onChange: (value) => onChange("paymentMethod", value) },
        { key: "status", value: filters.status || "all", options: STATUSES, onChange: (value) => onChange("status", value) },
      ]}
      summaryItems={(data) => [
        { label: "Paid Payments", value: String(data.summary.paidPayments) },
        { label: "Total Paid", value: formatInr(data.summary.totalPaid) },
        { label: "Cash", value: formatInr(data.summary.cash) },
        { label: "UPI", value: formatInr(data.summary.upi) },
        { label: "Bank Transfer", value: formatInr(data.summary.bank) },
        { label: "Reversed Payments", value: String(data.summary.reversedPayments) },
      ]}
      renderRow={(row, navigation) => (
        <ReportRow
          title={row.employeeName}
          meta={`${formatAttendanceDate(row.paymentDate)} · ${row.salaryPeriod} · ${row.paymentMethodLabel} · ${row.statusLabel}${row.reversalReason ? ` · ${row.reversalReason}` : ""}`}
          value={formatInr(row.amount)}
          onPress={() => navigation.navigate("SalaryPaymentDetail", { paymentId: row.paymentId })}
        />
      )}
    />
  );
}
