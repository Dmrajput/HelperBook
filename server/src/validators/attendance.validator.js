import mongoose from "mongoose";
import {
  ATTENDANCE_NOTE_LIMIT,
  ATTENDANCE_STATUSES,
  DEFAULT_PAGE_LIMIT,
  MAX_BULK_RECORDS,
  MAX_PAGE_LIMIT,
} from "../constants/attendance.js";
import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import { AppError } from "../utils/appError.js";
import { currentMonth, dateFromKey, isValidCalendarKey, todayKey } from "../utils/attendanceDate.js";

const DETAILS = "Please check the attendance details.";

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

export function parseAttendanceDate(value, timeZone = EMPLOYEE_TIME_ZONE) {
  const raw = text(value);
  if (!isValidCalendarKey(raw)) {
    throw new AppError("Please select a valid date.", 400);
  }
  if (raw > todayKey(timeZone)) {
    throw new AppError("Attendance cannot be marked for a future date.", 400);
  }
  return { key: raw, date: dateFromKey(raw) };
}

export function parseStatus(value) {
  const status = text(value);
  if (!ATTENDANCE_STATUSES.includes(status)) {
    throw new AppError("Please select a valid attendance status.", 400);
  }
  return status;
}

export function parseNotes(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  const notes = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (notes.length > ATTENDANCE_NOTE_LIMIT) {
    throw new AppError("Notes cannot be longer than 500 characters.", 400);
  }
  return notes;
}

export function parseEmployeeId(value) {
  const employeeId = text(value);
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError("Please select an employee.", 400);
  }
  return employeeId;
}

function parseOptionalEmployeeId(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return parseEmployeeId(value);
}

function parsePage(value) {
  if (value === undefined || value === null || value === "") {
    return 1;
  }
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(DETAILS, 400);
  }
  return page;
}

function parseLimit(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_PAGE_LIMIT;
  }
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError(DETAILS, 400);
  }
  return Math.min(limit, MAX_PAGE_LIMIT);
}

function parseOptionalStatus(value) {
  if (value === undefined || value === null || value === "" || value === "all") {
    return "";
  }
  return parseStatus(value);
}

export function parseDateRange(query, timeZone = EMPLOYEE_TIME_ZONE) {
  const current = currentMonth(timeZone);
  const startRaw = query?.startDate ? text(query.startDate) : `${current.year}-${String(current.month).padStart(2, "0")}-01`;
  const endRaw = query?.endDate ? text(query.endDate) : current.today;
  if (!isValidCalendarKey(startRaw) || !isValidCalendarKey(endRaw)) {
    throw new AppError("Please select a valid date.", 400);
  }
  const endKey = endRaw > current.today ? current.today : endRaw;
  if (startRaw > endKey) {
    throw new AppError("The start date must be on or before the end date.", 400);
  }
  return { startKey: startRaw, endKey, start: dateFromKey(startRaw), end: dateFromKey(endKey) };
}

export function validateMarkPayload(body, timeZone) {
  const payload = requireObject(body);
  return {
    employeeId: parseEmployeeId(payload.employeeId),
    ...parseAttendanceDate(payload.date, timeZone),
    status: parseStatus(payload.status),
    notes: parseNotes(payload.notes),
  };
}

export function validateUpdatePayload(body) {
  const payload = requireObject(body);
  return {
    status: parseStatus(payload.status),
    notes: parseNotes(payload.notes),
  };
}

export function validateBulkPayload(body, timeZone) {
  const payload = requireObject(body);
  const date = parseAttendanceDate(payload.date, timeZone);
  if (!Array.isArray(payload.records) || payload.records.length === 0) {
    throw new AppError("Select at least one employee.", 400);
  }
  if (payload.records.length > MAX_BULK_RECORDS) {
    throw new AppError("Too many employees were selected.", 400);
  }
  const seen = new Set();
  const records = payload.records.map((record) => {
    const item = requireObject(record);
    const employeeId = parseEmployeeId(item.employeeId);
    if (seen.has(employeeId)) {
      throw new AppError("Each employee can only be included once.", 400);
    }
    seen.add(employeeId);
    return {
      employeeId,
      status: parseStatus(item.status),
      notes: parseNotes(item.notes),
    };
  });
  return {
    ...date,
    records,
    overwriteExisting: payload.overwriteExisting === true,
  };
}

export function validateMonthParams(params, timeZone = EMPLOYEE_TIME_ZONE) {
  const year = Number(params.year);
  const month = Number(params.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
    throw new AppError("Please select a valid month.", 400);
  }
  const current = currentMonth(timeZone);
  if (year > current.year || (year === current.year && month > current.month)) {
    throw new AppError("Future months are not available.", 400);
  }
  return { year, month };
}

export function validateHistoryQuery(query, timeZone) {
  const range = parseDateRange(query, timeZone);
  return {
    ...range,
    employeeId: parseOptionalEmployeeId(query?.employeeId),
    status: parseOptionalStatus(query?.status),
    page: parsePage(query?.page),
    limit: parseLimit(query?.limit),
  };
}

export function validateEmployeeHistoryQuery(query, timeZone) {
  return validateHistoryQuery(query, timeZone);
}
