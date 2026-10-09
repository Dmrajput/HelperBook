import { LEAVE_NOTE_LIMIT, LEAVE_TYPES } from "../constants/leave.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, isValidCalendarKey, todayKey } from "../utils/attendanceDate.js";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateEmployeeLeave(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Please check the leave details and try again.", 400);
  }
  const leaveType = text(body.leaveType);
  if (!LEAVE_TYPES.includes(leaveType)) {
    throw new AppError("Please select paid, unpaid, or sick leave.", 400);
  }
  const startKey = text(body.startDate);
  const endKey = text(body.endDate);
  if (!isValidCalendarKey(startKey) || !isValidCalendarKey(endKey) || startKey > endKey) {
    throw new AppError("Please select a valid date range.", 400);
  }
  const reason = text(body.reason);
  if (reason.length > LEAVE_NOTE_LIMIT) {
    throw new AppError(`Reason must be ${LEAVE_NOTE_LIMIT} characters or less.`, 400);
  }
  return {
    leaveType,
    startKey,
    endKey,
    startDate: dateFromKey(startKey),
    endDate: dateFromKey(endKey),
    reason,
    today: todayKey(),
    historical: false,
    confirmHistorical: false,
  };
}

export function validateEmployeePreferences(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Please check the notification settings.", 400);
  }
  return {
    pushEnabled: body.pushEnabled !== false,
    leaveUpdatesEnabled: body.leaveUpdatesEnabled !== false,
    salaryPaidEnabled: body.salaryPaidEnabled !== false,
  };
}
