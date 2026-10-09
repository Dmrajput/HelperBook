import Session from "../models/Session.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { verifyAccessToken } from "../utils/tokens.js";

const INACTIVE_MESSAGE = "Account is inactive. Please contact support.";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      throw new AppError("Your session has expired. Please login again.", 401);
    }

    const payload = verifyAccessToken(match[1]);
    if (payload.role !== "owner" || payload.type !== "access") {
      throw new AppError("Your session has expired. Please login again.", 401);
    }
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new AppError("Your session has expired. Please login again.", 401);
    }

    if (!user.isActive) {
      throw new AppError(
        user.suspensionReason ? "This account is suspended. Please contact support." : INACTIVE_MESSAGE,
        403
      );
    }

    const session = await Session.findById(payload.sid);
    if (
      !session
      || session.revokedAt
      || String(session.userId) !== String(user._id)
      || new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      throw new AppError("Your session has expired. Please login again.", 401);
    }

    const shop = await Shop.findOne({ ownerId: user._id, isActive: true }).select("accessSuspended");
    const allowedWhileSuspended = req.method === "GET" && (/\/auth\/me$/.test(req.originalUrl) || /\/shops\/me$/.test(req.originalUrl));
    const logoutPath = /\/auth\/logout/.test(req.originalUrl);
    if (shop?.accessSuspended && !allowedWhileSuspended && !logoutPath) {
      throw new AppError("This shop's access is suspended. Please contact support.", 403, true, { code: "SHOP_ACCESS_SUSPENDED" });
    }
    req.user = {
      id: String(user._id),
      role: user.role,
    };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Your session has expired. Please login again.", 401));
  }
}
