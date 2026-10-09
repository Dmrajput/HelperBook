import mongoose from "mongoose";
import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import { DEFAULT_ATTENDANCE_DEDUCTION_MODE } from "../constants/salary.js";
import { DEDUCTIONS_EXCEED_SALARY } from "../constants/salary.js";
import {
  getAdvanceBalance,
  planSalaryDeduction,
  postSalaryDeduction,
  reverseSalaryDeductions,
} from "./advance.service.js";
import { approvedCoverage, workingLeaveDays } from "./leave.service.js";
import { latestPaymentMap, toPublicPayment } from "./salaryPayment.service.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import SalaryRecord from "../models/SalaryRecord.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import {
  currentMonth,
  dateFromKey,
  keyFromDate,
  monthBounds,
  todayKey,
  weekdayKey,
} from "../utils/attendanceDate.js";
import { runInTransaction } from "../utils/mongoTransaction.js";
import { roundMoney } from "../validators/salary.validator.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const NOT_FOUND = "Salary could not be found.";
const FINALIZED_MESSAGE = "Salary is finalized. Reopen it before recalculating.";
const FINALIZED_EDIT = "This salary is finalized. Reopen it before making changes.";
const NOT_EMPLOYED = "This employee was not employed during this month.";

function roundDays(value) {
  return Math.round(Number(value) * 100) / 100;
}

function shiftKey(key, days) {
  const [year, month, day] = key.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(shifted.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function periodEndKey(year, month) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;
}

function eachKey(startKey, endKey) {
  const keys = [];
  if (!startKey || !endKey || startKey > endKey) {
    return keys;
  }
  let key = startKey;
  while (key <= endKey) {
    keys.push(key);
    key = shiftKey(key, 1);
  }
  return keys;
}

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
  return shop?.settings?.timezone || EMPLOYEE_TIME_ZONE;
}

function deductionMode(shop, override) {
  if (override) {
    return override;
  }
  const mode = shop?.settings?.attendanceDeductionMode;
  if (mode === "calendar_days" || mode === "working_days") {
    return mode;
  }
  return DEFAULT_ATTENDANCE_DEDUCTION_MODE;
}

function isScheduledWorkingDay(shop, key, timeZone) {
  const weekday = weekdayKey(new Date(`${key}T12:00:00+05:30`), timeZone);
  return shop.workingSchedule.workingDays.includes(weekday);
}

function calculatePeriod(year, month) {
  const bounds = monthBounds(year, month);
  const endKey = periodEndKey(year, month);
  return {
    year,
    month,
    startKey: bounds.startKey,
    endKey,
    periodStart: bounds.start,
    periodEnd: dateFromKey(endKey),
    calendarDays: daysInMonth(year, month),
  };
}

function calculateWorkingDays(shop, startKey, endKey, timeZone) {
  return eachKey(startKey, endKey).filter((key) => isScheduledWorkingDay(shop, key, timeZone)).length;
}

function countModeDays(shop, startKey, endKey, mode, timeZone) {
  if (!startKey || !endKey || startKey > endKey) {
    return 0;
  }
  if (mode === "calendar_days") {
    return eachKey(startKey, endKey).length;
  }
  return calculateWorkingDays(shop, startKey, endKey, timeZone);
}

async function findOwnedEmployee(shopId, employeeId) {
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError("Please select an employee.", 400);
  }
  const employee = await Employee.findOne({ _id: employeeId, shopId });
  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }
  return employee;
}

function sumAmounts(entries) {
  return roundMoney((entries || []).reduce((sum, entry) => sum + Number(entry.amount || 0), 0));
}

async function getAttendanceDays(shopId, employeeId, startKey, endKey) {
  if (!startKey || !endKey || startKey > endKey) {
    return [];
  }
  const records = await Attendance.find({
    shopId,
    employeeId,
    date: { $gte: dateFromKey(startKey), $lte: dateFromKey(endKey) },
  })
    .select("status date")
    .lean();
  return records.map((record) => ({ key: keyFromDate(record.date), status: record.status }));
}

