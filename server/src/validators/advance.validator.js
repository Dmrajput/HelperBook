import mongoose from "mongoose";
import {
  ADVANCE_MAX_PAGE_LIMIT,
  ADVANCE_MONEY_MAX,
  ADVANCE_NOTE_LIMIT,
  ADVANCE_PAGE_LIMIT,
  ADVANCE_PAYMENT_METHODS,
} from "../constants/advance.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, isValidCalendarKey, todayKey } from "../utils/attendanceDate.js";

const DETAILS = "Please check the advance details.";

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

export function parseEmployeeId(value) {
  const employeeId = text(value);
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError("Please select an employee.", 400);
  }
  return employeeId;
}

export function parseAdvanceId(value, { required = true } = {}) {
  if ((value === undefined || value === null || value === "") && !required) {
    return "";
  }
  const advanceId = text(value);
  if (!mongoose.isValidObjectId(advanceId)) {
    throw new AppError("Please select an advance.", 400);
  }
  return advanceId;
}

export function parseTransactionId(value) {
  const transactionId = text(value);
  if (!mongoose.isValidObjectId(transactionId)) {
    throw new AppError("Advance transaction could not be found.", 400);
  }
  return transactionId;
}

export function parseAdvanceAmount(value) {
  if (typeof value === "boolean" || value === null || value === undefined || value === "") {
    throw new AppError("Enter an amount greater than 0.", 400);
  }
  const amount = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(amount)) {
    throw new AppError("Enter a valid amount.", 400);
  }
  if (amount <= 0) {
    throw new AppError("Amount must be greater than 0.", 400);
  }
  if (amount > ADVANCE_MONEY_MAX) {
    throw new AppError("Amount is too large.", 400);
  }
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  if (Math.abs(amount - rounded) > 0.001) {
    throw new AppError("Amount can use up to 2 decimal places.", 400);
  }
  return rounded;
}

export function parseAdvanceDate(value, label) {
  const raw = text(value);
  if (!isValidCalendarKey(raw)) {
    throw new AppError(`Please select a valid ${label} date.`, 400);
  }
  if (raw > todayKey()) {
    throw new AppError(`${label} cannot be recorded for a future date.`, 400);
  }
  return { key: raw, date: dateFromKey(raw) };
}

function parseNotes(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  const notes = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (notes.length > ADVANCE_NOTE_LIMIT) {
    throw new AppError("Notes cannot be longer than 500 characters.", 400);
  }
  return notes;
}

function parseRequestId(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const requestId = text(value);
  if (!requestId || requestId.length > 80) {
    throw new AppError(DETAILS, 400);
  }
  return requestId;
}

function parsePage(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Please select a valid page.", 400);
  }
  return page;
}

function parseLimit(value) {
  if (value === undefined || value === null || value === "") {
    return ADVANCE_PAGE_LIMIT;
  }
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > ADVANCE_MAX_PAGE_LIMIT) {
    throw new AppError("Please select a valid page size.", 400);
  }
  return limit;
}

export function validateGiveAdvance(body) {
  const input = requireObject(body);
  return {
    employeeId: parseEmployeeId(input.employeeId),
    amount: parseAdvanceAmount(input.amount),
    ...parseAdvanceDate(input.date, "Advance"),
    notes: parseNotes(input.notes),
    requestId: parseRequestId(input.requestId),
    repaymentSettings: parseRepaymentSettings(input.repaymentSettings, { required: false }),
  };
}

export function validateRepayment(body) {
  const input = requireObject(body);
  const paymentMethod = text(input.paymentMethod || "cash") || "cash";
  if (!ADVANCE_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new AppError("Please choose cash or other.", 400);
  }
  return {
    employeeId: parseEmployeeId(input.employeeId),
    advanceId: parseAdvanceId(input.advanceId, { required: false }),
    amount: parseAdvanceAmount(input.amount),
    ...parseAdvanceDate(input.date, "Repayment"),
    notes: parseNotes(input.notes),
    paymentMethod,
    requestId: parseRequestId(input.requestId),
  };
}

export function validateAdjustment(body) {
  const input = requireObject(body);
  const direction = text(input.direction);
  if (!["increase", "decrease"].includes(direction)) {
    throw new AppError("Please choose how this adjustment changes the balance.", 400);
  }
  const reason = parseNotes(input.reason);
  if (!reason) {
    throw new AppError("An adjustment needs a reason.", 400);
  }
  return {
    employeeId: parseEmployeeId(input.employeeId),
    advanceId: parseAdvanceId(input.advanceId),
    amount: parseAdvanceAmount(input.amount),
    direction,
    ...parseAdvanceDate(input.date, "Adjustment"),
    reason,
    requestId: parseRequestId(input.requestId),
  };
}

function parseRepaymentSettings(value, { required }) {
  if (value === undefined || value === null) {
    if (required) {
      throw new AppError(DETAILS, 400);
    }
    return null;
  }
  const input = requireObject(value);
  if (input.method === undefined || input.method === null || input.method === "") {
    return { method: null, monthlyAmount: 0 };
  }
  const method = text(input.method);
  if (method !== "salary_deduction") {
    throw new AppError("Salary deduction is the only automatic repayment method.", 400);
  }
  const monthlyAmount = parseAdvanceAmount(input.monthlyAmount);
  return { method, monthlyAmount };
}

export function validateRepaymentSettings(body) {
  const input = requireObject(body);
  return parseRepaymentSettings(input.repaymentSettings, { required: true });
}

export function validateAdvanceListQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  const status = text(source.status || "active") || "active";
  if (!["active", "closed", "all"].includes(status)) {
    throw new AppError("Please select a valid advance filter.", 400);
  }
  const employeeId = source.employeeId ? parseEmployeeId(source.employeeId) : "";
  return {
    status,
    employeeId,
    search: text(source.search).slice(0, 100),
    page: parsePage(source.page, 1),
    limit: parseLimit(source.limit),
  };
}

export function validateEmployeeAdvanceQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  const status = text(source.status || "");
  if (status && !["active", "closed", "cancelled"].includes(status)) {
    throw new AppError("Please select a valid advance status.", 400);
  }
  const startDate = source.startDate ? parseAdvanceDate(source.startDate, "Start").key : "";
  const endDate = source.endDate ? parseAdvanceDate(source.endDate, "End").key : "";
  if (startDate && endDate && startDate > endDate) {
    throw new AppError("The start date must be on or before the end date.", 400);
  }
  return {
    status,
    startDate,
    endDate,
    page: parsePage(source.page, 1),
    limit: parseLimit(source.limit),
  };
}

export function validateTransactionQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  const type = text(source.type || "");
  if (type && !["advance", "repayment", "salary_deduction", "adjustment", "reversal"].includes(type)) {
    throw new AppError("Please select a valid khata filter.", 400);
  }
  const startDate = source.startDate ? parseAdvanceDate(source.startDate, "Start").key : "";
  const endDate = source.endDate ? parseAdvanceDate(source.endDate, "End").key : "";
  if (startDate && endDate && startDate > endDate) {
    throw new AppError("The start date must be on or before the end date.", 400);
  }
  return {
    type,
    startDate,
    endDate,
    page: parsePage(source.page, 1),
    limit: parseLimit(source.limit),
  };
}
