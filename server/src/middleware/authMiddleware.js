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
    if (payload.role === "employee") {
      throw new AppError("Your session has expired. Please login again.", 401);
    }
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new AppError("Your session has expired. Please login again.", 401);
    }

    if (!user.isActive) {
      throw new AppError(INACTIVE_MESSAGE, 403);
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
