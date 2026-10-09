import bcrypt from "bcryptjs";
import AdminSession from "../../models/AdminSession.js";
import AdminUser from "../../models/AdminUser.js";
import OtpRateLimit from "../../models/OtpRateLimit.js";
import { adminHasPermission, permissionsFor } from "../../config/adminPermissions.js";
import { AppError } from "../../utils/appError.js";
import {
  hashToken,
  signAdminAccessToken,
  signAdminRefreshToken,
  tokenExpiryDate,
  tokenHashMatches,
  verifyAdminRefreshToken,
} from "../../utils/tokens.js";

const WINDOW_MS = 15 * 60 * 1000;

function strongPassword(password) {
  return typeof password === "string"
    && password.length >= 12
    && password.length <= 128
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

async function takeSlot(key, max) {
  const now = new Date();
  const windowStart = now.getTime() - WINDOW_MS;
  let record = await OtpRateLimit.findOne({ key });
  if (!record) record = new OtpRateLimit({ key, hits: [], expiresAt: new Date(now.getTime() + WINDOW_MS) });
  record.hits = (record.hits || []).filter((hit) => new Date(hit).getTime() >= windowStart);
  record.markModified("hits");
  if (record.hits.length >= max) return false;
  record.hits.push(now);
  record.expiresAt = new Date(now.getTime() + WINDOW_MS);
  await record.save();
  return true;
}

export function assertStrongPassword(password) {
  if (!strongPassword(password)) {
    throw new AppError("Use a password of at least 12 characters with upper and lower case letters, a number, and a symbol.", 400);
  }
}

export async function hashPassword(password) {
  assertStrongPassword(password);
  return bcrypt.hash(password, 12);
}

function publicAdmin(admin) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    permissions: permissionsFor(admin.role),
    lastLoginAt: admin.lastLoginAt,
  };
}

export async function loginAdmin({ email, password, ip }) {
  const normalized = String(email || "").trim().toLowerCase();
  const allowedIp = await takeSlot(`admin-login-ip:${ip || "unknown"}`, 20);
  const allowedEmail = await takeSlot(`admin-login-email:${normalized || "blank"}`, 8);
  if (!allowedIp || !allowedEmail) {
    throw new AppError("Too many login attempts. Please try again later.", 429, true, { code: "ADMIN_RATE_LIMIT" });
  }
  const admin = await AdminUser.findOne({ email: normalized });
  const matches = admin ? await bcrypt.compare(String(password || ""), admin.passwordHash) : false;
  if (!admin || !matches) {
    throw new AppError("The email or password is incorrect.", 401, true, { code: "ADMIN_INVALID_CREDENTIALS" });
  }
  if (!admin.isActive) {
    throw new AppError("This admin account is disabled.", 403, true, { code: "ADMIN_DISABLED" });
  }
  const session = await AdminSession.create({
    adminId: admin._id,
    refreshTokenHash: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastUsedAt: new Date(),
  });
  const refreshToken = signAdminRefreshToken(admin._id, session._id);
  session.refreshTokenHash = hashToken(refreshToken);
  session.expiresAt = tokenExpiryDate(refreshToken);
  await session.save();
  admin.lastLoginAt = new Date();
  await admin.save();
  return {
    accessToken: signAdminAccessToken(admin, session._id),
    refreshToken,
    admin: publicAdmin(admin),
  };
}

export async function refreshAdmin(refreshToken) {
  const payload = verifyAdminRefreshToken(refreshToken);
  const session = await AdminSession.findById(payload.sid);
  if (!session || session.revokedAt || String(session.adminId) !== String(payload.sub) || !tokenHashMatches(refreshToken, session.refreshTokenHash)) {
    throw new AppError("Your session has expired. Please log in again.", 401, true, { code: "ADMIN_SESSION_EXPIRED" });
  }
  const admin = await AdminUser.findById(session.adminId);
  if (!admin || !admin.isActive) {
    session.revokedAt = new Date();
    await session.save();
    throw new AppError("This admin account is disabled.", 403, true, { code: "ADMIN_DISABLED" });
  }
  const next = signAdminRefreshToken(admin._id, session._id);
  session.refreshTokenHash = hashToken(next);
  session.expiresAt = tokenExpiryDate(next);
  session.lastUsedAt = new Date();
  await session.save();
  return { accessToken: signAdminAccessToken(admin, session._id), refreshToken: next, admin: publicAdmin(admin) };
}

export async function logoutAdmin(refreshToken) {
  try {
    const payload = verifyAdminRefreshToken(refreshToken);
    await AdminSession.updateOne({ _id: payload.sid, revokedAt: null }, { revokedAt: new Date() });
  } catch {
    // Logout still succeeds locally when the token is already invalid.
  }
}

export function adminProfile(admin) {
  return publicAdmin(admin);
}

export function assertPermission(admin, permission) {
  if (!adminHasPermission(admin, permission)) {
    throw new AppError("You do not have permission to perform this action.", 403, true, { code: "ADMIN_PERMISSION_DENIED" });
  }
}
