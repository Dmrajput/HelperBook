import { getCurrentUser, loginWithOtp, refreshSession, revokeAllSessions, revokeSession } from "../services/auth.service.js";
import { requestOtp as sendOtp } from "../services/otp/otp.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateRefreshToken, validateRequestOtp, validateVerifyOtp } from "../validators/auth.validator.js";

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "unknown").replace("::ffff:", "");
}

export async function requestOtp(req, res) {
  const { phone } = validateRequestOtp(req.body);
  const data = await sendOtp({ phone, ip: clientIp(req) });
  sendSuccess(res, "OTP sent successfully", data);
}

export async function verifyOtp(req, res) {
  const input = validateVerifyOtp(req.body);
  const result = await loginWithOtp({ ...input, ip: clientIp(req) });
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