function calculateDailyRate(salaryRate, divisor) {
  if (!divisor) {
    return 0;
  }
  return salaryRate / divisor;
}

function calculateBaseSalary({ salaryType, salaryRate, payableDays }) {
  if (salaryType === "daily") {
    return roundMoney(salaryRate * payableDays);
  }
  return roundMoney(salaryRate);
}

function calculateAttendanceDeduction({ salaryType, unpaidAttendanceDays, dailyRate }) {
  if (salaryType === "daily") {
    return 0;
  }
  return roundMoney(unpaidAttendanceDays * dailyRate);
}

function calculateLeaveDeduction({ salaryType, unpaidLeaveDays, dailyRate }) {
  if (salaryType === "daily") {
    return 0;
  }
  return roundMoney(unpaidLeaveDays * dailyRate);
}

function calculateNetSalary({
  baseSalary,
  attendanceDeduction,
  leaveDeduction,
  bonus,
  deduction,
  advanceDeduction,
}) {
  const raw = baseSalary - attendanceDeduction - leaveDeduction + bonus - deduction - advanceDeduction;
  const rounded = roundMoney(raw);
  if (rounded < 0) {
    return { netSalary: 0, warning: DEDUCTIONS_EXCEED_SALARY };
  }
  return { netSalary: rounded, warning: "" };
}

function employmentWindow(employee, period, timeZone) {
  const joiningKey = keyFromDate(employee.joiningDate);
  if (joiningKey > period.endKey) {
    throw new AppError(NOT_EMPLOYED, 400);
  }
  const deactivatedKey = employee.deactivatedAt ? keyFromDate(employee.deactivatedAt) : "";
  if (deactivatedKey && deactivatedKey < period.startKey) {
    throw new AppError(NOT_EMPLOYED, 400);
  }

  const today = currentMonth(timeZone);
  let windowEnd = period.endKey;
  if (period.year === today.year && period.month === today.month && today.today < windowEnd) {
    windowEnd = today.today;
  }
  if (deactivatedKey && deactivatedKey < windowEnd) {
    windowEnd = deactivatedKey;
  }

  const windowStart = joiningKey > period.startKey ? joiningKey : period.startKey;
  return { joiningKey, deactivatedKey, windowStart, windowEnd };
}

