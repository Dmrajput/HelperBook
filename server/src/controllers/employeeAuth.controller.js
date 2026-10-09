import {
  getEmployeeMe,
  logoutAllEmployee,
  logoutEmployee,
  refreshEmployeeSession,
  requestEmployeeOtp,
  verifyEmployeeOtp,
} from "../services/employeeAuth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateRefreshToken, validateRequestOtp, validateVerifyOtp } from "../validators/auth.validator.js";

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "unknown").replace("::ffff:", "");
}

export async function requestOtp(req, res) {
  const { phone } = validateRequestOtp(req.body);
  const result = await requestEmployeeOtp(phone, clientIp(req));
  sendSuccess(res, result.message, result.data);
}

export async function verifyOtp(req, res) {
  const input = validateVerifyOtp(req.body);
  const result = await verifyEmployeeOtp(input, clientIp(req));
  sendSuccess(res, result.message, result.data);
}

export async function refreshToken(req, res) {
  const token = validateRefreshToken(req.body);
  const result = await refreshEmployeeSession(token, clientIp(req));
  sendSuccess(res, result.message, result.data);
}

export async function logout(req, res) {
  const token = validateRefreshToken(req.body);
  const result = await logoutEmployee(token);
  sendSuccess(res, result.message, null);
}

export async function logoutAll(req, res) {
  const result = await logoutAllEmployee(req.employee._id);
  sendSuccess(res, result.message, null);
}

export async function getMe(req, res) {
  const data = await getEmployeeMe(req.employee);
  sendSuccess(res, "Profile fetched successfully", data);
}
