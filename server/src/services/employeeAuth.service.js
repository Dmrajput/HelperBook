import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import EmployeeOtpVerification from "../models/EmployeeOtpVerification.js";
import EmployeeSession from "../models/EmployeeSession.js";
import Shop from "../models/Shop.js";
import { getAuthConfig } from "../config/auth.js";
import OtpRateLimit from "../models/OtpRateLimit.js";
import { getOtpProvider } from "./otp/otp.provider.js";
import { AppError } from "../utils/appError.js";
import {
  createOtpHash,
  generateOtpCode,
  hashToken,
  otpMatches,
  signEmployeeAccessToken,
  signEmployeeRefreshToken,
  tokenExpiryDate,
  tokenHashMatches,
  verifyEmployeeRefreshToken,
} from "../utils/tokens.js";

const HOUR_MS = 60 * 60 * 1000;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

async function takeSlot(key, max, windowMs) {
  const now = new Date();
  const windowStart = now.getTime() - windowMs;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      let record = await OtpRateLimit.findOne({ key });
      if (!record) {
        record = new OtpRateLimit({ key, hits: [], expiresAt: new Date(now.getTime() + windowMs) });
      }
      record.hits = (record.hits || []).filter((hit) => new Date(hit).getTime() >= windowStart);
      record.markModified("hits");
      if (record.hits.length >= max) return false;
      record.hits.push(now);
      record.expiresAt = new Date(now.getTime() + windowMs);
      await record.save();
      return true;
    } catch (error) {
      if (error?.code === 11000 && attempt === 0) continue;
      throw error;
    }
  }
  return false;
}

const GENERIC_RESET = "If this number is registered for an active employee account, a code was sent.";
const INVALID_OTP = "The code is incorrect or has expired.";
const INVALID_LOGIN = "The mobile number or password is incorrect.";
const PASSWORD_NOT_SET = "This number does not have a password yet. Use Forgot password to set one.";
let dummyPasswordHash;
const SESSION_EXPIRED = "Your session has expired. Please log in again.";

async function assertSendLimits(e164, ip) {
  const config = getAuthConfig();
  const phoneAllowed = await takeSlot(`eotp-phone:${e164}`, config.otpMaxRequestsPerHour, HOUR_MS);
  const ipAllowed = await takeSlot(`eotp-ip:${ip || "unknown"}`, config.otpMaxIpRequestsPerHour, HOUR_MS);
  if (!phoneAllowed || !ipAllowed) {
    throw new AppError("Too many OTP requests. Please try again later.", 429);
  }
}

async function assertVerifyLimit(ip) {
  const config = getAuthConfig();
  const allowed = await takeSlot(`everify-ip:${ip || "unknown"}`, config.otpVerifyMaxPerWindow, VERIFY_WINDOW_MS);
  if (!allowed) throw new AppError("Too many attempts. Please request a new OTP.", 429);
}

async function assertRefreshLimit(ip) {
  const config = getAuthConfig();
  const allowed = await takeSlot(`erefresh-ip:${ip || "unknown"}`, config.refreshMaxPerWindow, VERIFY_WINDOW_MS);
  if (!allowed) throw new AppError("Too many attempts. Please try again later.", 429);
}

export async function revokeEmployeeAccess(employeeId) {
  const now = new Date();
  await EmployeeSession.updateMany({ employeeId, revokedAt: null }, { revokedAt: now });
  const { default: PushToken } = await import("../models/PushToken.js");
  await PushToken.updateMany({ employeeId, isActive: true }, { isActive: false });
}

async function eligibleEmployees(e164) {
  return Employee.find({
    phone: e164,
    status: "active",
    loginEnabled: true,
  });
}

async function compareWithDummy(password) {
  if (!dummyPasswordHash) {
    dummyPasswordHash = await bcrypt.hash("helperbook-employee-timing", 12);
  }
  await bcrypt.compare(String(password || ""), dummyPasswordHash);
}

