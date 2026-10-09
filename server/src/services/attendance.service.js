import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, keyFromDate, monthBounds, todayKey, weekdayKey } from "../utils/attendanceDate.js";
import {
  approvedEmployeeIdsOnDate,
  approvedLeaveDaysInRange,
  assertNoApprovedLeave,
} from "./leave.service.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const EMPLOYEE_NOT_FOUND = "Employee not found.";
const ATTENDANCE_NOT_FOUND = "Attendance not found.";
const DUPLICATE = "Attendance already exists for this employee and date.";
const BEFORE_JOINING = "Attendance cannot be marked before the employee's joining date.";
const INACTIVE = "This employee is inactive. New attendance cannot be marked.";

const EMPTY_COUNTS = { present: 0, absent: 0, halfDay: 0, leave: 0 };

async function requireShop(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) {
    throw new AppError(SHOP_REQUIRED, 404);
  }
  return shop;
}

function shopTimeZone(shop) {
  return shop.settings?.timezone || "Asia/Kolkata";
}

function isWorkingDay(shop, key) {
  const instant = new Date(`${key}T12:00:00+05:30`);
  const weekday = weekdayKey(instant, shopTimeZone(shop));
  const days = shop.workingSchedule?.workingDays || [];
  return days.includes(weekday);
}

async function findShopEmployee(shopId, employeeId) {
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError(EMPLOYEE_NOT_FOUND, 404);
  }
  const employee = await Employee.findOne({ _id: employeeId, shopId });
  if (!employee) {
    throw new AppError(EMPLOYEE_NOT_FOUND, 404);
  }
  return employee;
}

function joiningKey(employee) {
  return keyFromDate(employee.joiningDate);
}

function assertNotBeforeJoining(employee, key) {
  if (key < joiningKey(employee)) {
    throw new AppError(BEFORE_JOINING, 400);
  }
}

function toPublicRecord(record, employee) {
  return {
    id: String(record._id),
    employeeId: String(record.employeeId),
    employeeName: employee?.name || "",
    role: employee?.role || null,
    customRole: employee?.customRole || null,
    date: keyFromDate(record.date),
    status: record.status,
    notes: record.notes || "",
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
  };
}

function countStatus(summary, status) {
  if (status === "present") summary.present += 1;
  else if (status === "absent") summary.absent += 1;
  else if (status === "half_day") summary.halfDay += 1;
  else if (status === "leave") summary.leave += 1;
}

function emptySummary() {
  return { ...EMPTY_COUNTS };
}

async function createRecord(shop, employee, storedDate, status, notes, userId) {
  try {
    return await Attendance.create({
      shopId: shop._id,
      employeeId: employee._id,
      date: storedDate,
      status,
      notes,
      markedBy: userId,
      updatedBy: null,
    });
  } catch (error) {
    if (Number(error?.code) === 11000) {
      throw new AppError(DUPLICATE, 409);
    }
    throw error;
  }
}

export async function getAttendanceByDate(userId, dateKey) {
  const shop = await requireShop(userId);
  const timeZone = shopTimeZone(shop);
  if (dateKey > todayKey(timeZone)) {
    throw new AppError("Attendance cannot be marked for a future date.", 400);
  }
  const storedDate = dateFromKey(dateKey);
  const [employees, records] = await Promise.all([
    Employee.find({ shopId: shop._id }).select("name role customRole status joiningDate").sort({ name: 1, _id: 1 }).lean(),
    Attendance.find({ shopId: shop._id, date: storedDate }).lean(),
  ]);
  const recordByEmployee = new Map(records.map((record) => [String(record.employeeId), record]));
  const onLeave = await approvedEmployeeIdsOnDate(shop._id, storedDate);
  const visible = employees.filter(
    (employee) =>
      employee.status === "active" ||
      recordByEmployee.has(String(employee._id)) ||
      onLeave.has(String(employee._id))
  );
  const summary = { total: visible.length, ...emptySummary(), notMarked: 0 };

  const rows = visible.map((employee) => {
    const record = recordByEmployee.get(String(employee._id));
    const derivedLeave = !record && onLeave.has(String(employee._id));
    if (record) {
      countStatus(summary, record.status);
    } else if (derivedLeave) {
      countStatus(summary, "leave");
    } else {
      summary.notMarked += 1;
    }
    return {
      employeeId: String(employee._id),
      attendanceId: record ? String(record._id) : null,
      name: employee.name,
      role: employee.role,
      customRole: employee.customRole || null,
      employeeStatus: employee.status,
      joiningDate: keyFromDate(employee.joiningDate),
      status: record ? record.status : derivedLeave ? "leave" : null,
      leaveSource: derivedLeave ? "leave" : record ? "attendance" : null,
      notes: record?.notes || "",
    };
  });

  return {
    date: dateKey,
    shopClosed: !isWorkingDay(shop, dateKey),
    summary,
    employees: rows,
  };
}

