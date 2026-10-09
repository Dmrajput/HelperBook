import mongoose from "mongoose";
import { DEFAULT_SICK_LEAVE_TREATMENT, LEAVE_MAX_DAYS } from "../constants/leave.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import SalaryRecord from "../models/SalaryRecord.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, keyFromDate, todayKey, weekdayKey } from "../utils/attendanceDate.js";
import { runInTransaction } from "../utils/mongoTransaction.js";
import { notifySafely } from "./notification.service.js";
import { onLeaveApproved, onLeaveCancelled, onLeaveRejected, onLeaveSubmitted } from "./notificationEvent.service.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const EMPLOYEE_NOT_FOUND = "Employee not found.";
const LEAVE_NOT_FOUND = "Leave could not be found.";
const INACTIVE = "Employee is inactive. New leave cannot be recorded.";
const BEFORE_JOINING = "Leave cannot start before the employee's joining date.";
const PAST_REQUEST = "Leave cannot start in the past. Use Record Leave for a past date.";
const CONFIRM_PAST = "Confirm that you are recording historical leave.";
const OVERLAP_APPROVED = "This employee already has approved leave during this period.";
const OVERLAP_PENDING = "This employee already has leave during the selected dates.";
const ATTENDANCE_BLOCK = "This employee has approved leave on this date. Cancel the leave before marking attendance.";
const ATTENDANCE_CONFLICT = "Attendance is already marked for one or more leave dates. Please review the attendance conflict.";
const CANCEL_ATTENDANCE = "Attendance exists for this date. Please review attendance after cancelling the leave.";
const RANGE_TOO_LONG = `Leave cannot cover more than ${LEAVE_MAX_DAYS} days.`;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_LABEL = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  leave: "Leave",
};

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

async function findOwnedEmployee(shopId, employeeId) {
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError(EMPLOYEE_NOT_FOUND, 404);
  }
  const employee = await Employee.findOne({ _id: employeeId, shopId });
  if (!employee) {
    throw new AppError(EMPLOYEE_NOT_FOUND, 404);
  }
  return employee;
}

export function sickLeaveTreatment(shop) {
  return shop?.settings?.leaveSettings?.sickLeaveTreatment === "paid" ? "paid" : DEFAULT_SICK_LEAVE_TREATMENT;
}

function treatmentFor(leaveType, shop) {
  if (leaveType === "paid") return "paid";
  if (leaveType === "unpaid") return "unpaid";
  return sickLeaveTreatment(shop);
}

export function eachCalendarKey(startKey, endKey) {
  if (!startKey || !endKey || startKey > endKey) return [];
  const keys = [];
  let cursor = startKey;
  while (cursor <= endKey) {
    keys.push(cursor);
    if (keys.length > LEAVE_MAX_DAYS) {
      throw new AppError(RANGE_TOO_LONG, 400);
    }
    const [year, month, day] = cursor.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    cursor = next.toISOString().slice(0, 10);
  }
  return keys;
}

function inclusiveDays(startKey, endKey) {
  return eachCalendarKey(startKey, endKey).length;
}

function isWorkingDay(shop, key) {
  const weekday = weekdayKey(new Date(`${key}T12:00:00+05:30`), shop.settings?.timezone || "Asia/Kolkata");
  return (shop.workingSchedule?.workingDays || []).includes(weekday);
}

function toPublicLeave(leave, employee) {
  return {
    id: String(leave._id),
    employeeId: String(leave.employeeId),
    employeeName: employee?.name || "",
    leaveType: leave.leaveType,
    salaryTreatment: leave.salaryTreatment,
    startDate: keyFromDate(leave.startDate),
    endDate: keyFromDate(leave.endDate),
    totalDays: leave.totalDays,
    reason: leave.reason || "",
    status: leave.status,
    rejectionReason: leave.rejectionReason || "",
    notes: leave.notes || "",
    requestedBy: leave.requestedBy ? String(leave.requestedBy) : null,
    reviewedBy: leave.reviewedBy ? String(leave.reviewedBy) : null,
    reviewedAt: leave.reviewedAt ? new Date(leave.reviewedAt).toISOString() : null,
    cancelledBy: leave.cancelledBy ? String(leave.cancelledBy) : null,
    cancelledAt: leave.cancelledAt ? new Date(leave.cancelledAt).toISOString() : null,
    createdAt: new Date(leave.createdAt).toISOString(),
    updatedAt: new Date(leave.updatedAt).toISOString(),
  };
}