async function buildSnapshot({ shop, employee, period, adjustments, timeZone }) {
  const mode = deductionMode(shop, adjustments.attendanceDeductionMode);
  const { joiningKey, deactivatedKey, windowStart, windowEnd } = employmentWindow(employee, period, timeZone);
  const attendanceDays = await getAttendanceDays(shop._id, employee._id, windowStart, windowEnd);
  const covered = await approvedCoverage(shop._id, employee._id, windowStart, windowEnd);
  const counts = { presentDays: 0, halfDays: 0, absentDays: 0 };
  const explicitOther = new Set();
  let legacyLeaveDays = 0;
  for (const day of attendanceDays) {
    if (covered.has(day.key)) {
      if (day.status !== "leave") {
        explicitOther.add(day.key);
        if (day.status === "present") counts.presentDays += 1;
        else if (day.status === "half_day") counts.halfDays += 1;
        else if (day.status === "absent") counts.absentDays += 1;
      }
      continue;
    }
    if (day.status === "present") counts.presentDays += 1;
    else if (day.status === "half_day") counts.halfDays += 1;
    else if (day.status === "absent") counts.absentDays += 1;
    else if (day.status === "leave") legacyLeaveDays += 1;
  }
  const approved = workingLeaveDays(shop, covered, explicitOther);
  const leaveDays = roundDays(approved.paidWorkingDays + approved.unpaidWorkingDays + legacyLeaveDays);
  const previousLegacyPaid = Math.max(
    0,
    Number(adjustments.previousPaidLeaveDays || 0) - Number(adjustments.previousApprovedPaidDays || 0)
  );
  const paidLeaveDays = adjustments.paidLeaveSpecified
    ? Number(adjustments.paidLeaveDays || 0)
    : roundDays(approved.paidWorkingDays + Math.min(previousLegacyPaid, legacyLeaveDays));
  if (paidLeaveDays < approved.paidWorkingDays) {
    throw new AppError(
      `Paid leave cannot be less than the ${approved.paidWorkingDays} approved paid leave day(s).`,
      400
    );
  }
  if (paidLeaveDays > leaveDays) {
    throw new AppError("Paid leave cannot be greater than total leave.", 400);
  }

  const unpaidLeaveDays = roundDays(leaveDays - paidLeaveDays);
  const payableDays = roundDays(counts.presentDays + counts.halfDays * 0.5 + paidLeaveDays);
  const beforeStart = joiningKey > period.startKey ? period.startKey : "";
  const beforeEnd = joiningKey > period.startKey ? shiftKey(joiningKey, -1) : "";
  const afterStart = deactivatedKey && deactivatedKey < period.endKey ? shiftKey(deactivatedKey, 1) : "";
  const beforeJoiningDays = countModeDays(shop, beforeStart, beforeEnd, mode, timeZone);
  const afterExitDays = countModeDays(shop, afterStart, period.endKey, mode, timeZone);
  const workingDays = calculateWorkingDays(shop, period.startKey, period.endKey, timeZone);
  const divisor = mode === "calendar_days" ? period.calendarDays : workingDays;
  const dailyRate = calculateDailyRate(employee.salary.amount, divisor);
  const unpaidAttendanceDays = roundDays(counts.absentDays + counts.halfDays * 0.5 + beforeJoiningDays + afterExitDays);
  const salaryType = employee.salary.type;
  const salaryRate = roundMoney(employee.salary.amount);
  const bonuses = adjustments.bonuses || [];
  const deductions = adjustments.deductions || [];
  const bonus = sumAmounts(bonuses);
  const deduction = sumAmounts(deductions);
  const baseSalary = calculateBaseSalary({ salaryType, salaryRate, payableDays });
  const attendanceDeduction = calculateAttendanceDeduction({ salaryType, unpaidAttendanceDays, dailyRate });
  const leaveDeduction = calculateLeaveDeduction({ salaryType, unpaidLeaveDays, dailyRate });
  const availableSalary = roundMoney(baseSalary - attendanceDeduction - leaveDeduction + bonus - deduction);
  const advance = await planSalaryDeduction({
    shopId: shop._id,
    employeeId: employee._id,
    requested: adjustments.advanceDeductionManual ? adjustments.advanceDeduction : undefined,
    availableSalary,
  });
  const net = calculateNetSalary({
    baseSalary,
    attendanceDeduction,
    leaveDeduction,
    bonus,
    deduction,
    advanceDeduction: advance.advanceDeduction,
  });

  const warnings = [];
  if (salaryType === "monthly" && divisor === 0) {
    warnings.push("This month has no working days for the selected calculation.");
  }
  if (advance.warning) {
    warnings.push(advance.warning);
  }
  if (net.warning) {
    warnings.push(net.warning);
  }

  return {
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    salaryType,
    salaryRate,
    currency: "INR",
    attendanceDeductionMode: mode,
    workingDays,
    calendarDays: period.calendarDays,
    attendance: {
      presentDays: counts.presentDays,
      halfDays: counts.halfDays,
      leaveDays,
      paidLeaveDays,
      unpaidLeaveDays,
      approvedPaidDays: approved.paidWorkingDays,
      approvedUnpaidDays: approved.unpaidWorkingDays,
      absentDays: counts.absentDays,
      payableDays,
      beforeJoiningDays,
      afterExitDays,
    },
    bonuses,
    deductions,
    calculation: {
      baseSalary,
      attendanceDeduction,
      leaveDeduction,
      bonus,
      deduction,
      advanceDeduction: advance.advanceDeduction,
      advanceDeductionManual: Boolean(adjustments.advanceDeductionManual),
      netSalary: net.netSalary,
      warning: warnings.join(" "),
    },
    notes: adjustments.notes || "",
    calculatedAt: new Date(),
    advance: {
      available: true,
      outstanding: advance.outstanding,
    },
  };
}

