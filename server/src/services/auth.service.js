import mongoose from "mongoose";
import { getAuthConfig } from "../config/auth.js";
import OtpRateLimit from "../models/OtpRateLimit.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  tokenExpiryDate,
  tokenHashMatches,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { verifyOtpCode } from "./otp/otp.service.js";

const REFRESH_WINDOW_MS = 15 * 60 * 1000;
const INACTIVE_MESSAGE = "Account is inactive. Please contact support.";

async function assertRefreshLimit(ip) {
  const config = getAuthConfig();
  const now = new Date();
  const windowStart = now.getTime() - REFRESH_WINDOW_MS;
  const key = `refresh-ip:${ip || "unknown"}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      let record = await OtpRateLimit.findOne({ key });
      if (!record) {
        record = new OtpRateLimit({
          key,
          hits: [],
          expiresAt: new Date(now.getTime() + REFRESH_WINDOW_MS),
        });
      }

      record.hits = (record.hits || []).filter((hit) => new Date(hit).getTime() >= windowStart);
      record.markModified("hits");

      if (record.hits.length >= config.refreshMaxPerWindow) {
        throw new AppError("Too many requests. Please try again later.", 429);
      }

      record.hits.push(now);
      record.expiresAt = new Date(now.getTime() + REFRESH_WINDOW_MS);
      await record.save();
      return;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error?.code === 11000 && attempt === 0) {
        continue;
      }
      throw error;
    }
  }
}

export function toPublicUser(user) {
  return {
    id: String(user._id),
    phoneNumber: `${user.countryCode}${user.phoneNumber}`,
    fullName: user.fullName || "",
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
  };
}

async function openSession(user, device) {
  const config = getAuthConfig();
  const activeSessions = await Session.find({
    userId: user._id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: 1 });

  const overflow = activeSessions.length - (config.maxActiveSessions - 1);
  if (overflow > 0) {
    const ids = activeSessions.slice(0, overflow).map((session) => session._id);
    await Session.updateMany({ _id: { $in: ids } }, { revokedAt: new Date() });
  }

  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = signRefreshToken(user._id, sessionId);
  const expiresAt = tokenExpiryDate(refreshToken);

  await Session.create({
    _id: sessionId,
    userId: user._id,
    refreshTokenHash: hashToken(refreshToken),
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    platform: device.platform,
    expiresAt,
    lastUsedAt: new Date(),
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

export async function loginWithOtp({ phone, otp, ip, device }) {
  await verifyOtpCode({ phone, otp, ip });

  let user = await User.findOne({
    countryCode: phone.countryCode,
    phoneNumber: phone.nationalNumber,
  });
  let isNewUser = false;

  if (!user) {
    try {
      user = await User.create({
        phoneNumber: phone.nationalNumber,
        countryCode: phone.countryCode,
        fullName: "",
        role: "owner",
        isVerified: true,
        isActive: true,
        lastLoginAt: new Date(),
      });
      isNewUser = true;
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
      user = await User.findOne({
        countryCode: phone.countryCode,
        phoneNumber: phone.nationalNumber,
      });
    }
  }

  if (!user || !user.isActive) {
    throw new AppError(INACTIVE_MESSAGE, 403);
  }

  if (!isNewUser) {
    user.isVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
  }

  const tokens = await openSession(user, device);

  return {
    message: isNewUser ? "OTP verified" : "Login successful",
    data: {
      isNewUser,
      requiresProfileSetup: isNewUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: toPublicUser(user),
    },
  };
}

export async function refreshSession({ refreshToken, ip }) {
  await assertRefreshLimit(ip);

  const payload = verifyRefreshToken(refreshToken);
  const session = await Session.findById(payload.sid);

  if (!session || String(session.userId) !== String(payload.sub)) {
    throw new AppError("Your session has expired. Please login again.", 401);
  }

  if (session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new AppError("Your session has expired. Please login again.", 401);
  }

  if (!tokenHashMatches(refreshToken, session.refreshTokenHash)) {
    session.revokedAt = new Date();
    await session.save();
    throw new AppError("Your session has expired. Please login again.", 401);
  }

  const user = await User.findById(session.userId);
  if (!user || !user.isActive) {
    session.revokedAt = new Date();
    await session.save();
    throw new AppError(user ? INACTIVE_MESSAGE : "Your session has expired. Please login again.", user ? 403 : 401);
  }

  const nextRefreshToken = signRefreshToken(user._id, session._id);
  const rotated = await Session.findOneAndUpdate(
    {
      _id: session._id,
      refreshTokenHash: session.refreshTokenHash,
      revokedAt: null,
    },
    {
      refreshTokenHash: hashToken(nextRefreshToken),
      expiresAt: tokenExpiryDate(nextRefreshToken),
      lastUsedAt: new Date(),
    },
    { returnDocument: "before" }
  );

  if (!rotated) {
    await Session.updateOne({ _id: session._id }, { revokedAt: new Date() });
    throw new AppError("Your session has expired. Please login again.", 401);
  }

  return {
    accessToken: signAccessToken(user),
    refreshToken: nextRefreshToken,
  };
}

export async function revokeSession({ userId, refreshToken }) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    return;
  }

  if (String(payload.sub) !== String(userId)) {
    throw new AppError("You do not have permission to do that.", 403);
  }

  await Session.updateOne(
    { _id: payload.sid, userId },
    { revokedAt: new Date() }
  );
}

export async function revokeAllSessions(userId) {
  await Session.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("Your session has expired. Please login again.", 401);
  }

  if (!user.isActive) {
    throw new AppError(INACTIVE_MESSAGE, 403);
  }

  return toPublicUser(user);
}