export async function requestEmployeePasswordReset(phone, clientIp) {
  const config = getAuthConfig();
  const existing = await EmployeeOtpVerification.findOne({ phoneNumber: phone.e164, purpose: "password_reset" });
  const matches = await eligibleEmployees(phone.e164);
  if (matches.length === 1 && existing?.lastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < config.otpResendCooldownSeconds) {
      throw new AppError("Please wait before requesting another code.", 429);
    }
  }
  await assertSendLimits(phone.e164, clientIp);
  const quiet = { message: GENERIC_RESET, data: { resendAfter: config.otpResendCooldownSeconds } };
  if (matches.length !== 1) {
    if (matches.length > 1) {
      console.warn("[employee-auth] ambiguous phone reset was blocked");
    }
    return quiet;
  }

  const employee = matches[0];
  const otp = generateOtpCode();
  const now = new Date();
  await EmployeeOtpVerification.findOneAndUpdate(
    { phoneNumber: phone.e164, purpose: "password_reset" },
    {
      employeeId: employee._id,
      shopId: employee.shopId,
      phoneNumber: phone.e164,
      hashedOtp: createOtpHash(otp),
      purpose: "password_reset",
      attempts: 0,
      maxAttempts: config.otpMaxAttempts,
      expiresAt: new Date(now.getTime() + config.otpExpiryMinutes * 60 * 1000),
      lastSentAt: now,
      verifiedAt: null,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  try {
    await getOtpProvider().sendOtp(phone.e164, otp);
  } catch {
    await EmployeeOtpVerification.deleteOne({ phoneNumber: phone.e164, purpose: "password_reset" });
    throw new AppError("Unable to send the code. Please try again.", 503);
  }
  return quiet;
}

async function openSession(employee, device) {
  const config = getAuthConfig();
  const active = await EmployeeSession.find({ employeeId: employee._id, revokedAt: null }).sort({ createdAt: 1 });
  const overflow = active.length - (config.maxActiveSessions - 1);
  if (overflow > 0) {
    const now = new Date();
    await EmployeeSession.updateMany(
      { _id: { $in: active.slice(0, overflow).map((session) => session._id) } },
      { revokedAt: now }
    );
  }

  const session = await EmployeeSession.create({
    employeeId: employee._id,
    shopId: employee.shopId,
    refreshTokenHash: "pending",
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    platform: device.platform,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    lastUsedAt: new Date(),
  });
  const refreshToken = signEmployeeRefreshToken(employee._id, session._id);
  session.refreshTokenHash = hashToken(refreshToken);
  session.expiresAt = tokenExpiryDate(refreshToken);
  await session.save();
  return { session, refreshToken, accessToken: signEmployeeAccessToken(employee, session._id) };
}

function publicAuthEmployee(employee) {
  return {
    id: String(employee._id),
    role: "employee",
    employeeId: String(employee._id),
    shopId: String(employee.shopId),
    name: employee.name,
    phone: employee.phone || null,
  };
}

function authResult(employee, tokens, message) {
  return {
    message,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: publicAuthEmployee(employee),
    },
  };
}