function employeeCard(employee) {
  return {
    id: String(employee._id),
    name: employee.name,
    role: employee.role,
    customRole: employee.customRole || null,
    status: employee.status,
    salaryType: employee.salary?.type || null,
    salaryAmount: employee.salary?.amount ?? null,
  };
}

function toPublicSalary(record, employee, advance, payment = null) {
  const calculation = record.calculation;
  const outstanding = roundMoney(advance?.outstanding || 0);
  const projected = record.status === "draft";
  return {
    id: String(record._id),
    employee: employee
      ? employeeCard(employee)
      : {
          id: String(record.employeeId),
          name: "",
          role: "",
          customRole: null,
          status: "",
          salaryType: record.salaryType,
          salaryAmount: record.salaryRate,
        },
    year: record.year,
    month: record.month,
    periodStart: keyFromDate(record.periodStart),
    periodEnd: keyFromDate(record.periodEnd),
    salaryType: record.salaryType,
    salaryRate: record.salaryRate,
    currency: record.currency || "INR",
    attendanceDeductionMode: record.attendanceDeductionMode,
    workingDays: record.workingDays,
    calendarDays: record.calendarDays,
    attendance: record.attendance,
    bonuses: (record.bonuses || []).map((entry) => ({ amount: entry.amount, reason: entry.reason || "" })),
    deductions: (record.deductions || []).map((entry) => ({ amount: entry.amount, reason: entry.reason || "" })),
    calculation: {
      baseSalary: calculation.baseSalary,
      attendanceDeduction: calculation.attendanceDeduction,
      leaveDeduction: calculation.leaveDeduction,
      bonus: calculation.bonus,
      deduction: calculation.deduction,
      advanceDeduction: calculation.advanceDeduction,
      netSalary: calculation.netSalary,
      warning: calculation.warning || "",
    },
    advance: {
      available: true,
      outstanding,
      thisMonth: calculation.advanceDeduction,
      remaining: projected
        ? roundMoney(Math.max(0, outstanding - calculation.advanceDeduction))
        : outstanding,
      projected,
    },
    status: record.status,
    paymentStatus: record.paymentStatus || "unpaid",
    payment: toPublicPayment(payment),
    notes: record.notes || "",
    calculatedAt: new Date(record.calculatedAt).toISOString(),
    finalizedAt: record.finalizedAt ? new Date(record.finalizedAt).toISOString() : null,
  };
}

function adjustmentsFromRecord(record, input = {}) {
  return {
    paidLeaveDays: input.paidLeaveDays,
    paidLeaveSpecified: Object.prototype.hasOwnProperty.call(input, "paidLeaveDays"),
    previousPaidLeaveDays: record?.attendance?.paidLeaveDays ?? 0,
    previousApprovedPaidDays: record?.attendance?.approvedPaidDays ?? 0,
    bonuses: input.bonuses ?? record?.bonuses ?? [],
    deductions: input.deductions ?? record?.deductions ?? [],
    advanceDeduction: Object.prototype.hasOwnProperty.call(input, "advanceDeduction")
      ? input.advanceDeduction
      : record?.calculation?.advanceDeduction ?? 0,
    advanceDeductionManual: Object.prototype.hasOwnProperty.call(input, "advanceDeduction")
      ? true
      : Boolean(record?.calculation?.advanceDeductionManual),
    attendanceDeductionMode: input.attendanceDeductionMode ?? record?.attendanceDeductionMode,
    notes: input.notes ?? record?.notes ?? "",
  };
}

function duplicateSalary(error) {
  return error?.code === 11000;
}

