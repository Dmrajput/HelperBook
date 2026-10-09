import { adminHasPermission } from "../config/adminPermissions.js";
import AdminSession from "../models/AdminSession.js";
import AdminUser from "../models/AdminUser.js";
import { AppError } from "../utils/appError.js";
import { verifyAdminAccessToken } from "../utils/tokens.js";

export async function requireAdminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(\S+)$/i);
    if (!match) throw new AppError("Your session has expired. Please log in again.", 401);
    const payload = verifyAdminAccessToken(match[1]);
    const admin = await AdminUser.findById(payload.sub);
    if (!admin || !admin.isActive || admin.role !== payload.adminRole) {
      throw new AppError("Your session has expired. Please log in again.", 401, true, { code: "ADMIN_SESSION_EXPIRED" });
    }
    const session = await AdminSession.findById(payload.sid);
    if (
      !session
      || session.revokedAt
      || String(session.adminId) !== String(admin._id)
      || new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      throw new AppError("Your session has expired. Please log in again.", 401, true, { code: "ADMIN_SESSION_EXPIRED" });
    }
    req.admin = admin;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Your session has expired. Please log in again.", 401));
  }
}

export function requireAdminPermission(permission) {
  return function permissionGate(req, res, next) {
    if (!adminHasPermission(req.admin, permission)) {
      next(new AppError("You do not have permission to perform this action.", 403, true, { code: "ADMIN_PERMISSION_DENIED" }));
      return;
    }
    next();
  };
}

export function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== "super_admin") {
    next(new AppError("You do not have permission to perform this action.", 403, true, { code: "ADMIN_PERMISSION_DENIED" }));
    return;
  }
  next();
}