async function employeeMap(shopId, ids) {
  const employees = await Employee.find({ shopId, _id: { $in: ids } }).select("name status").lean();
  return new Map(employees.map((employee) => [String(employee._id), employee]));
}

async function assertNoOverlap(shopId, employeeId, startDate, endDate, exceptId) {
  const filter = {
    shopId,
    employeeId,
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
  if (exceptId) {
    filter._id = { $ne: exceptId };
  }
  const existing = await Leave.findOne(filter).select("status").lean();
  if (!existing) return;
  throw new AppError(existing.status === "approved" ? OVERLAP_APPROVED : OVERLAP_PENDING, 409);
}

async function attendanceConflicts(shopId, employeeId, startKey, endKey) {
  const records = await Attendance.find({
    shopId,
    employeeId,
    date: { $gte: dateFromKey(startKey), $lte: dateFromKey(endKey) },
    status: { $in: ["present", "absent", "half_day"] },
  })
    .select("date status")
    .lean();
  return records.map((record) => ({
    date: keyFromDate(record.date),
    status: record.status,
  }));
}

function conflictMessage(employeeName, conflicts) {
  if (conflicts.length === 1) {
    const conflict = conflicts[0];
    return `Attendance is already marked ${STATUS_LABEL[conflict.status] || conflict.status} for ${employeeName} on ${conflict.date}.`;
  }
  return ATTENDANCE_CONFLICT;
}

async function finalizedSalaryWarning(shopId, employeeId, startKey, endKey) {
  const months = [];
  const seen = new Set();
  for (const key of eachCalendarKey(startKey, endKey)) {
    const [year, month] = key.split("-").map(Number);
    const id = `${year}-${month}`;
    if (seen.has(id)) continue;
    seen.add(id);
    months.push({ year, month });
  }
  if (!months.length) return "";
  const records = await SalaryRecord.find({
    shopId,
    employeeId,
    status: "finalized",
    $or: months,
  })
    .select("year month")
    .lean();
  if (!records.length) return "";
  const names = [...new Set(records.map((record) => `${MONTHS[record.month - 1]} ${record.year}`))];
  const label = names.length === 1 ? names[0] : names.slice(0, 2).join(" and ");
  const message = `This leave affects a finalized salary for ${label}. The salary will not change automatically. Reopen and recalculate the salary if required.`;
  if (message.length <= 180) return message;
  return "This leave affects a finalized salary. Reopen and recalculate the salary if required.";
}

async function resolveConflicts(shopId, employeeId, startKey, endKey, userId, session) {
  const query = Attendance.updateMany(
    {
      shopId,
      employeeId,
      date: { $gte: dateFromKey(startKey), $lte: dateFromKey(endKey) },
      status: { $in: ["present", "absent", "half_day"] },
    },
    { $set: { status: "leave", updatedBy: userId } }
  );
  if (session) query.session(session);
  await query;
}

function prepareInput(employee, shop, input) {
  if (employee.status !== "active") {
    throw new AppError(INACTIVE, 400);
  }
  const joining = keyFromDate(employee.joiningDate);
  if (input.startKey < joining) {
    throw new AppError(BEFORE_JOINING, 400);
  }
  const totalDays = inclusiveDays(input.startKey, input.endKey);
  if (!input.historical && input.startKey < input.today) {
    throw new AppError(PAST_REQUEST, 400);
  }
  if (input.historical && input.startKey < input.today && !input.confirmHistorical) {
    throw new AppError(CONFIRM_PAST, 400);
  }
  return {
    totalDays,
    salaryTreatment: treatmentFor(input.leaveType, shop),
  };
}

async function createLeaveRecord(userId, input, status) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, input.employeeId);
  const prepared = prepareInput(employee, shop, input);
  await assertNoOverlap(shop._id, employee._id, input.startDate, input.endDate);
  if (status === "approved") {
    const conflicts = await attendanceConflicts(shop._id, employee._id, input.startKey, input.endKey);
    if (conflicts.length && !input.resolveAttendance) {
      throw new AppError(conflictMessage(employee.name, conflicts), 409);
    }
  }

  const leave = await runInTransaction(async (session) => {
    if (status === "approved" && input.resolveAttendance) {
      await resolveConflicts(shop._id, employee._id, input.startKey, input.endKey, userId, session);
    }
    const [created] = await Leave.create(
      [
        {
          shopId: shop._id,
          employeeId: employee._id,
          leaveType: input.leaveType,
          salaryTreatment: prepared.salaryTreatment,
          startDate: input.startDate,
          endDate: input.endDate,
          totalDays: prepared.totalDays,
          reason: input.reason,
          notes: input.notes,
          status,
          requestedBy: userId,
          reviewedBy: status === "approved" ? userId : null,
          reviewedAt: status === "approved" ? new Date() : null,
        },
      ],
      session ? { session } : undefined
    );
    return created;
  });

  const salaryWarning = status === "approved"
    ? await finalizedSalaryWarning(shop._id, employee._id, input.startKey, input.endKey)
    : "";
  await notifySafely(() =>
    status === "approved"
      ? onLeaveApproved({ shop, leave, employeeName: employee.name, startKey: input.startKey, endKey: input.endKey })
      : onLeaveSubmitted({ shop, leave, employeeName: employee.name, startKey: input.startKey, endKey: input.endKey })
  );
  return {
    leave: toPublicLeave(leave, employee),
    salaryWarning,
  };
}

