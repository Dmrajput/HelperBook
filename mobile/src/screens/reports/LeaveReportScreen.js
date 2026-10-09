import ReportBrowser from "../../components/reports/ReportBrowser";
import ReportRow from "../../components/reports/ReportRow";
import { exportLeaveExcel, exportLeavePdf, getLeaveReport } from "../../services/reportService";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

const TYPES = [
  { value: "all", label: "All types" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "sick", label: "Sick" },
];
const STATUSES = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];
const TREATMENTS = [
  { value: "all", label: "All treatment" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

export default function LeaveReportScreen() {
  return (
    <ReportBrowser
      title="Leave Report"
      description="Approved leave days inside the selected period."
      loader={getLeaveReport}
      exportPdf={exportLeavePdf}
      exportExcel={exportLeaveExcel}
      emptyTitle="No leave records found for this period."
      emptyMessage="Try selecting another month or employee."
      groupsFor={(filters, onChange) => [
        { key: "leaveType", value: filters.leaveType || "all", options: TYPES, onChange: (value) => onChange("leaveType", value) },
        { key: "status", value: filters.status || "all", options: STATUSES, onChange: (value) => onChange("status", value) },
        { key: "salaryTreatment", value: filters.salaryTreatment || "all", options: TREATMENTS, onChange: (value) => onChange("salaryTreatment", value) },
      ]}
      summaryItems={(data) => [
        { label: "Approved Days", value: String(data.summary.approvedDays) },
        { label: "Paid Leave", value: String(data.summary.paidLeave) },
        { label: "Unpaid Leave", value: String(data.summary.unpaidLeave) },
        { label: "Sick Leave", value: String(data.summary.sickLeave) },
        { label: "Pending Requests", value: String(data.summary.pendingRequests) },
      ]}
      renderRow={(row, navigation) => (
        <ReportRow
          title={row.employeeName}
          meta={`${row.leaveTypeLabel} · ${formatAttendanceDate(row.startDate)} - ${formatAttendanceDate(row.endDate)} · ${row.daysInRange} days · ${row.statusLabel}`}
          onPress={() => navigation.navigate("LeaveDetail", { leaveId: row.leaveId })}
        />
      )}
    />
  );
}
