import mongoose from "mongoose";
import AdvanceTransaction from "../models/AdvanceTransaction.js";
import Attendance from "../models/Attendance.js";
import EmployeeAdvance from "../models/EmployeeAdvance.js";
import Leave from "../models/Leave.js";
import Notification from "../models/Notification.js";
import SalaryPayment from "../models/SalaryPayment.js";
import SalaryRecord from "../models/SalaryRecord.js";
import Shop from "../models/Shop.js";
import { getAdvanceBalance } from "./advance.service.js";
import { dateFromKey, monthBounds, currentMonth, keyFromDate, todayKey } from "../utils/attendanceDate.js";
import { AppError } from "../utils/appError.js";
import { assertNoApprovedLeave, cancelEmployeeLeaveRequest, createEmployeeLeaveRequest } from "./leave.service.js";
import { getEmployeeSalaryReceipt, getEmployeeSalaryReceiptPdf } from "./salaryReceipt.service.js";
import {
  employeeNotificationPreferences,
  listEmployeeNotifications,
  markAllEmployeeNotificationsRead,
  markEmployeeNotificationRead,
  registerEmployeePushToken,
  removeEmployeePushToken,
  updateEmployeeNotificationPreferences,
} from "./notification.service.js";

const DENIED = "You don't have access to this information.";

function pageQuery(query) {
  const page = Math.max(1, Number(query?.page) || 1);
  let limit = Number(query?.limit) || 20;
  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  return { page, limit, skip: (page - 1) * limit };
}

function parseMonth(value) {
  if (!value) return currentMonth();
  const match = /^(\d{4})-(\d{2})$/.exec(String(value));
  if (!match) throw new AppError("Please select a valid month.", 400);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    throw new AppError("Please select a valid month.", 400);
  }
  return { year, month };
}

async function shopFor(employee) {
  const shop = await Shop.findOne({ _id: employee.shopId, isActive: true });
  if (!shop || shop.accessSuspended) throw new AppError(DENIED, 403, true, { code: "EMPLOYEE_ACCESS_DENIED" });
  return shop;
}

function salaryView(record, payment) {
  const calculation = record.calculation || {};
  const paid = record.paymentStatus === "paid" && payment?.status === "paid";
  return {
    id: String(record._id),
    year: record.year,
    month: record.month,
    finalSalary: calculation.netSalary || 0,
    paymentStatus: paid ? "paid" : "unpaid",
    paidOn: paid ? keyFromDate(payment.paymentDate) : null,
    paymentMethod: paid ? payment.paymentMethod : null,
    calculation: {
      baseSalary: calculation.baseSalary || 0,
      bonus: calculation.bonus || 0,
      deduction: calculation.deduction || 0,
      advanceDeduction: calculation.advanceDeduction || 0,
      attendanceDeduction: calculation.attendanceDeduction || 0,
      leaveDeduction: calculation.leaveDeduction || 0,
      netSalary: calculation.netSalary || 0,
    },
    receiptAvailable: paid,
  };
}

function transactionView(transaction) {
  return {
    id: String(transaction._id),
    type: transaction.type,
    amount: transaction.amount,
    signedAmount: transaction.signedAmount,
    date: keyFromDate(transaction.date),
    notes: transaction.notes || "",
  };
}

export async function getProfile(employee) {
  const shop = await shopFor(employee);
  return {
    employee: {
      id: String(employee._id),
      name: employee.name,
      phone: employee.phone || null,
      role: employee.role,
      customRole: employee.customRole || null,
      joiningDate: employee.joiningDate,
      status: employee.status,
      lastLoginAt: employee.lastLoginAt,
      salary: employee.salary
        ? {
            type: employee.salary.type,
            amount: employee.salary.amount,
            currency: employee.salary.currency || "INR",
          }
        : null,
    },
    shop: { id: String(shop._id), name: shop.name, logo: shop.logo || null },
  };
}