export async function createLeave(userId, input) {
  return createLeaveRecord(userId, input, "pending");
}

export async function recordLeave(userId, input) {
  return createLeaveRecord(userId, input, "approved");
}

async function findLeave(shopId, leaveId) {
  if (!mongoose.isValidObjectId(leaveId)) {
    throw new AppError(LEAVE_NOT_FOUND, 404);
  }
  const leave = await Leave.findOne({ _id: leaveId, shopId });
  if (!leave) {
    throw new AppError(LEAVE_NOT_FOUND, 404);
  }
  return leave;
}

export async function approveLeave(userId, leaveId, { resolveAttendance }) {
  const shop = await requireShop(userId);
  const leave = await findLeave(shop._id, leaveId);
  if (leave.status !== "pending") {
    throw new AppError("Only a pending leave request can be approved.", 409);
  }
  const employee = await findOwnedEmployee(shop._id, leave.employeeId);
  const startKey = keyFromDate(leave.startDate);
  const endKey = keyFromDate(leave.endDate);
  await assertNoOverlap(shop._id, employee._id, leave.startDate, leave.endDate, leave._id);
  const conflicts = await attendanceConflicts(shop._id, employee._id, startKey, endKey);
  if (conflicts.length && !resolveAttendance) {
    throw new AppError(conflictMessage(employee.name, conflicts), 409);
  }

  await runInTransaction(async (session) => {
    const current = session ? await Leave.findOne({ _id: leave._id, shopId: shop._id }).session(session) : leave;
    if (!current || current.status !== "pending") {
      throw new AppError("Only a pending leave request can be approved.", 409);
    }
    if (resolveAttendance) {
      await resolveConflicts(shop._id, employee._id, startKey, endKey, userId, session);
    }
    current.status = "approved";
    current.reviewedBy = userId;
    current.reviewedAt = new Date();
    await current.save(session ? { session } : undefined);
  });

  const fresh = await Leave.findOne({ _id: leave._id, shopId: shop._id });
  await notifySafely(() => onLeaveApproved({ shop, leave: fresh, employeeName: employee.name, startKey, endKey }));
  return {
    leave: toPublicLeave(fresh, employee),
    salaryWarning: await finalizedSalaryWarning(shop._id, employee._id, startKey, endKey),
  };
}

