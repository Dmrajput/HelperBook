import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import {
  bulkMarkAttendance,
  getAttendanceByDate,
  getAttendanceHistory,
  getEmployeeAttendance,
  getMonthlyAttendance,
  markAttendance,
  updateAttendance,
} from "../services/attendance.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { dateFromKey, isValidCalendarKey } from "../utils/attendanceDate.js";
import { AppError } from "../utils/appError.js";
import {
  parseEmployeeId,
  validateBulkPayload,
  validateEmployeeHistoryQuery,
  validateHistoryQuery,
  validateMarkPayload,
  validateMonthParams,
  validateUpdatePayload,
  parseAttendanceDate,
} from "../validators/attendance.validator.js";

function dateParam(value) {
  if (!isValidCalendarKey(value)) {
    throw new AppError("Please select a valid date.", 400);
  }
  dateFromKey(value);
  return value;
}

export async function getByDate(req, res) {
  const key = dateParam(req.params.date);
  parseAttendanceDate(key, EMPLOYEE_TIME_ZONE);
  const data = await getAttendanceByDate(req.user.id, key);
  sendSuccess(res, "Attendance fetched successfully", data);
}

export async function createAttendance(req, res) {
  const payload = validateMarkPayload(req.body, EMPLOYEE_TIME_ZONE);
  const attendance = await markAttendance(req.user.id, payload);
  sendSuccess(res, "Attendance marked successfully.", { attendance }, 201);
}

export async function editAttendance(req, res) {
  const payload = validateUpdatePayload(req.body);
  const attendance = await updateAttendance(req.user.id, req.params.id, payload);
  sendSuccess(res, "Attendance updated successfully.", { attendance });
}

export async function createBulkAttendance(req, res) {
  const payload = validateBulkPayload(req.body, EMPLOYEE_TIME_ZONE);
  const data = await bulkMarkAttendance(req.user.id, payload);
  sendSuccess(res, "Bulk attendance processed successfully", data);
}

export async function getMonth(req, res) {
  const { year, month } = validateMonthParams(req.params, EMPLOYEE_TIME_ZONE);
  const employeeId = req.query.employeeId ? parseEmployeeId(req.query.employeeId) : "";
  const data = await getMonthlyAttendance(req.user.id, year, month, employeeId);
  sendSuccess(res, "Monthly attendance fetched successfully", data);
}

export async function getHistory(req, res) {
  const query = validateHistoryQuery(req.query, EMPLOYEE_TIME_ZONE);
  const data = await getAttendanceHistory(req.user.id, query);
  sendSuccess(res, "Attendance history fetched successfully", data);
}

export async function getEmployeeHistory(req, res) {
  const employeeId = parseEmployeeId(req.params.employeeId);
  const query = validateEmployeeHistoryQuery(req.query, EMPLOYEE_TIME_ZONE);
  const data = await getEmployeeAttendance(req.user.id, employeeId, query);
  sendSuccess(res, "Employee attendance fetched successfully", data);
}
