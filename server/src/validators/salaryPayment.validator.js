import mongoose from "mongoose";
import {
  SALARY_PAYMENT_MAX_PAGE_LIMIT,
  SALARY_PAYMENT_METHODS,
  SALARY_PAYMENT_NOTE_LIMIT,
  SALARY_PAYMENT_PAGE_LIMIT,
  SALARY_PAYMENT_REFERENCE_LIMIT,
  SALARY_REVERSAL_REASON_MAX,
  SALARY_REVERSAL_REASON_MIN,
} from "../constants/salary.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, isValidCalendarKey, todayKey } from "../utils/attendanceDate.js";

const DETAILS = "Please check the payment details and try again.";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(DETAILS, 400);
  }
  return body;
}

export function validatePaySalary(body) {
  const input = requireObject(body);
  const paymentMethod = text(input.paymentMethod);
  if (!SALARY_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new AppError("Choose cash, UPI, or bank transfer.", 400);
  }
  const paymentDate = text(input.paymentDate);
  if (!isValidCalendarKey(paymentDate)) {
    throw new AppError("Please select a valid payment date.", 400);
  }
  if (paymentDate > todayKey()) {
    throw new AppError("Payment date cannot be in the future.", 400);
  }
  const paymentReference = text(input.paymentReference);
  if (paymentReference.length > SALARY_PAYMENT_REFERENCE_LIMIT) {
    throw new AppError("Payment reference cannot exceed 100 characters.", 400);
  }
  const notes = text(input.notes);
  if (notes.length > SALARY_PAYMENT_NOTE_LIMIT) {
    throw new AppError("Notes must be 500 characters or less.", 400);
  }
  const requestId = text(input.requestId);
  if (requestId.length > 80) {
    throw new AppError(DETAILS, 400);
  }
  return {
    paymentMethod,
    paymentDate: dateFromKey(paymentDate),
    paymentDateKey: paymentDate,
    paymentReference,
    notes,
    requestId,
  };
}

export function validateReversePayment(body) {
  const input = requireObject(body);
  const reason = text(input.reason);
  if (reason.length < SALARY_REVERSAL_REASON_MIN) {
    throw new AppError("Enter a reversal reason of at least 5 characters.", 400);
  }
  if (reason.length > SALARY_REVERSAL_REASON_MAX) {
    throw new AppError("Reversal reason must be 300 characters or less.", 400);
  }
  return { reason };
}

function parsePage(value) {
  if (value === undefined || value === null || value === "") return 1;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) throw new AppError("Please select a valid page.", 400);
  return page;
}

function parseLimit(value) {
  if (value === undefined || value === null || value === "") return SALARY_PAYMENT_PAGE_LIMIT;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > SALARY_PAYMENT_MAX_PAGE_LIMIT) {
    throw new AppError("Please select a valid page size.", 400);
  }
  return limit;
}

export function validatePaymentListQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  const status = text(source.status || "");
  if (status && status !== "all" && !["paid", "reversed"].includes(status)) {
    throw new AppError("Please select a valid payment status.", 400);
  }
  const paymentMethod = text(source.paymentMethod || "");
  if (paymentMethod && paymentMethod !== "all" && !SALARY_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new AppError("Choose cash, UPI, or bank transfer.", 400);
  }
  const month = source.month === undefined || source.month === "" ? null : Number(source.month);
  const year = source.year === undefined || source.year === "" ? null : Number(source.year);
  if ((month === null) !== (year === null)) {
    throw new AppError("Select both month and year.", 400);
  }
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000)) {
    throw new AppError("Please select a valid salary period.", 400);
  }
  const employeeId = text(source.employeeId);
  if (employeeId && !mongoose.isValidObjectId(employeeId)) {
    throw new AppError("Employee not found.", 404);
  }
  return {
    status: status === "all" ? "" : status,
    paymentMethod: paymentMethod === "all" ? "" : paymentMethod,
    month,
    year,
    employeeId,
    page: parsePage(source.page),
    limit: parseLimit(source.limit),
  };
}

export function parsePaymentId(value) {
  if (!mongoose.isValidObjectId(text(value))) {
    throw new AppError("Payment could not be found.", 404);
  }
  return text(value);
}