export async function rejectLeave(userId, leaveId, { reason }) {
  const shop = await requireShop(userId);
  const leave = await findLeave(shop._id, leaveId);
  if (leave.status !== "pending") {
    throw new AppError("Only a pending leave request can be rejected.", 409);
  }
  const employee = await findOwnedEmployee(shop._id, leave.employeeId);
  leave.status = "rejected";
  leave.rejectionReason = reason;
  leave.reviewedBy = userId;
  leave.reviewedAt = new Date();
  await leave.save();
  await notifySafely(() =>
    onLeaveRejected({ shop, leave, employeeName: employee.name, reason: leave.rejectionReason })
  );
  return { leave: toPublicLeave(leave, employee) };
}

export async function cancelLeave(userId, leaveId) {
  const shop = await requireShop(userId);
  const leave = await findLeave(shop._id, leaveId);
  if (leave.status === "rejected") {
    throw new AppError("A rejected leave cannot be cancelled.", 409);
  }
  if (leave.status === "cancelled") {
    throw new AppError("This leave is already cancelled.", 409);
  }
  if (leave.status !== "pending" && leave.status !== "approved") {
    throw new AppError("This leave can no longer be changed.", 409);
  }
  const employee = await findOwnedEmployee(shop._id, leave.employeeId);
  const wasApproved = leave.status === "approved";
  leave.status = "cancelled";
  leave.cancelledBy = userId;
  leave.cancelledAt = new Date();
  await leave.save();
  let attendanceWarning = "";
  if (wasApproved) {
    const marked = await Attendance.countDocuments({
      shopId: shop._id,
      employeeId: employee._id,
      date: { $gte: leave.startDate, $lte: leave.endDate },
    });
    if (marked > 0) attendanceWarning = CANCEL_ATTENDANCE;
  }
  await notifySafely(() =>
    onLeaveCancelled({
      shop,
      leave,
      employeeName: employee.name,
      startKey: keyFromDate(leave.startDate),
      endKey: keyFromDate(leave.endDate),
    })
  );
  return { leave: toPublicLeave(leave, employee), attendanceWarning };
}

function listFilter(shopId, query) {
  const filter = { shopId };
  if (query.employeeId) filter.employeeId = query.employeeId;
  if (query.status) filter.status = query.status;
  if (query.leaveType) filter.leaveType = query.leaveType;
  if (query.startDate || query.endDate) {
    filter.startDate = {};
    filter.endDate = {};
    if (query.endDate) filter.startDate.$lte = dateFromKey(query.endDate);
    if (query.startDate) filter.endDate.$gte = dateFromKey(query.startDate);
    if (!Object.keys(filter.startDate).length) delete filter.startDate;
    if (!Object.keys(filter.endDate).length) delete filter.endDate;
  }
  return filter;
}

async function pageLeaves(shopId, query) {
  const filter = listFilter(shopId, query);
  const skip = (query.page - 1) * query.limit;
  const [leaves, total] = await Promise.all([
    Leave.find(filter).sort({ startDate: -1, createdAt: -1 }).skip(skip).limit(query.limit),
    Leave.countDocuments(filter),
  ]);
  const names = await employeeMap(shopId, leaves.map((leave) => leave.employeeId));
  return {
    leaves: leaves.map((leave) => toPublicLeave(leave, names.get(String(leave.employeeId)))),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
  };
}

