import { normalizeIndianPhone } from "../utils/phone.js";
import { AppError } from "../utils/appError.js";

function cleanText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\r\n]/g, "").trim().slice(0, maxLength);
}

function readDevice(body) {
  const platform = cleanText(body?.platform, 20);
  const allowedPlatforms = ["ios", "android", "web", "unknown"];

  return {
    deviceId: cleanText(body?.deviceId, 128) || "unknown",
    deviceName: cleanText(body?.deviceName, 80) || "Unknown device",
    platform: allowedPlatforms.includes(platform) ? platform : "unknown",
  };
}

export function validateRequestOtp(body) {
  return {
    phone: normalizeIndianPhone(body?.phoneNumber, body?.countryCode),
  };
}

export function validateVerifyOtp(body) {
  const phone = normalizeIndianPhone(body?.phoneNumber, body?.countryCode);
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  if (!/^\d{6}$/.test(otp)) {
    throw new AppError("Enter the 6-digit OTP.", 400);
  }

  return {
    phone,
    otp,
    device: readDevice(body),
  };
}

function assertOwnerPassword(password) {
  if (
    typeof password !== "string"
    || password.length < 8
    || password.length > 64
    || !/[A-Za-z]/.test(password)
    || !/\d/.test(password)
  ) {
    throw new AppError("Use 8 to 64 characters with at least one letter and one number.", 400);
  }
}

export function validateRegister(body) {
  const fullName = cleanText(body?.fullName, 100);
  if (fullName.length < 2) {
    throw new AppError("Enter your name.", 400);
  }

  const password = typeof body?.password === "string" ? body.password : "";
  assertOwnerPassword(password);

  return {
    phone: normalizeIndianPhone(body?.phoneNumber, body?.countryCode),
    fullName,
    password,
    device: readDevice(body),
  };
}

export function validatePasswordLogin(body) {
  return {
    phone: normalizeIndianPhone(body?.phoneNumber, body?.countryCode),
    password: typeof body?.password === "string" ? body.password : "",
    device: readDevice(body),
  };
}

export function validateForgotPassword(body) {
  return {
    phone: normalizeIndianPhone(body?.phoneNumber, body?.countryCode),
  };
}

export function validateResetPassword(body) {
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  if (!/^\d{6}$/.test(otp)) {
    throw new AppError("Enter the 6-digit OTP.", 400);
  }

  const password = typeof body?.password === "string" ? body.password : "";
  assertOwnerPassword(password);

  return {
    phone: normalizeIndianPhone(body?.phoneNumber, body?.countryCode),
    otp,
    password,
    device: readDevice(body),
  };
}

export function validateRefreshToken(body) {
  const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken.trim() : "";

  if (!refreshToken || refreshToken.length > 4000) {
    throw new AppError("Refresh token is required.", 400);
  }

  return refreshToken;
}
