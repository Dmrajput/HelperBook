import mongoose from "mongoose";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "../constants/employee.js";
import {
  ADJUSTMENT_REASON_LIMIT,
  ATTENDANCE_DEDUCTION_MODES,
  MAX_SALARY_ADJUSTMENTS,
  SALARY_MONEY_MAX,
  SALARY_NOTE_LIMIT,
} from "../constants/salary.js";
import { AppError } from "../utils/appError.js";
import { currentMonth, isValidCalendarKey } from "../utils/attendanceDate.js";

const DETAILS = "Please check the salary details.";

function text(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function requireObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(DETAILS, 400);
  }
  return value;
}

export function roundMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function parseEmployeeId(value) {
  const employeeId = text(value);
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError("Please select an employee.", 400);
  }
  return employeeId;
}

export function parseSalaryId(value) {
  const salaryId = text(value);
  if (!mongoose.isValidObjectId(salaryId)) {
    throw new AppError("Salary could not be found.", 400);
  }
  return salaryId;
}

function parseYearMonth(yearValue, monthValue) {
  const year = Number(yearValue);
  const month = Number(monthValue);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AppError("Please select a valid year.", 400);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError("Please select a valid month.", 400);
  }
  const current = currentMonth();
  if (year > current.year || (year === current.year && month > current.month)) {
    throw new AppError("Salary cannot be calculated for a future month.", 400);
  }
  const startKey = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  if (!isValidCalendarKey(startKey)) {
    throw new AppError("Please select a valid month.", 400);
  }
  return { year, month };
}

function parseMoney(value, label) {
  if (typeof value === "boolean" || value === null || value === undefined || value === "") {
    throw new AppError(`${label} must be a valid amount.`, 400);
  }
  const amount = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(amount)) {
    throw new AppError(`${label} must be a valid amount.`, 400);
  }
  if (amount < 0) {
    throw new AppError(`${label} cannot be negative.`, 400);
  }
  if (amount > SALARY_MONEY_MAX) {
    throw new AppError(`${label} is too large.`, 400);
  }
  const rounded = roundMoney(amount);
  if (Math.abs(amount - rounded) > 0.001) {
    throw new AppError(`${label} can use up to 2 decimal places.`, 400);
  }
  return rounded;
}

function parseReason(value, { required }) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new AppError("A deduction needs a reason.", 400);
    }
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  const reason = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (required && !reason) {
    throw new AppError("A deduction needs a reason.", 400);
  }
  if (reason.length > ADJUSTMENT_REASON_LIMIT) {
    throw new AppError("Reason cannot be longer than 200 characters.", 400);
  }
  return reason;
}

function parseAdjustments(value, { label, reasonRequired }) {
  if (!Array.isArray(value)) {
    throw new AppError(DETAILS, 400);
  }
  if (value.length > MAX_SALARY_ADJUSTMENTS) {
    throw new AppError(`You can add up to ${MAX_SALARY_ADJUSTMENTS} ${label} entries.`, 400);
  }
  return value.map((entry) => {
    const item = requireObject(entry);
    return {
      amount: parseMoney(item.amount, label),
      reason: parseReason(item.reason, { required: reasonRequired }),
    };
  });
}

export function parsePaidLeaveDays(value) {
  if (typeof value === "boolean" || value === null || value === undefined || value === "") {
    throw new AppError("Paid leave must be a valid number.", 400);
  }
  const days = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(days) || days < 0) {
    throw new AppError("Paid leave cannot be negative.", 400);
  }
  const rounded = Math.round(days * 100) / 100;
  if (Math.abs(days - rounded) > 0.001) {
    throw new AppError("Paid leave can use up to 2 decimal places.", 400);
  }
  return rounded;
}

function parseMode(value) {
  const mode = text(value);
  if (!ATTENDANCE_DEDUCTION_MODES.includes(mode)) {
    throw new AppError("Please select a valid salary calculation.", 400);
  }
  return mode;
}

function parseNotes(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  const notes = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (notes.length > SALARY_NOTE_LIMIT) {
    throw new AppError("Notes cannot be longer than 500 characters.", 400);
  }
  return notes;
}

function optionalAdjustments(body) {
  const adjustments = {};
  if (body.paidLeaveDays !== undefined) {
    adjustments.paidLeaveDays = parsePaidLeaveDays(body.paidLeaveDays);
  }
  if (body.bonuses !== undefined) {
    adjustments.bonuses = parseAdjustments(body.bonuses, { label: "Bonus", reasonRequired: false });
  }
  if (body.deductions !== undefined) {
    adjustments.deductions = parseAdjustments(body.deductions, { label: "Deduction", reasonRequired: true });
  }
  if (body.advanceDeduction !== undefined) {
    adjustments.advanceDeduction = parseMoney(body.advanceDeduction, "Advance deduction");
  }
  if (body.attendanceDeductionMode !== undefined) {
    adjustments.attendanceDeductionMode = parseMode(body.attendanceDeductionMode);
  }
  if (body.notes !== undefined) {
    adjustments.notes = parseNotes(body.notes);
  }
  return adjustments;
}

export function validateCalculate(body) {
  const input = requireObject(body);
  const period = parseYearMonth(input.year, input.month);
  return {
    employeeId: parseEmployeeId(input.employeeId),
    ...period,
    ...optionalAdjustments(input),
  };
}

export function validateCalculateAll(body) {
  const input = requireObject(body);
  return parseYearMonth(input.year, input.month);
}

export function validateMonthParams(year, month) {
  return parseYearMonth(year, month);
}

export function validateMonthQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  const search = text(source.search).slice(0, 100);
  const status = text(source.status);
  if (status && !["draft", "finalized"].includes(status)) {
    throw new AppError("Please select a valid salary status.", 400);
  }
  return { search, status };
}

export function validateHistoryQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  const page = Number(source.page || 1);
  const limit = Number(source.limit || DEFAULT_PAGE_LIMIT);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Please select a valid page.", 400);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    throw new AppError("Please select a valid page size.", 400);
  }
  const filters = {};
  if (source.year !== undefined && source.year !== "") {
    const year = Number(source.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new AppError("Please select a valid year.", 400);
    }
    filters.year = year;
  }
  if (source.month !== undefined && source.month !== "") {
    const month = Number(source.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError("Please select a valid month.", 400);
    }
    filters.month = month;
  }
  return { page, limit, ...filters };
}

export function validateSalaryUpdate(body) {
  const input = requireObject(body);
  const adjustments = optionalAdjustments(input);
  if (Object.keys(adjustments).length === 0) {
    throw new AppError(DETAILS, 400);
  }
  return adjustments;
}
