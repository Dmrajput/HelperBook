import Attendance from "../../models/Attendance.js";
import Employee from "../../models/Employee.js";
import { ATTENDANCE_STATUSES } from "../../constants/attendance.js";
import { keyFromDate } from "../../utils/attendanceDate.js";
import { assertExportSize, oneOf, pageOf, prepareReport } from "../../validators/report.validator.js";

const STATUS_LABELS = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  leave: "Leave",
};

function statusSums() {
  return {
    present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
    absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
    halfDay: { $sum: { $cond: [{ $eq: ["$status", "half_day"] }, 1, 0] } },
    leave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } },
    records: { $sum: 1 },
  };
}

/**
 * Attendance Report counts stored attendance records only.
 * Unmarked days and weekly offs are not treated as absent.
 * Approved leave that is not stored as an attendance record belongs to the Leave Report.
 */
export async function getAttendanceReport({ userId, query, forExport = false }) {
  const { shop, range, employee, pagination } = await prepareReport(userId, query, forExport);
  const status = oneOf(query.status, ATTENDANCE_STATUSES, "Status");
  const match = {
    shopId: shop._id,
    date: { $gte: range.fromDate, $lte: range.toDate },
    ...(employee ? { employeeId: employee._id } : {}),
    ...(status ? { status } : {}),
  };

  const [totals] = await Attendance.aggregate([{ $match: match }, { $group: { _id: null, ...statusSums() } }]);
  const recordCount = totals?.records || 0;
  if (forExport) {
    assertExportSize(recordCount);
  }

  const grouped = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: "$employeeId", present: statusSums().present, absent: statusSums().absent, halfDay: statusSums().halfDay, leave: statusSums().leave } },
  ]);
  const people = await Employee.find({ shopId: shop._id, _id: { $in: grouped.map((row) => row._id) } }).select("name");
  const names = new Map(people.map((person) => [String(person._id), person.name]));
  const employees = grouped
    .map((row) => ({
      employeeId: String(row._id),
      employeeName: names.get(String(row._id)) || "Employee",
      present: row.present,
      absent: row.absent,
      halfDay: row.halfDay,
      leave: row.leave,
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const dailyQuery = Attendance.find(match).sort({ date: -1, createdAt: -1 }).select("employeeId date status");
  const dailyRecords = forExport ? await dailyQuery : await dailyQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  const daily = dailyRecords.map((record) => ({
    employeeId: String(record.employeeId),
    employeeName: names.get(String(record.employeeId)) || "Employee",
    date: keyFromDate(record.date),
    status: record.status,
    statusLabel: STATUS_LABELS[record.status] || record.status,
  }));

  const paged = pageOf(forExport ? employees : employees, pagination.page, forExport ? employees.length || 1 : pagination.limit);
  const dailyPages = recordCount === 0 ? 0 : Math.ceil(recordCount / pagination.limit);

  return {
    shop,
    range,
    generatedAt: new Date(),
    fileKind: "Attendance",
    filters: {
      from: range.from,
      to: range.to,
      employeeId: employee ? String(employee._id) : null,
      employeeName: employee?.name || "All employees",
      status: status || "all",
    },
    summary: {
      hasRecords: recordCount > 0,
      employees: employees.length,
      records: recordCount,
      present: totals?.present || 0,
      absent: totals?.absent || 0,
      halfDay: totals?.halfDay || 0,
      leave: totals?.leave || 0,
      unmarkedNote: "Days without an attendance record are not counted as absent.",
    },
    rows: forExport ? employees : paged.rows,
    daily,
    pagination: forExport
      ? { page: 1, limit: employees.length, total: employees.length, pages: employees.length ? 1 : 0 }
      : paged.pagination,
    dailyPagination: {
      page: forExport ? 1 : pagination.page,
      limit: forExport ? recordCount : pagination.limit,
      total: recordCount,
      pages: forExport ? (recordCount ? 1 : 0) : dailyPages,
    },
  };
}