async function monthSummary(shopId) {
  const today = todayKey();
  const startDate = dateFromKey(`${today.slice(0, 8)}01`);
  const [year, month] = today.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = dateFromKey(`${today.slice(0, 8)}${String(last).padStart(2, "0")}`);
  const [pendingRequests, approved] = await Promise.all([
    Leave.countDocuments({ shopId, status: "pending" }),
    Leave.find({
      shopId,
      status: "approved",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).select("leaveType totalDays startDate endDate"),
  ]);
  const monthStart = keyFromDate(startDate);
  const monthEnd = keyFromDate(endDate);
  const totals = { paidDays: 0, unpaidDays: 0, sickDays: 0, approvedDays: 0 };
  for (const leave of approved) {
    const overlapStart = keyFromDate(leave.startDate) > monthStart ? keyFromDate(leave.startDate) : monthStart;
    const overlapEnd = keyFromDate(leave.endDate) < monthEnd ? keyFromDate(leave.endDate) : monthEnd;
    const days = inclusiveDays(overlapStart, overlapEnd);
    totals.approvedDays += days;
    if (leave.leaveType === "paid") totals.paidDays += days;
    else if (leave.leaveType === "unpaid") totals.unpaidDays += days;
    else totals.sickDays += days;
  }
  return { pendingRequests, ...totals };
}

export async function listLeaves(userId, query) {
  const shop = await requireShop(userId);
  if (query.employeeId) await findOwnedEmployee(shop._id, query.employeeId);
  const page = await pageLeaves(shop._id, query);
  return { summary: await monthSummary(shop._id), ...page };
}

export async function getLeaveHistory(userId, query) {
  const shop = await requireShop(userId);
  if (query.employeeId) await findOwnedEmployee(shop._id, query.employeeId);
  return pageLeaves(shop._id, query);
}

function emptyTypeDays() {
  return { paidDays: 0, unpaidDays: 0, sickDays: 0 };
}

export async function getEmployeeLeaves(userId, employeeId, query) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  const counts = await Leave.aggregate([
    { $match: { shopId: shop._id, employeeId: employee._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const summary = { total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0, ...emptyTypeDays() };
  for (const row of counts) {
    if (summary[row._id] !== undefined) summary[row._id] = row.count;
    summary.total += row.count;
  }
  const approved = await Leave.find({ shopId: shop._id, employeeId: employee._id, status: "approved" }).select(
    "leaveType totalDays"
  );
  for (const leave of approved) {
    if (leave.leaveType === "paid") summary.paidDays += leave.totalDays;
    else if (leave.leaveType === "unpaid") summary.unpaidDays += leave.totalDays;
    else summary.sickDays += leave.totalDays;
  }
  const page = await pageLeaves(shop._id, { ...query, employeeId: String(employee._id) });
  return {
    employee: { id: String(employee._id), name: employee.name, status: employee.status },
    summary,
    ...page,
  };
}

export async function getLeave(userId, leaveId) {
  const shop = await requireShop(userId);
  const leave = await findLeave(shop._id, leaveId);
  const employee = await findOwnedEmployee(shop._id, leave.employeeId);
  return { leave: toPublicLeave(leave, employee) };
}

export async function countPendingLeaves(shopId) {
  return Leave.countDocuments({ shopId, status: "pending" });
}

export async function approvedEmployeeIdsOnDate(shopId, date) {
  const leaves = await Leave.find({
    shopId,
    status: "approved",
    startDate: { $lte: date },
    endDate: { $gte: date },
  })
    .select("employeeId")
    .lean();
  return new Set(leaves.map((leave) => String(leave.employeeId)));
}

export async function assertNoApprovedLeave(shopId, employeeId, date) {
  const blocked = await approvedEmployeeIdsOnDate(shopId, date);
  if (blocked.has(String(employeeId))) {
    throw new AppError(ATTENDANCE_BLOCK, 409);
  }
}

export async function approvedCoverage(shopId, employeeId, startKey, endKey) {
  if (!startKey || !endKey || startKey > endKey) return new Map();
  const leaves = await Leave.find({
    shopId,
    employeeId,
    status: "approved",
    startDate: { $lte: dateFromKey(endKey) },
    endDate: { $gte: dateFromKey(startKey) },
  })
    .select("leaveType salaryTreatment startDate endDate")
    .lean();
  const covered = new Map();
  for (const leave of leaves) {
    const from = keyFromDate(leave.startDate) > startKey ? keyFromDate(leave.startDate) : startKey;
    const to = keyFromDate(leave.endDate) < endKey ? keyFromDate(leave.endDate) : endKey;
    for (const key of eachCalendarKey(from, to)) {
      if (!covered.has(key)) {
        covered.set(key, { leaveType: leave.leaveType, salaryTreatment: leave.salaryTreatment });
      }
    }
  }
  return covered;
}

export function workingLeaveDays(shop, covered, skippedKeys) {
  let paidWorkingDays = 0;
  let unpaidWorkingDays = 0;
  for (const [key, info] of covered) {
    if (skippedKeys?.has(key) || !isWorkingDay(shop, key)) continue;
    if (info.salaryTreatment === "paid") paidWorkingDays += 1;
    else unpaidWorkingDays += 1;
  }
  return { paidWorkingDays, unpaidWorkingDays };
}

export async function approvedLeaveDaysInRange(shopId, { employeeId, start, endExclusive }) {
  const filter = {
    shopId,
    status: "approved",
    startDate: { $lt: endExclusive },
    endDate: { $gte: start },
  };
  if (employeeId) filter.employeeId = employeeId;
  const leaves = await Leave.find(filter).select("employeeId startDate endDate").lean();
  const startKey = keyFromDate(start);
  const endKey = keyFromDate(new Date(endExclusive.getTime() - 86400000));
  const rows = [];
  for (const leave of leaves) {
    const from = keyFromDate(leave.startDate) > startKey ? keyFromDate(leave.startDate) : startKey;
    const to = keyFromDate(leave.endDate) < endKey ? keyFromDate(leave.endDate) : endKey;
    if (from > to) continue;
    for (const date of eachCalendarKey(from, to)) {
      rows.push({ employeeId: String(leave.employeeId), date });
    }
  }
  return rows;
}

export async function createEmployeeLeaveRequest(employee, shop, input) {
  const prepared = prepareInput(employee, shop, input);
  try {
    await assertNoOverlap(shop._id, employee._id, input.startDate, input.endDate);
  } catch (error) {
    if (error?.statusCode === 409) {
      throw new AppError("You already have a leave request for these dates.", 409);
    }
    throw error;
  }
  const leave = await Leave.create({
    shopId: shop._id,
    employeeId: employee._id,
    leaveType: input.leaveType,
    salaryTreatment: prepared.salaryTreatment,
    startDate: input.startDate,
    endDate: input.endDate,
    totalDays: prepared.totalDays,
    reason: input.reason || "",
    notes: "",
    status: "pending",
    requestedBy: null,
  });
  await notifySafely(() =>
    onLeaveSubmitted({
      shop,
      leave,
      employeeName: employee.name,
      startKey: input.startKey,
      endKey: input.endKey,
    })
  );
  return { leave: toPublicLeave(leave, employee) };
}

export async function cancelEmployeeLeaveRequest(employee, shop, leaveId) {
  if (!mongoose.isValidObjectId(leaveId)) {
    throw new AppError("You don't have access to this leave.", 404, true, { code: "LEAVE_ACCESS_DENIED" });
  }
  const leave = await Leave.findOne({ _id: leaveId, shopId: shop._id, employeeId: employee._id });
  if (!leave) {
    throw new AppError("You don't have access to this leave.", 404, true, { code: "LEAVE_ACCESS_DENIED" });
  }
  if (leave.status === "rejected") throw new AppError("A rejected leave cannot be cancelled.", 409);
  if (leave.status === "cancelled") throw new AppError("This leave is already cancelled.", 409);
  if (leave.status !== "pending" && leave.status !== "approved") {
    throw new AppError("This leave can no longer be changed.", 409);
  }
  const wasApproved = leave.status === "approved";
  leave.status = "cancelled";
  leave.cancelledAt = new Date();
  await leave.save();
  let attendanceWarning = "";
  if (wasApproved) {
    const marked = await Attendance.countDocuments({
      shopId: shop._id,
      employeeId: employee._id,
      date: { $gte: leave.startDate, $lte: leave.endDate },
    });
    if (marked > 0) attendanceWarning = CANCEL_ATTENDANCE;
  }
  await notifySafely(() =>
    onLeaveCancelled({
      shop,
      leave,
      employeeName: employee.name,
      startKey: keyFromDate(leave.startDate),
      endKey: keyFromDate(leave.endDate),
    })
  );
  return { leave: toPublicLeave(leave, employee), attendanceWarning };
}
