import Leave from "../../models/Leave.js";
import Employee from "../../models/Employee.js";
import { LEAVE_STATUSES, LEAVE_TYPES, SALARY_TREATMENTS } from "../../constants/leave.js";
import { keyFromDate } from "../../utils/attendanceDate.js";
import { assertExportSize, inclusiveDayCount, oneOf, pageOf, prepareReport } from "../../validators/report.validator.js";

const TYPE_LABELS = { paid: "Paid Leave", unpaid: "Unpaid Leave", sick: "Sick Leave" };
const STATUS_LABELS = { pending: "Pending", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" };

function overlapDays(leave, from, to) {
  const start = keyFromDate(leave.startDate);
  const end = keyFromDate(leave.endDate);
  const lower = start > from ? start : from;
  const upper = end < to ? end : to;
  if (lower > upper) {
    return 0;
  }
  return inclusiveDayCount(lower, upper);
}

/**
 * Leave Report counts calendar days that fall inside both the leave and the selected range.
 * Approved days are leave taken. Pending requests are counted separately.
 * Rejected and cancelled leave are not included in approved days.
 * This report does not recalculate salary.
 */
export async function getLeaveReport({ userId, query, forExport = false }) {
  const { shop, range, employee, pagination } = await prepareReport(userId, query, forExport);
  const leaveType = oneOf(query.leaveType, LEAVE_TYPES, "Leave type");
  const status = oneOf(query.status, LEAVE_STATUSES, "Status");
  const salaryTreatment = oneOf(query.salaryTreatment, SALARY_TREATMENTS, "Salary treatment");

  const leaves = await Leave.find({
    shopId: shop._id,
    startDate: { $lte: range.toDate },
    endDate: { $gte: range.fromDate },
    ...(employee ? { employeeId: employee._id } : {}),
    ...(leaveType ? { leaveType } : {}),
    ...(status ? { status } : {}),
    ...(salaryTreatment ? { salaryTreatment } : {}),
  }).sort({ startDate: -1, createdAt: -1 });

  const people = await Employee.find({
    shopId: shop._id,
    _id: { $in: leaves.map((leave) => leave.employeeId) },
  }).select("name");
  const names = new Map(people.map((person) => [String(person._id), person.name]));

  const rows = leaves
    .map((leave) => {
      const daysInRange = overlapDays(leave, range.from, range.to);
      return {
        leaveId: String(leave._id),
        employeeId: String(leave.employeeId),
        employeeName: names.get(String(leave.employeeId)) || "Employee",
        leaveType: leave.leaveType,
        leaveTypeLabel: TYPE_LABELS[leave.leaveType] || leave.leaveType,
        salaryTreatment: leave.salaryTreatment,
        startDate: keyFromDate(leave.startDate),
        endDate: keyFromDate(leave.endDate),
        daysInRange,
        totalDays: leave.totalDays,
        status: leave.status,
        statusLabel: STATUS_LABELS[leave.status] || leave.status,
      };
    })
    .filter((row) => row.daysInRange > 0);

  assertExportSize(forExport ? rows.length : 0);

  const summary = rows.reduce(
    (totals, row) => {
      if (row.status === "approved") {
        totals.approvedDays += row.daysInRange;
        if (row.leaveType === "paid") totals.paidLeave += row.daysInRange;
        if (row.leaveType === "unpaid") totals.unpaidLeave += row.daysInRange;
        if (row.leaveType === "sick") totals.sickLeave += row.daysInRange;
      }
      if (row.status === "pending") totals.pendingRequests += 1;
      return totals;
    },
    { approvedDays: 0, paidLeave: 0, unpaidLeave: 0, sickLeave: 0, pendingRequests: 0 }
  );

  const paged = forExport
    ? { rows, pagination: { page: 1, limit: rows.length, total: rows.length, pages: rows.length ? 1 : 0 } }
    : pageOf(rows, pagination.page, pagination.limit);
  return {
    shop,
    range,
    generatedAt: new Date(),
    fileKind: "Leave",
    filters: {
      from: range.from,
      to: range.to,
      employeeId: employee ? String(employee._id) : null,
      employeeName: employee?.name || "All employees",
      leaveType: leaveType || "all",
      status: status || "all",
      salaryTreatment: salaryTreatment || "all",
    },
    summary: { hasRecords: rows.length > 0, records: rows.length, ...summary },
    rows: paged.rows,
    pagination: paged.pagination,
  };
}
