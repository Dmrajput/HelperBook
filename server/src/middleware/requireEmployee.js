import Employee from "../models/Employee.js";
import EmployeeSession from "../models/EmployeeSession.js";
import Shop from "../models/Shop.js";
import { AppError } from "../utils/appError.js";
import { verifyAccessToken } from "../utils/tokens.js";

const EXPIRED = "Your session has expired. Please log in again.";

export async function requireEmployee(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new AppError(EXPIRED, 401);
    }

    const payload = verifyAccessToken(match[1]);
    if (payload.role !== "employee" || !payload.shopId) {
      throw new AppError("You don't have access to this information.", 403);
    }

    const employee = await Employee.findById(payload.sub);
    if (!employee || String(employee.shopId) !== String(payload.shopId)) {
      throw new AppError("You don't have access to this information.", 403);
    }
    if (employee.status !== "active") {
      throw new AppError("This employee account is inactive.", 403, true, { code: "EMPLOYEE_INACTIVE" });
    }
    if (!employee.loginEnabled) {
      throw new AppError("Employee login is currently disabled.", 403, true, { code: "EMPLOYEE_LOGIN_DISABLED" });
    }
    const session = await EmployeeSession.findById(payload.sid);
    if (
      !session
      || session.revokedAt
      || String(session.employeeId) !== String(employee._id)
      || new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      throw new AppError(EXPIRED, 401);
    }
    const shop = await Shop.findOne({ _id: employee.shopId, isActive: true }).select("accessSuspended");
    if (!shop || shop.accessSuspended) {
      throw new AppError("You don't have access to this information.", 403, true, { code: "EMPLOYEE_ACCESS_DENIED" });
    }

    req.employee = employee;
    req.user = {
      id: String(employee._id),
      employeeId: String(employee._id),
      shopId: String(employee.shopId),
      role: "employee",
    };
    next();
  } catch (error) {
    next(error);
  }
}