async function saveDraft(existing, payload) {
  if (existing) {
    if (existing.status === "finalized" || existing.status === "paid") {
      throw new AppError(FINALIZED_MESSAGE, 409);
    }
    Object.assign(existing, payload, { status: "draft", finalizedAt: null });
    await existing.save();
    return existing;
  }

  try {
    return await SalaryRecord.create({ ...payload, status: "draft", finalizedAt: null });
  } catch (error) {
    if (duplicateSalary(error)) {
      throw new AppError("Salary for this month already exists.", 409);
    }
    throw error;
  }
}

async function calculateForEmployee(shop, employee, year, month, input) {
  const timeZone = shopTimeZone(shop);
  const period = calculatePeriod(year, month);
  const existing = await SalaryRecord.findOne({
    shopId: shop._id,
    employeeId: employee._id,
    year,
    month,
  });
  if (existing && (existing.status === "finalized" || existing.status === "paid")) {
    throw new AppError(FINALIZED_MESSAGE, 409);
  }

  const snapshot = await buildSnapshot({
    shop,
    employee,
    period,
    adjustments: adjustmentsFromRecord(existing, input),
    timeZone,
  });
  const { advance, ...stored } = snapshot;
  const record = await saveDraft(existing, {
    shopId: shop._id,
    employeeId: employee._id,
    year,
    month,
    ...stored,
  });
  return { record, advance };
}

function eligibleForMonth(employee, period) {
  const joiningKey = keyFromDate(employee.joiningDate);
  if (joiningKey > period.endKey) {
    return false;
  }
  if (!employee.deactivatedAt) {
    return true;
  }
  return keyFromDate(employee.deactivatedAt) >= period.startKey;
}

function grossOf(calculation) {
  return roundMoney(
    calculation.baseSalary - calculation.attendanceDeduction - calculation.leaveDeduction + calculation.bonus
  );
}

export async function calculateSalary(userId, input) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, input.employeeId);
  const { record, advance } = await calculateForEmployee(shop, employee, input.year, input.month, input);
  return { salary: toPublicSalary(record, employee, advance) };
}

export async function calculateAllSalaries(userId, { year, month }) {
  const shop = await requireShop(userId);
  const period = calculatePeriod(year, month);
  const employees = await Employee.find({ shopId: shop._id });
  const existing = await SalaryRecord.find({ shopId: shop._id, year, month });
  const existingByEmployee = new Map(existing.map((record) => [String(record.employeeId), record]));

  let created = 0;
  let updated = 0;
  let skippedFinalized = 0;
  const failures = [];

  for (const employee of employees) {
    if (!eligibleForMonth(employee, period)) {
      continue;
    }
    const current = existingByEmployee.get(String(employee._id));
    if (current && (current.status === "finalized" || current.status === "paid")) {
      skippedFinalized += 1;
      continue;
    }
    try {
      const result = await calculateForEmployee(shop, employee, year, month, {});
      if (current) {
        updated += 1;
      } else {
        created += 1;
      }
      existingByEmployee.set(String(employee._id), result.record);
    } catch (error) {
      failures.push({
        employeeId: String(employee._id),
        name: employee.name,
        message: error instanceof AppError ? error.message : "Salary could not be calculated.",
      });
    }
  }

  return { year, month, created, updated, skippedFinalized, failures };
}

export async function recalculateSalary(userId, salaryId, input = {}) {
  const shop = await requireShop(userId);
  const record = await SalaryRecord.findOne({ _id: salaryId, shopId: shop._id });
  if (!record) {
    throw new AppError(NOT_FOUND, 404);
  }
  if (record.status !== "draft") {
    throw new AppError(FINALIZED_MESSAGE, 409);
  }
  const employee = await findOwnedEmployee(shop._id, record.employeeId);
  const { record: saved, advance } = await calculateForEmployee(
    shop,
    employee,
    record.year,
    record.month,
    input
  );
  return { salary: toPublicSalary(saved, employee, advance) };
}

export async function updateSalary(userId, salaryId, input) {
  const shop = await requireShop(userId);
  const record = await SalaryRecord.findOne({ _id: salaryId, shopId: shop._id });
  if (!record) {
    throw new AppError(NOT_FOUND, 404);
  }
  if (record.status !== "draft") {
    throw new AppError(FINALIZED_EDIT, 409);
  }
  return recalculateSalary(userId, salaryId, input);
}