export async function loginEmployeeWithPassword({ phone, password, device }, clientIp) {
  const ipAllowed = await takeSlot(`elogin-ip:${clientIp || "unknown"}`, 20, VERIFY_WINDOW_MS);
  const phoneAllowed = await takeSlot(`elogin-phone:${phone.e164}`, 8, VERIFY_WINDOW_MS);
  if (!ipAllowed || !phoneAllowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const matches = await Employee.find({
    phone: phone.e164,
    status: "active",
    loginEnabled: true,
  }).select("+passwordHash");

  if (matches.length !== 1) {
    await compareWithDummy(password);
    if (matches.length > 1) {
      console.warn("[employee-auth] ambiguous phone login was blocked");
    }
    throw new AppError(INVALID_LOGIN, 401);
  }

  const employee = matches[0];
  if (!employee.passwordHash) {
    throw new AppError(PASSWORD_NOT_SET, 400);
  }

  const matchesPassword = await bcrypt.compare(String(password || ""), employee.passwordHash);
  if (!matchesPassword) {
    throw new AppError(INVALID_LOGIN, 401);
  }

  employee.lastLoginAt = new Date();
  if (!employee.employeeAuthCreatedAt) employee.employeeAuthCreatedAt = new Date();
  await employee.save();
  const tokens = await openSession(employee, device);
  return authResult(employee, tokens, "Login successful.");
}

export async function resetEmployeePassword({ phone, otp, password, device }, clientIp) {
  await assertVerifyLimit(clientIp);
  const record = await EmployeeOtpVerification.findOne({ phoneNumber: phone.e164, purpose: "password_reset" });
  if (!record || record.verifiedAt || record.expiresAt.getTime() <= Date.now() || record.purpose !== "password_reset") {
    throw new AppError(INVALID_OTP, 400);
  }
  if (record.attempts >= record.maxAttempts) {
    throw new AppError("Too many attempts. Request a new code.", 429);
  }
  if (!otpMatches(otp, record.hashedOtp)) {
    record.attempts += 1;
    await record.save();
    throw new AppError(INVALID_OTP, 400);
  }

  const employee = record.employeeId
    ? await Employee.findById(record.employeeId).select("+passwordHash")
    : null;
  if (!employee || employee.phone !== phone.e164 || employee.status !== "active" || !employee.loginEnabled) {
    throw new AppError(INVALID_OTP, 400);
  }

  record.verifiedAt = new Date();
  await record.save();
  employee.passwordHash = await bcrypt.hash(password, 12);
  employee.phoneVerified = true;
  employee.lastLoginAt = new Date();
  if (!employee.employeeAuthCreatedAt) employee.employeeAuthCreatedAt = new Date();
  await employee.save();

  const tokens = await openSession(employee, device);
  return authResult(employee, tokens, "Password updated.");
}

export async function refreshEmployeeSession(refreshToken, clientIp) {
  await assertRefreshLimit(`erefresh-ip:${clientIp || "unknown"}`);
  const payload = verifyEmployeeRefreshToken(refreshToken);
  const session = await EmployeeSession.findById(payload.sid);
  if (
    !session ||
    session.revokedAt ||
    String(session.employeeId) !== String(payload.sub) ||
    session.expiresAt.getTime() <= Date.now() ||
    !tokenHashMatches(refreshToken, session.refreshTokenHash)
  ) {
    throw new AppError(SESSION_EXPIRED, 401, true, { code: "INVALID_EMPLOYEE_SESSION" });
  }

  const employee = await Employee.findById(session.employeeId);
  if (!employee || employee.status !== "active" || !employee.loginEnabled) {
    session.revokedAt = new Date();
    await session.save();
    throw new AppError(SESSION_EXPIRED, 401, true, { code: "INVALID_EMPLOYEE_SESSION" });
  }

  const nextRefresh = signEmployeeRefreshToken(employee._id, session._id);
  session.refreshTokenHash = hashToken(nextRefresh);
  session.expiresAt = tokenExpiryDate(nextRefresh);
  session.lastUsedAt = new Date();
  await session.save();
  return {
    message: "Session refreshed.",
    data: {
      accessToken: signEmployeeAccessToken(employee, session._id),
      refreshToken: nextRefresh,
      user: publicAuthEmployee(employee),
    },
  };
}

export async function logoutEmployee(refreshToken) {
  try {
    const payload = verifyEmployeeRefreshToken(refreshToken);
    await EmployeeSession.updateOne({ _id: payload.sid, employeeId: payload.sub, revokedAt: null }, { revokedAt: new Date() });
  } catch {
    // Logout still clears the device even when the token is already invalid.
  }
  return { message: "Logged out." };
}

export async function logoutAllEmployee(employeeId) {
  await revokeEmployeeAccess(employeeId);
  return { message: "Logged out of all devices." };
}

export async function getEmployeeMe(employee) {
  const shop = await Shop.findById(employee.shopId).select("name logo");
  return {
    employee: {
      id: String(employee._id),
      name: employee.name,
      phone: employee.phone || null,
      role: employee.role,
      customRole: employee.customRole || null,
      joiningDate: employee.joiningDate,
      status: employee.status,
      lastLoginAt: employee.lastLoginAt,
    },
    shop: shop
      ? { id: String(shop._id), name: shop.name, logo: shop.logo || null }
      : null,
  };
}