export async function getAttendance(employee, monthValue) {
  const { year, month } = parseMonth(monthValue);
  const { start, end } = monthBounds(year, month);
  const records = await Attendance.find({
    shopId: employee.shopId,
    employeeId: employee._id,
    date: { $gte: start, $lt: end },
  })
    .select("date status")
    .sort({ date: 1 })
    .lean();
  const summary = { present: 0, absent: 0, halfDay: 0, leave: 0 };
  const days = records.map((record) => {
    const status = record.status;
    if (status === "present") summary.present += 1;
    else if (status === "absent") summary.absent += 1;
    else if (status === "half_day") summary.halfDay += 1;
    else if (status === "leave") summary.leave += 1;
    return { date: keyFromDate(record.date), status };
  });
  const marked = new Set(days.map((day) => day.date));
  const leaves = await Leave.find({
    shopId: employee.shopId,
    employeeId: employee._id,
    status: "approved",
    startDate: { $lt: end },
    endDate: { $gte: start },
  })
    .select("startDate endDate")
    .lean();
  for (const leave of leaves) {
    const from = new Date(Math.max(leave.startDate.getTime(), start.getTime()));
    const to = new Date(Math.min(leave.endDate.getTime(), end.getTime() - 86400000));
    for (let cursor = from.getTime(); cursor <= to.getTime(); cursor += 86400000) {
      const date = keyFromDate(new Date(cursor));
      if (marked.has(date)) continue;
      marked.add(date);
      summary.leave += 1;
      days.push({ date, status: "leave" });
    }
  }
  days.sort((left, right) => left.date.localeCompare(right.date));
  return { month: `${year}-${String(month).padStart(2, "0")}`, summary, records: days };
}

export async function getAttendanceSummary(employee, monthValue) {
  const attendance = await getAttendance(employee, monthValue);
  return { month: attendance.month, summary: attendance.summary };
}

async function latestPayment(employee, salaryId) {
  return SalaryPayment.findOne({ shopId: employee.shopId, employeeId: employee._id, salaryId, status: "paid" });
}

export async function getSalaryList(employee, query) {
  const { page, limit, skip } = pageQuery(query);
  const filter = { shopId: employee.shopId, employeeId: employee._id, status: "finalized" };
  const [rows, total] = await Promise.all([
    SalaryRecord.find(filter).sort({ year: -1, month: -1 }).skip(skip).limit(limit),
    SalaryRecord.countDocuments(filter),
  ]);
  const salaries = [];
  for (const record of rows) {
    const payment = record.paymentStatus === "paid" ? await latestPayment(employee, record._id) : null;
    salaries.push(salaryView(record, payment));
  }
  return { salaries, page, limit, total };
}

export async function getSalaryDetail(employee, salaryId) {
  if (!mongoose.isValidObjectId(salaryId)) {
    throw new AppError(DENIED, 404, true, { code: "SALARY_ACCESS_DENIED" });
  }
  const record = await SalaryRecord.findOne({
    _id: salaryId,
    shopId: employee.shopId,
    employeeId: employee._id,
    status: "finalized",
  });
  if (!record) throw new AppError(DENIED, 404, true, { code: "SALARY_ACCESS_DENIED" });
  const payment = record.paymentStatus === "paid" ? await latestPayment(employee, record._id) : null;
  return { salary: salaryView(record, payment) };
}