function salaryDeductionDate(record) {
  const endKey = keyFromDate(record.periodEnd);
  const today = todayKey();
  return dateFromKey(endKey > today ? today : endKey);
}

export async function finalizeSalary(userId, salaryId) {
  const shop = await requireShop(userId);
  return runInTransaction(async (session) => {
    const recordQuery = SalaryRecord.findOne({ _id: salaryId, shopId: shop._id });
    const record = await (session ? recordQuery.session(session) : recordQuery);
    if (!record) {
      throw new AppError(NOT_FOUND, 404);
    }
    if (record.status === "finalized" || record.status === "paid") {
      throw new AppError("Salary is already finalized.", 409);
    }
    const employee = await findOwnedEmployee(shop._id, record.employeeId);
    if (record.attendance.paidLeaveDays > record.attendance.leaveDays) {
      throw new AppError("Paid leave cannot be greater than total leave.", 400);
    }
    const calculation = record.calculation;
    const availableSalary = roundMoney(
      calculation.baseSalary -
        calculation.attendanceDeduction -
        calculation.leaveDeduction +
        calculation.bonus -
        calculation.deduction
    );
    const plan = await planSalaryDeduction({
      shopId: shop._id,
      employeeId: employee._id,
      requested: calculation.advanceDeduction,
      availableSalary: Math.max(0, availableSalary),
      session,
    });
    const net = calculateNetSalary({
      baseSalary: calculation.baseSalary,
      attendanceDeduction: calculation.attendanceDeduction,
      leaveDeduction: calculation.leaveDeduction,
      bonus: calculation.bonus,
      deduction: calculation.deduction,
      advanceDeduction: plan.advanceDeduction,
    });
    calculation.advanceDeduction = plan.advanceDeduction;
    calculation.netSalary = net.netSalary;
    calculation.warning = [plan.warning, net.warning].filter(Boolean).join(" ");
    if (plan.advanceDeduction > 0) {
      await postSalaryDeduction({
        shopId: shop._id,
        employeeId: employee._id,
        salaryRecordId: record._id,
        amount: plan.advanceDeduction,
        date: salaryDeductionDate(record),
        userId,
        session,
      });
    }
    record.status = "finalized";
    record.finalizedAt = new Date();
    record.markModified("calculation");
    await record.save(session ? { session } : undefined);
    const outstanding = roundMoney(Math.max(0, await getAdvanceBalance(employee._id, shop._id, session)));
    return { salary: toPublicSalary(record, employee, { outstanding }) };
  });
}

export async function reopenSalary(userId, salaryId) {
  const shop = await requireShop(userId);
  return runInTransaction(async (session) => {
    const recordQuery = SalaryRecord.findOne({ _id: salaryId, shopId: shop._id });
    const record = await (session ? recordQuery.session(session) : recordQuery);
    if (!record) {
      throw new AppError(NOT_FOUND, 404);
    }
    if (record.status !== "finalized") {
      throw new AppError("Only a finalized salary can be reopened.", 409);
    }
    if (record.paymentStatus === "paid") {
      throw new AppError("Reverse the salary payment before reopening this salary.", 409);
    }
    const employee = await findOwnedEmployee(shop._id, record.employeeId);
    await reverseSalaryDeductions({
      shopId: shop._id,
      salaryRecordId: record._id,
      userId,
      session,
    });
    record.status = "draft";
    record.finalizedAt = null;
    await record.save(session ? { session } : undefined);
    const outstanding = roundMoney(Math.max(0, await getAdvanceBalance(employee._id, shop._id, session)));
    return { salary: toPublicSalary(record, employee, { outstanding }) };
  });
}

