import { getAuthConfig } from "../../config/auth.js";
import OtpRateLimit from "../../models/OtpRateLimit.js";
import OtpVerification from "../../models/OtpVerification.js";
import User from "../../models/User.js";
import { AppError } from "../../utils/appError.js";
import { createOtpHash, generateOtpCode, otpMatches } from "../../utils/tokens.js";
import { getOtpProvider } from "./otp.provider.js";

const HOUR_MS = 60 * 60 * 1000;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

async function takeSlot(key, max, windowMs) {
  const now = new Date();
  const windowStart = now.getTime() - windowMs;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      let record = await OtpRateLimit.findOne({ key });
      if (!record) {
        record = new OtpRateLimit({
          key,
          hits: [],
          expiresAt: new Date(now.getTime() + windowMs),
        });
      }

      record.hits = (record.hits || []).filter((hit) => new Date(hit).getTime() >= windowStart);
      record.markModified("hits");

      if (record.hits.length >= max) {
        return false;
      }

      record.hits.push(now);
      record.expiresAt = new Date(now.getTime() + windowMs);
      await record.save();
      return true;
    } catch (error) {
      if (error?.code === 11000 && attempt === 0) {
        continue;
      }
      throw error;
    }
  }

  return false;
}

async function assertSendLimits(e164, ip) {
  const config = getAuthConfig();
  const phoneAllowed = await takeSlot(
    `otp-phone:${e164}`,
    config.otpMaxRequestsPerHour,
    HOUR_MS
  );

  if (!phoneAllowed) {
    throw new AppError("Too many OTP requests. Please try again later.", 429);
  }

  const ipAllowed = await takeSlot(
    `otp-ip:${ip || "unknown"}`,
    config.otpMaxIpRequestsPerHour,
    HOUR_MS
  );

  if (!ipAllowed) {
    throw new AppError("Too many OTP requests. Please try again later.", 429);
  }
}

async function assertVerifyLimit(ip) {
  const config = getAuthConfig();
  const allowed = await takeSlot(
    `verify-ip:${ip || "unknown"}`,
    config.otpVerifyMaxPerWindow,
    VERIFY_WINDOW_MS
  );

  if (!allowed) {
    throw new AppError("Too many attempts. Please request a new OTP.", 429);
  }
}

export async function requestPasswordReset({ phone, ip }) {
  const config = getAuthConfig();
  const quiet = {
    expiresIn: config.otpExpiryMinutes * 60,
    resendAfter: config.otpResendCooldownSeconds,
  };
  const userExists = await User.exists({
    countryCode: phone.countryCode,
    phoneNumber: phone.nationalNumber,
  });

  if (!userExists) {
    return quiet;
  }

  const existing = await OtpVerification.findOne({ phoneNumber: phone.e164 });
  if (existing?.lastSentAt) {
    const elapsedSeconds = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
    if (elapsedSeconds < config.otpResendCooldownSeconds) {
      throw new AppError("Please wait before requesting another OTP.", 429);
    }
  }

  await assertSendLimits(phone.e164, ip);

  const otp = generateOtpCode();
  const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

  await OtpVerification.findOneAndUpdate(
    { phoneNumber: phone.e164 },
    {
      phoneNumber: phone.e164,
      otpHash: createOtpHash(otp),
      purpose: "password_reset",
      attempts: 0,
      maxAttempts: config.otpMaxAttempts,
      expiresAt,
      lastSentAt: new Date(),
      verifiedAt: null,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  try {
    await getOtpProvider().sendOtp(phone.e164, otp);
  } catch {
    await OtpVerification.deleteOne({ phoneNumber: phone.e164 });
    throw new AppError("Unable to send OTP. Please try again.", 503, true);
  }

  return quiet;
}

export async function verifyOtpCode({ phone, otp, ip }) {
  await assertVerifyLimit(ip);

  const record = await OtpVerification.findOne({ phoneNumber: phone.e164 });

  if (!record || record.verifiedAt) {
    throw new AppError(
      record?.verifiedAt
        ? "This OTP has already been used. Please request a new one."
        : "This OTP has expired. Please request a new one.",
      400
    );
  }

  if (record.attempts >= record.maxAttempts) {
    throw new AppError("Too many attempts. Please request a new OTP.", 429);
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new AppError("This OTP has expired. Please request a new one.", 400);
  }

  if (!otpMatches(otp, record.otpHash)) {
    record.attempts += 1;
    await record.save();

    if (record.attempts >= record.maxAttempts) {
      throw new AppError("Too many attempts. Please request a new OTP.", 429);
    }

    throw new AppError("Incorrect OTP. Please try again.", 401);
  }

  if (record.purpose !== "password_reset") {
    throw new AppError("This OTP has expired. Please request a new one.", 400);
  }

  record.verifiedAt = new Date();
  await record.save();
  return record;
}
