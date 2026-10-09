import {
  getEmployeeMe,
  loginEmployeeWithPassword,
  logoutAllEmployee,
  logoutEmployee,
  refreshEmployeeSession,
  requestEmployeePasswordReset,
  resetEmployeePassword,
} from "../services/employeeAuth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateForgotPassword, validatePasswordLogin, validateRefreshToken, validateResetPassword } from "../validators/auth.validator.js";

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "unknown").replace("::ffff:", "");
}

export async function login(req, res) {
  const input = validatePasswordLogin(req.body);
  const result = await loginEmployeeWithPassword(input, clientIp(req));
  sendSuccess(res, result.message, result.data);
}

export async function forgotPassword(req, res) {
  const { phone } = validateForgotPassword(req.body);
  const result = await requestEmployeePasswordReset(phone, clientIp(req));
  sendSuccess(res, result.message, result.data);
}

export async function resetPassword(req, res) {
  const input = validateResetPassword(req.body);
  const result = await resetEmployeePassword(input, clientIp(req));
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
