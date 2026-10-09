import mongoose from "mongoose";
import { LEAVE_MAX_PAGE_LIMIT, LEAVE_NOTE_LIMIT, LEAVE_PAGE_LIMIT, LEAVE_STATUSES, LEAVE_TYPES } from "../constants/leave.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, isValidCalendarKey, todayKey } from "../utils/attendanceDate.js";

const DETAILS = "Please check the leave details and try again.";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function requireObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError(DETAILS, 400);
  }
  return body;
}

function parseEmployeeId(value, { required = true } = {}) {
  const id = text(value);
  if (!id) {
    if (!required) return "";
    throw new AppError("Please select an employee.", 400);
  }
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Employee not found.", 404);
  }
  return id;
}

function parseLeaveId(value) {
  const id = text(value);
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Leave could not be found.", 404);
  }
  return id;
}

function parseDate(value, label) {
  const key = text(value);
  if (!isValidCalendarKey(key)) {
    throw new AppError(`Please select a valid ${label.toLowerCase()}.`, 400);
  }
  return { key, date: dateFromKey(key) };
}

function parseReason(value, { required, label }) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new AppError(`${label} is required.`, 400);
    }
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  const reason = value.trim();
  if (required && !reason) {
    throw new AppError(`${label} is required.`, 400);
  }
  if (reason.length > LEAVE_NOTE_LIMIT) {
    throw new AppError(`${label} must be ${LEAVE_NOTE_LIMIT} characters or less.`, 400);
  }
  return reason;
}

function parseLeaveBody(body, { historical }) {
  const input = requireObject(body);
  const leaveType = text(input.leaveType);
  if (!LEAVE_TYPES.includes(leaveType)) {
    throw new AppError("Please select paid, unpaid, or sick leave.", 400);
  }
  const start = parseDate(input.startDate, "Start date");
  const end = parseDate(input.endDate, "End date");
  if (start.key > end.key) {
    throw new AppError("The start date must be on or before the end date.", 400);
  }
  return {
    employeeId: parseEmployeeId(input.employeeId),
    leaveType,
    startKey: start.key,
    endKey: end.key,
    startDate: start.date,
    endDate: end.date,
    reason: parseReason(input.reason, { required: false, label: "Reason" }),
    notes: parseReason(input.notes, { required: false, label: "Notes" }),
    confirmHistorical: input.confirmHistorical === true,
    resolveAttendance: input.resolveAttendance === true,
    historical,
    today: todayKey(),
  };
}

export function validateCreateLeave(body) {
  return parseLeaveBody(body, { historical: false });
}

export function validateRecordLeave(body) {
  return parseLeaveBody(body, { historical: true });
}

export function validateRejectLeave(body) {
  const input = requireObject(body);
  return {
    reason: parseReason(input.reason, { required: true, label: "Rejection reason" }),
  };
}

export function validateApproveLeave(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  return { resolveAttendance: input.resolveAttendance === true };
}

export function parseLeaveIdParam(value) {
  return parseLeaveId(value);
}

function parsePage(value) {
  if (value === undefined || value === null || value === "") return 1;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Please select a valid page.", 400);
  }
  return page;
}

function parseLimit(value) {
  if (value === undefined || value === null || value === "") return LEAVE_PAGE_LIMIT;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > LEAVE_MAX_PAGE_LIMIT) {
    throw new AppError("Please select a valid page size.", 400);
  }
  return limit;
}

function parseOptionalDate(value, label) {
  if (value === undefined || value === null || value === "") return "";
  return parseDate(value, label).key;
}

export function validateLeaveListQuery(query, { defaultStatus = "pending", defaultMonth = false } = {}) {
  const source = query && typeof query === "object" ? query : {};
  const status = text(source.status || defaultStatus);
  if (status && status !== "all" && !LEAVE_STATUSES.includes(status)) {
    throw new AppError("Please select a valid leave status.", 400);
  }
  const leaveType = text(source.leaveType || "");
  if (leaveType && !LEAVE_TYPES.includes(leaveType)) {
    throw new AppError("Please select a valid leave type.", 400);
  }
  let startDate = parseOptionalDate(source.startDate, "Start date");
  let endDate = parseOptionalDate(source.endDate, "End date");
  if (defaultMonth && !startDate && !endDate) {
    const today = todayKey();
    startDate = `${today.slice(0, 8)}01`;
    const [year, month] = today.split("-").map(Number);
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    endDate = `${today.slice(0, 8)}${String(last).padStart(2, "0")}`;
  }
  if (startDate && endDate && startDate > endDate) {
    throw new AppError("The start date must be on or before the end date.", 400);
  }
  return {
    status: status === "all" ? "" : status,
    leaveType,
    employeeId: source.employeeId ? parseEmployeeId(source.employeeId) : "",
    startDate,
    endDate,
    page: parsePage(source.page),
    limit: parseLimit(source.limit),
  };
}

export function validateEmployeeLeaveQuery(query) {
  return validateLeaveListQuery(query, { defaultStatus: "", defaultMonth: false });
}

export function validateHistoryQuery(query) {
  return validateLeaveListQuery(query, { defaultStatus: "", defaultMonth: true });
}