export async function getSalaryById(userId, salaryId) {
  const shop = await requireShop(userId);
  if (!mongoose.isValidObjectId(salaryId)) {
    throw new AppError(NOT_FOUND, 404);
  }
  const record = await SalaryRecord.findOne({ _id: salaryId, shopId: shop._id });
  if (!record) {
    throw new AppError(NOT_FOUND, 404);
  }
  const employee = await Employee.findOne({ _id: record.employeeId, shopId: shop._id });
  const outstanding = employee ? roundMoney(Math.max(0, await getAdvanceBalance(employee._id, shop._id))) : 0;
  const payments = await latestPaymentMap(shop._id, [record._id]);
  return { salary: toPublicSalary(record, employee, { outstanding }, payments.get(String(record._id))) };
}

export async function getMonthlySalaries(userId, year, month, query) {
  const shop = await requireShop(userId);
  const period = calculatePeriod(year, month);
  const today = currentMonth(shopTimeZone(shop));
  const employees = await Employee.find({ shopId: shop._id }).sort({ name: 1 });
  const records = await SalaryRecord.find({ shopId: shop._id, year, month });
  const payments = await latestPaymentMap(shop._id, records.map((record) => record._id));
  const recordByEmployee = new Map(records.map((record) => [String(record.employeeId), record]));
  const search = (query.search || "").toLowerCase();

  const rows = [];
  for (const employee of employees) {
    const record = recordByEmployee.get(String(employee._id));
    if (!record && !eligibleForMonth(employee, period)) {
      continue;
    }
    const outstanding = roundMoney(Math.max(0, await getAdvanceBalance(employee._id, shop._id)));
    rows.push({
      employee: employeeCard(employee),
      salary: record
        ? toPublicSalary(record, employee, { outstanding }, payments.get(String(record._id)))
        : null,
    });
  }

  const salaries = rows.filter((row) => {
    if (search && !row.employee.name.toLowerCase().includes(search)) {
      return false;
    }
    if (query.status === "draft") {
      return row.salary?.status === "draft";
    }
    if (query.status === "finalized") {
      return row.salary?.status === "finalized";
    }
    return true;
  });

  const counted = rows.map((row) => row.salary).filter(Boolean);
  const summary = counted.reduce(
    (totals, salary) => {
      const calculation = salary.calculation;
      totals.calculated += 1;
      if (salary.status === "finalized") totals.finalized += 1;
      if (salary.status === "draft") totals.draft += 1;
      totals.totalGrossSalary = roundMoney(totals.totalGrossSalary + grossOf(calculation));
      totals.totalDeductions = roundMoney(
        totals.totalDeductions + calculation.attendanceDeduction + calculation.leaveDeduction + calculation.deduction
      );
      totals.totalAdvances = roundMoney(totals.totalAdvances + calculation.advanceDeduction);
      totals.totalNetSalary = roundMoney(totals.totalNetSalary + calculation.netSalary);
      return totals;
    },
    {
      totalEmployees: rows.length,
      calculated: 0,
      draft: 0,
      finalized: 0,
      totalGrossSalary: 0,
      totalDeductions: 0,
      totalAdvances: 0,
      totalNetSalary: 0,
    }
  );

  return {
    year,
    month,
    periodStart: period.startKey,
    periodEnd: period.endKey,
    periodOpen: year === today.year && month === today.month,
    advanceAvailable: true,
    summary,
    salaries,
  };
}

export async function getEmployeeSalaryHistory(userId, employeeId, query) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  const filter = { shopId: shop._id, employeeId: employee._id };
  if (query.year) filter.year = query.year;
  if (query.month) filter.month = query.month;
  const skip = (query.page - 1) * query.limit;
  const [records, total] = await Promise.all([
    SalaryRecord.find(filter).sort({ year: -1, month: -1 }).skip(skip).limit(query.limit),
    SalaryRecord.countDocuments(filter),
  ]);
  const outstanding = roundMoney(Math.max(0, await getAdvanceBalance(employee._id, shop._id)));
  const payments = await latestPaymentMap(shop._id, records.map((record) => record._id));
  return {
    employee: employeeCard(employee),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    salaries: records.map((record) => toPublicSalary(record, employee, { outstanding }, payments.get(String(record._id)))),
  };
}