export async function getAdvanceSummary(employee) {
  const outstanding = await getAdvanceBalance(employee._id, employee.shopId);
  const [given, repaid, deducted] = await Promise.all([
    AdvanceTransaction.aggregate([
      { $match: { shopId: employee.shopId, employeeId: employee._id, type: "advance", reversed: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    AdvanceTransaction.aggregate([
      { $match: { shopId: employee.shopId, employeeId: employee._id, type: "repayment", reversed: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    AdvanceTransaction.aggregate([
      { $match: { shopId: employee.shopId, employeeId: employee._id, type: "salary_deduction", reversed: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  return {
    outstanding,
    totalAdvances: given[0]?.total || 0,
    repayments: repaid[0]?.total || 0,
    salaryDeductions: deducted[0]?.total || 0,
  };
}

export async function getAdvanceDetail(employee, advanceId) {
  if (!mongoose.isValidObjectId(advanceId)) throw new AppError(DENIED, 404);
  const advance = await EmployeeAdvance.findOne({ _id: advanceId, shopId: employee.shopId, employeeId: employee._id });
  if (!advance) throw new AppError(DENIED, 404);
  const balance = await getAdvanceBalance(employee._id, employee.shopId);
  return {
    advance: {
      id: String(advance._id),
      originalAmount: advance.originalAmount,
      date: keyFromDate(advance.date),
      status: advance.status,
      notes: advance.notes || "",
    },
    outstanding: balance,
  };
}

export async function getAdvanceTransactions(employee, query) {
  const { page, limit, skip } = pageQuery(query);
  const filter = { shopId: employee.shopId, employeeId: employee._id };
  const [rows, total] = await Promise.all([
    AdvanceTransaction.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    AdvanceTransaction.countDocuments(filter),
  ]);
  return { transactions: rows.map(transactionView), page, limit, total };
}

export async function createLeaveRequest(employee, input) {
  const shop = await shopFor(employee);
  return createEmployeeLeaveRequest(employee, shop, input);
}

export async function getLeaveRequests(employee, query) {
  const { page, limit, skip } = pageQuery(query);
  const filter = { shopId: employee.shopId, employeeId: employee._id };
  if (query?.status && ["pending", "approved", "rejected", "cancelled"].includes(query.status)) {
    filter.status = query.status;
  }
  const [rows, total, pending, approved] = await Promise.all([
    Leave.find(filter).sort({ startDate: -1 }).skip(skip).limit(limit),
    Leave.countDocuments(filter),
    Leave.countDocuments({ shopId: employee.shopId, employeeId: employee._id, status: "pending" }),
    Leave.countDocuments({ shopId: employee.shopId, employeeId: employee._id, status: "approved" }),
  ]);
  const today = todayKey();
  const upcoming = await Leave.countDocuments({
    shopId: employee.shopId,
    employeeId: employee._id,
    status: "approved",
    endDate: { $gte: new Date(`${today}T00:00:00.000Z`) },
  });
  return {
    leaves: rows.map((leave) => ({
      id: String(leave._id),
      leaveType: leave.leaveType,
      salaryTreatment: leave.salaryTreatment,
      startDate: keyFromDate(leave.startDate),
      endDate: keyFromDate(leave.endDate),
      totalDays: leave.totalDays,
      reason: leave.reason || "",
      status: leave.status,
      rejectionReason: leave.rejectionReason || "",
    })),
    summary: { pending, approved, upcoming },
    page,
    limit,
    total,
  };
}

export async function getLeaveDetail(employee, leaveId) {
  if (!mongoose.isValidObjectId(leaveId)) {
    throw new AppError(DENIED, 404, true, { code: "LEAVE_ACCESS_DENIED" });
  }
  const leave = await Leave.findOne({ _id: leaveId, shopId: employee.shopId, employeeId: employee._id });
  if (!leave) throw new AppError(DENIED, 404, true, { code: "LEAVE_ACCESS_DENIED" });
  return {
    leave: {
      id: String(leave._id),
      leaveType: leave.leaveType,
      salaryTreatment: leave.salaryTreatment,
      startDate: keyFromDate(leave.startDate),
      endDate: keyFromDate(leave.endDate),
      totalDays: leave.totalDays,
      reason: leave.reason || "",
      status: leave.status,
      rejectionReason: leave.rejectionReason || "",
    },
  };
}

export async function cancelLeaveRequest(employee, leaveId) {
  const shop = await shopFor(employee);
  return cancelEmployeeLeaveRequest(employee, shop, leaveId);
}

function latestSalaryView(record, payment) {
  if (!record) return null;
  const calculation = record.calculation || {};
  const paid = record.paymentStatus === "paid" && payment?.status === "paid";
  return {
    id: String(record._id),
    year: record.year,
    month: record.month,
    status: record.status,
    paymentStatus: paid ? "paid" : record.paymentStatus || "unpaid",
    finalSalary: calculation.netSalary || 0,
    netSalary: calculation.netSalary || 0,
  };
}

export async function getHome(employee) {
  const profile = await getProfile(employee);
  const today = todayKey();
  const month = currentMonth();
  const [attendance, monthAttendance, latestAny, outstanding, upcoming, unreadCount] = await Promise.all([
    Attendance.findOne({
      shopId: employee.shopId,
      employeeId: employee._id,
      date: dateFromKey(today),
    }).select("status"),
    getAttendanceSummary(employee, `${month.year}-${String(month.month).padStart(2, "0")}`),
    SalaryRecord.findOne({
      shopId: employee.shopId,
      employeeId: employee._id,
    }).sort({ year: -1, month: -1, createdAt: -1 }),
    getAdvanceBalance(employee._id, employee.shopId),
    Leave.findOne({
      shopId: employee.shopId,
      employeeId: employee._id,
      status: { $in: ["approved", "pending"] },
      endDate: { $gte: dateFromKey(today) },
    }).sort({ startDate: 1 }),
    Notification.countDocuments({ employeeId: employee._id, isRead: false }),
  ]);

  const payment =
    latestAny?.paymentStatus === "paid" ? await latestPayment(employee, latestAny._id) : null;
  const finalized =
    latestAny?.status === "finalized"
      ? latestAny
      : await SalaryRecord.findOne({
          shopId: employee.shopId,
          employeeId: employee._id,
          status: "finalized",
        }).sort({ year: -1, month: -1 });
  const finalizedPayment =
    finalized && String(finalized._id) !== String(latestAny?._id) && finalized.paymentStatus === "paid"
      ? await latestPayment(employee, finalized._id)
      : finalized && String(finalized._id) === String(latestAny?._id)
        ? payment
        : null;

  return {
    ...profile,
    attendanceToday: attendance?.status || "not_marked",
    canMarkToday: !attendance && employee.status === "active",
    monthAttendance: monthAttendance.summary,
    currentSalary: profile.employee.salary,
    salary: finalized ? salaryView(finalized, finalizedPayment) : null,
    latestSalary: latestSalaryView(latestAny, payment),
    advanceOutstanding: outstanding,
    upcomingLeave: upcoming
      ? {
          id: String(upcoming._id),
          startDate: keyFromDate(upcoming.startDate),
          endDate: keyFromDate(upcoming.endDate),
          status: upcoming.status,
          leaveType: upcoming.leaveType,
        }
      : null,
    unreadCount,
  };
}

export async function markTodayAttendance(employee) {
  if (employee.status !== "active") {
    throw new AppError("Your account is inactive. Attendance cannot be marked.", 403);
  }
  const shop = await shopFor(employee);
  const today = todayKey(shop.settings?.timezone || "Asia/Kolkata");
  const storedDate = dateFromKey(today);
  await assertNoApprovedLeave(employee.shopId, employee._id, storedDate);

  const existing = await Attendance.findOne({
    shopId: employee.shopId,
    employeeId: employee._id,
    date: storedDate,
  }).select("status");
  if (existing) {
    throw new AppError("Attendance is already marked for today.", 409, true, { code: "ATTENDANCE_EXISTS" });
  }

  try {
    const record = await Attendance.create({
      shopId: employee.shopId,
      employeeId: employee._id,
      date: storedDate,
      status: "present",
      notes: "Checked in by employee",
      markedBy: null,
      selfMarked: true,
    });
    return { status: record.status, date: today, selfMarked: true };
  } catch (error) {
    if (Number(error?.code) === 11000) {
      throw new AppError("Attendance is already marked for today.", 409, true, { code: "ATTENDANCE_EXISTS" });
    }
    throw error;
  }
}

export const getSalaryReceipt = getEmployeeSalaryReceipt;
export const getSalaryReceiptPdf = getEmployeeSalaryReceiptPdf;
export {
  listEmployeeNotifications,
  markEmployeeNotificationRead,
  markAllEmployeeNotificationsRead,
  registerEmployeePushToken,
  removeEmployeePushToken,
  employeeNotificationPreferences,
  updateEmployeeNotificationPreferences,
};
