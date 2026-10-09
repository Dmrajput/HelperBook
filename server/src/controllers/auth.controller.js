import {
  getCurrentUser,
  loginWithPassword,
  refreshSession,
  registerOwner,
  resetPassword,
  revokeAllSessions,
  revokeSession,
} from "../services/auth.service.js";
import { requestPasswordReset } from "../services/otp/otp.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  validateForgotPassword,
  validatePasswordLogin,
  validateRefreshToken,
  validateRegister,
  validateResetPassword,
} from "../validators/auth.validator.js";

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "unknown").replace("::ffff:", "");
}

export async function register(req, res) {
  const input = validateRegister(req.body);
  const result = await registerOwner({ ...input, ip: clientIp(req) });
  sendSuccess(res, result.message, result.data, 201);
}

export async function login(req, res) {
  const input = validatePasswordLogin(req.body);
  const result = await loginWithPassword({ ...input, ip: clientIp(req) });
  sendSuccess(res, result.message, result.data);
}

export async function forgotPassword(req, res) {
  const { phone } = validateForgotPassword(req.body);
  const data = await requestPasswordReset({ phone, ip: clientIp(req) });
  sendSuccess(res, "If this number is registered, a code was sent.", data);
}

export async function resetOwnerPassword(req, res) {
  const input = validateResetPassword(req.body);
  const result = await resetPassword({ ...input, ip: clientIp(req) });
  sendSuccess(res, result.message, result.data);
}

export async function refreshToken(req, res) {
  const token = validateRefreshToken(req.body);
  const data = await refreshSession({ refreshToken: token, ip: clientIp(req) });
  sendSuccess(res, "Session refreshed", data);
}

export async function logout(req, res) {
  const token = validateRefreshToken(req.body);
  await revokeSession({ userId: req.user.id, refreshToken: token });
  sendSuccess(res, "Logged out successfully", null);
}

export async function logoutAll(req, res) {
  await revokeAllSessions(req.user.id);
  sendSuccess(res, "Logged out from all devices.", null);
}

export async function getMe(req, res) {
  const user = await getCurrentUser(req.user.id);
  sendSuccess(res, "User profile fetched", { user });
}
