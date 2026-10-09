import ReportBrowser from "../../components/reports/ReportBrowser";
import ReportRow from "../../components/reports/ReportRow";
import { exportAttendanceExcel, exportAttendancePdf, getAttendanceReport } from "../../services/reportService";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

export default function AttendanceReportScreen() {
  return (
    <ReportBrowser
      title="Attendance Report"
      description="How did employees attend during this period?"
      loader={getAttendanceReport}
      exportPdf={exportAttendancePdf}
      exportExcel={exportAttendanceExcel}
      emptyTitle="No attendance records for this period."
      emptyMessage="Try selecting another month or employee."
      groupsFor={(filters, onChange) => [
        { key: "status", value: filters.status || "all", options: STATUSES, onChange: (value) => onChange("status", value) },
      ]}
      summaryItems={(data) => [
        { label: "Employees", value: String(data.summary.employees) },
        { label: "Present", value: String(data.summary.present) },
        { label: "Absent", value: String(data.summary.absent) },
        { label: "Half Days", value: String(data.summary.halfDay) },
        { label: "Leave", value: String(data.summary.leave) },
      ]}
      renderRow={(row, navigation) => (
        <ReportRow
          title={row.employeeName}
          meta={`Present ${row.present} · Absent ${row.absent} · Half Day ${row.halfDay} · Leave ${row.leave}`}
          onPress={() => navigation.navigate("EmployeeAttendance", { employeeId: row.employeeId })}
        />
      )}
      renderExtra={(data, navigation) =>
        (data.daily || []).map((row) => (
          <ReportRow
            key={`${row.employeeId}-${row.date}-${row.status}`}
            title={formatAttendanceDate(row.date)}
            meta={`${row.employeeName} · ${row.statusLabel}`}
            onPress={() => navigation.navigate("EmployeeAttendance", { employeeId: row.employeeId })}
          />
        ))
      }
    />
  );
}