export async function markAttendance(userId, payload) {
  const shop = await requireShop(userId);
  const employee = await findShopEmployee(shop._id, payload.employeeId);
  if (employee.status !== "active") {
    throw new AppError(INACTIVE, 400);
  }
  assertNotBeforeJoining(employee, payload.key);
  await assertNoApprovedLeave(shop._id, employee._id, payload.date);
  const existing = await Attendance.findOne({
    shopId: shop._id,
    employeeId: employee._id,
    date: payload.date,
  }).select("_id");
  if (existing) {
    throw new AppError(DUPLICATE, 409);
  }
  const record = await createRecord(shop, employee, payload.date, payload.status, payload.notes, userId);
  return toPublicRecord(record, employee);
}

export async function updateAttendance(userId, attendanceId, payload) {
  const shop = await requireShop(userId);
  if (!mongoose.isValidObjectId(attendanceId)) {
    throw new AppError(ATTENDANCE_NOT_FOUND, 404);
  }
  const record = await Attendance.findOne({ _id: attendanceId, shopId: shop._id });
  if (!record) {
    throw new AppError(ATTENDANCE_NOT_FOUND, 404);
  }
  const employee = await findShopEmployee(shop._id, record.employeeId);
  assertNotBeforeJoining(employee, keyFromDate(record.date));
  await assertNoApprovedLeave(shop._id, employee._id, record.date);
  record.status = payload.status;
  record.notes = payload.notes;
  record.updatedBy = userId;
  await record.save();
  return toPublicRecord(record, employee);
}

export async function bulkMarkAttendance(userId, payload) {
  const shop = await requireShop(userId);
  const employeeIds = payload.records.map((record) => record.employeeId);
  const [employees, existingRecords] = await Promise.all([
    Employee.find({ shopId: shop._id, _id: { $in: employeeIds } }),
    Attendance.find({ shopId: shop._id, employeeId: { $in: employeeIds }, date: payload.date }),
  ]);
  const employeesById = new Map(employees.map((employee) => [String(employee._id), employee]));
  const existingByEmployee = new Map(existingRecords.map((record) => [String(record.employeeId), record]));
  const onLeave = await approvedEmployeeIdsOnDate(shop._id, payload.date);
  const result = { created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  for (const record of payload.records) {
    const employee = employeesById.get(record.employeeId);
    if (!employee) {
      result.failed += 1;
      result.errors.push({ employeeId: record.employeeId, message: EMPLOYEE_NOT_FOUND });
      continue;
    }
    if (payload.key < joiningKey(employee)) {
      result.failed += 1;
      result.errors.push({ employeeId: record.employeeId, message: BEFORE_JOINING });
      continue;
    }
    if (onLeave.has(record.employeeId)) {
      result.failed += 1;
      result.errors.push({
        employeeId: record.employeeId,
        message: "This employee has approved leave on this date. Cancel the leave before marking attendance.",
      });
      continue;
    }
    const existing = existingByEmployee.get(record.employeeId);
    if (!existing && employee.status !== "active") {
      result.failed += 1;
      result.errors.push({ employeeId: record.employeeId, message: INACTIVE });
      continue;
    }
    if (existing && !payload.overwriteExisting) {
      result.skipped += 1;
      continue;
    }
    if (existing) {
      existing.status = record.status;
      existing.notes = record.notes;
      existing.updatedBy = userId;
      await existing.save();
      result.updated += 1;
      continue;
    }
    try {
      const created = await createRecord(shop, employee, payload.date, record.status, record.notes, userId);
      existingByEmployee.set(record.employeeId, created);
      result.created += 1;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 409 && payload.overwriteExisting) {
        const raced = await Attendance.findOne({
          shopId: shop._id,
          employeeId: employee._id,
          date: payload.date,
        });
        if (raced) {
          raced.status = record.status;
          raced.notes = record.notes;
          raced.updatedBy = userId;
          await raced.save();
          result.updated += 1;
          continue;
        }
      }
      result.failed += 1;
      result.errors.push({
        employeeId: record.employeeId,
        message: error instanceof AppError ? error.message : "Attendance could not be saved.",
      });
    }
  }

  return result;
}

