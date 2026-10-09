import {
  cancelLeaveRequest,
  createLeaveRequest,
  employeeNotificationPreferences,
  getAdvanceDetail,
  getAdvanceSummary,
  getAdvanceTransactions,
  getAttendance,
  getAttendanceSummary,
  getHome,
  getLeaveDetail,
  getLeaveRequests,
  getProfile,
  getSalaryDetail,
  getSalaryList,
  getSalaryReceipt,
  getSalaryReceiptPdf,
  listEmployeeNotifications,
  markAllEmployeeNotificationsRead,
  markEmployeeNotificationRead,
  registerEmployeePushToken,
  removeEmployeePushToken,
  updateEmployeeNotificationPreferences,
} from "../services/employeePortal.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validatePushToken } from "../validators/notification.validator.js";
import { validateEmployeeLeave, validateEmployeePreferences } from "../validators/employeePortal.validator.js";

export async function profile(req, res) {
  sendSuccess(res, "Profile fetched successfully", await getProfile(req.employee));
}

export async function home(req, res) {
  sendSuccess(res, "Dashboard fetched successfully", await getHome(req.employee));
}

export async function attendance(req, res) {
  sendSuccess(res, "Attendance fetched successfully", await getAttendance(req.employee, req.query.month));
}

export async function attendanceSummary(req, res) {
  sendSuccess(res, "Attendance fetched successfully", await getAttendanceSummary(req.employee, req.query.month));
}

export async function salaries(req, res) {
  sendSuccess(res, "Salary fetched successfully", await getSalaryList(req.employee, req.query));
}

export async function salary(req, res) {
  sendSuccess(res, "Salary fetched successfully", await getSalaryDetail(req.employee, req.params.salaryId));
}

export async function advances(req, res) {
  sendSuccess(res, "Advance fetched successfully", await getAdvanceSummary(req.employee));
}

export async function advance(req, res) {
  sendSuccess(res, "Advance fetched successfully", await getAdvanceDetail(req.employee, req.params.id));
}

export async function advanceTransactions(req, res) {
  sendSuccess(res, "Advance fetched successfully", await getAdvanceTransactions(req.employee, req.query));
}

export async function createLeave(req, res) {
  const input = validateEmployeeLeave(req.body);
  const data = await createLeaveRequest(req.employee, input);
  sendSuccess(res, "Leave request sent.", data, 201);
}

export async function leaves(req, res) {
  sendSuccess(res, "Leave fetched successfully", await getLeaveRequests(req.employee, req.query));
}

export async function leave(req, res) {
  sendSuccess(res, "Leave fetched successfully", await getLeaveDetail(req.employee, req.params.id));
}

export async function cancelLeave(req, res) {
  const data = await cancelLeaveRequest(req.employee, req.params.id);
  sendSuccess(res, "Leave cancelled.", data);
}

export async function receipt(req, res) {
  const data = await getSalaryReceipt(req.employee, req.params.salaryId);
  sendSuccess(res, "Receipt fetched successfully", data);
}

export async function receiptPdf(req, res) {
  const file = await getSalaryReceiptPdf(req.employee, req.params.salaryId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.send(file.buffer);
}

export async function notifications(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  sendSuccess(res, "Notifications fetched successfully", await listEmployeeNotifications(req.employee, page, limit));
}

export async function readNotification(req, res) {
  sendSuccess(res, "Notification updated", await markEmployeeNotificationRead(req.employee, req.params.id));
}

export async function readAllNotifications(req, res) {
  sendSuccess(res, "Notifications updated", await markAllEmployeeNotificationsRead(req.employee));
}

export async function savePushToken(req, res) {
  const input = validatePushToken(req.body);
  sendSuccess(res, "Push token saved", await registerEmployeePushToken(req.employee, input));
}

export async function deletePushToken(req, res) {
  sendSuccess(res, "Push token removed", await removeEmployeePushToken(req.employee, req.body?.token));
}

export async function preferences(req, res) {
  sendSuccess(res, "Preferences fetched successfully", employeeNotificationPreferences(req.employee));
}

export async function savePreferences(req, res) {
  const input = validateEmployeePreferences(req.body);
  sendSuccess(res, "Preferences updated", await updateEmployeeNotificationPreferences(req.employee, input));
}
