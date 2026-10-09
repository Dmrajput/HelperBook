import ReportBrowser from "../../components/reports/ReportBrowser";
import ReportRow from "../../components/reports/ReportRow";
import { exportAdvanceExcel, exportAdvancePdf, getAdvanceReport } from "../../services/reportService";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];
const TYPES = [
  { value: "all", label: "All types" },
  { value: "advance", label: "Advance" },
  { value: "repayment", label: "Repayment" },
  { value: "salary_deduction", label: "Salary Deduction" },
  { value: "adjustment", label: "Adjustment" },
  { value: "reversal", label: "Reversal" },
];

export default function AdvanceReportScreen() {
  return (
    <ReportBrowser
      title="Advance Report"
      description="Advances, repayments, and the current outstanding balance."
      loader={getAdvanceReport}
      exportPdf={exportAdvancePdf}
      exportExcel={exportAdvanceExcel}
      showSummaryWhenEmpty
      emptyTitle="No advance transactions found."
      emptyMessage="Current outstanding is still shown from the ledger."
      groupsFor={(filters, onChange) => [
        { key: "advanceStatus", value: filters.advanceStatus || "all", options: STATUSES, onChange: (value) => onChange("advanceStatus", value) },
        { key: "transactionType", value: filters.transactionType || "all", options: TYPES, onChange: (value) => onChange("transactionType", value) },
      ]}
      summaryItems={(data) => [
        { label: "Advances Given", value: formatInr(data.summary.advancesGiven) },
        { label: "Repayments", value: formatInr(data.summary.repayments) },
        { label: "Salary Deductions", value: formatInr(data.summary.salaryDeductions) },
        { label: "Current Outstanding", value: formatInr(data.summary.currentOutstanding) },
      ]}
      renderRow={(row, navigation) => (
        <ReportRow
          title={row.employeeName}
          meta={`${formatAttendanceDate(row.date)} · ${row.typeLabel}${row.reversed ? " · Reversed" : ""} · Balance ${formatInr(row.runningBalance)}`}
          value={formatInr(row.amount)}
          onPress={() => navigation.navigate("EmployeeAdvance", { employeeId: row.employeeId })}
        />
      )}
    />
  );
}