export async function getMonthlyAttendance(userId, year, month, employeeId) {
  const shop = await requireShop(userId);
  let employee = null;
  if (employeeId) {
    employee = await findShopEmployee(shop._id, employeeId);
  }
  const { start, end } = monthBounds(year, month);
  const match = { shopId: shop._id, date: { $gte: start, $lt: end } };
  if (employee) {
    match.employeeId = employee._id;
  }
  const rows = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: { date: "$date", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);
  const summary = emptySummary();
  const days = new Map();
  for (const row of rows) {
    const date = keyFromDate(row._id.date);
    const day = days.get(date) || { date, ...emptySummary(), status: null };
    const status = row._id.status;
    const field = status === "half_day" ? "halfDay" : status;
    day[field] += row.count;
    summary[field] += row.count;
    if (employee) {
      day.status = status;
    }
    days.set(date, day);
  }

  const coverage = await approvedLeaveDaysInRange(shop._id, {
    employeeId: employee?._id,
    start,
    endExclusive: end,
  });
  const explicitKeys = new Set(
    (
      await Attendance.find(match).select("employeeId date").lean()
    ).map((record) => `${String(record.employeeId)}|${keyFromDate(record.date)}`)
  );
  for (const item of coverage) {
    if (explicitKeys.has(`${item.employeeId}|${item.date}`)) continue;
    const day = days.get(item.date) || { date: item.date, ...emptySummary(), status: null };
    day.leave += 1;
    summary.leave += 1;
    if (employee) day.status = "leave";
    days.set(item.date, day);
  }

  return {
    year,
    month,
    employee: employee ? { id: String(employee._id), name: employee.name } : null,
    summary,
    days: [...days.values()].sort((left, right) => left.date.localeCompare(right.date)),
  };
}

export async function getEmployeeAttendance(userId, employeeId, query) {
  const shop = await requireShop(userId);
  const employee = await findShopEmployee(shop._id, employeeId);
  const filter = {
    shopId: shop._id,
    employeeId: employee._id,
    date: { $gte: query.start, $lte: query.end },
  };
  if (query.status) {
    filter.status = query.status;
  }
  const skip = (query.page - 1) * query.limit;
  const [records, total, grouped] = await Promise.all([
    Attendance.find(filter).sort({ date: -1, _id: -1 }).skip(skip).limit(query.limit),
    Attendance.countDocuments(filter),
    Attendance.aggregate([{ $match: filter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const summary = emptySummary();
  for (const row of grouped) {
    for (let index = 0; index < row.count; index += 1) {
      countStatus(summary, row._id);
    }
  }
  return {
    employee: { id: String(employee._id), name: employee.name, status: employee.status },
    summary,
    records: records.map((record) => toPublicRecord(record, employee)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getAttendanceHistory(userId, query) {
  const shop = await requireShop(userId);
  if (query.employeeId) {
    await findShopEmployee(shop._id, query.employeeId);
  }
  const match = {
    shopId: shop._id,
    date: { $gte: query.start, $lte: query.end },
  };
  if (query.employeeId) {
    match.employeeId = new mongoose.Types.ObjectId(query.employeeId);
  }
  if (query.status) {
    match.status = query.status;
  }
  const grouped = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$date",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        halfDay: { $sum: { $cond: [{ $eq: ["$status", "half_day"] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } },
      },
    },
    { $sort: { _id: -1 } },
  ]);
  const total = grouped.length;
  const start = (query.page - 1) * query.limit;
  const days = grouped.slice(start, start + query.limit).map((day) => ({
    date: keyFromDate(day._id),
    total: day.total,
    present: day.present,
    absent: day.absent,
    halfDay: day.halfDay,
    leave: day.leave,
  }));
  return {
    days,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}
