import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { AppError } from "./appError.js";

const SESSION_EXPIRED = "Your session has expired. Please login again.";

export function generateOtpCode() {
  return randomInt(0, 1000000).toString().padStart(6, "0");
}

export function createOtpHash(otp) {
  const salt = randomBytes(16).toString("hex");
  const digest = createHmac("sha256", process.env.OTP_HASH_SECRET)
    .update(`${salt}:${otp}`)
    .digest("hex");
  return `${salt}.${digest}`;
}

export function otpMatches(otp, storedHash) {
  if (typeof storedHash !== "string" || !storedHash.includes(".")) {
    return false;
  }

  const [salt, digest] = storedHash.split(".");
  if (!salt || !/^[a-f0-9]+$/i.test(digest || "")) {
    return false;
  }

  const actual = createHmac("sha256", process.env.OTP_HASH_SECRET)
    .update(`${salt}:${otp}`)
    .digest("hex");
  const left = Buffer.from(digest, "hex");
  const right = Buffer.from(actual, "hex");

  if (left.length === 0 || left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function tokenHashMatches(token, storedHash) {
  if (typeof token !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const actual = hashToken(token);
  const left = Buffer.from(storedHash, "hex");
  const right = Buffer.from(actual, "hex");

  if (left.length === 0 || left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function signAccessToken(user, sessionId) {
  if (!sessionId) {
    throw new AppError(SESSION_EXPIRED, 401);
  }
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      sid: String(sessionId),
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
      algorithm: "HS256",
    }
  );
}

export function signRefreshToken(userId, sessionId) {
  return jwt.sign(
    {
      sub: String(userId),
      sid: String(sessionId),
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
      algorithm: "HS256",
      jwtid: randomBytes(16).toString("hex"),
    }
  );
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    });

    if (payload?.type !== "access" || !payload.sub || !payload.sid) {
      throw new AppError(SESSION_EXPIRED, 401);
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(SESSION_EXPIRED, 401);
  }
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
    });

    if (payload?.type !== "refresh" || !payload.sub || !payload.sid || payload.role === "employee") {
      throw new AppError(SESSION_EXPIRED, 401);
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(SESSION_EXPIRED, 401);
  }
}

export function signEmployeeAccessToken(employee, sessionId) {
  if (!sessionId) {
    throw new AppError(SESSION_EXPIRED, 401);
  }
  return jwt.sign(
    {
      sub: String(employee._id),
      role: "employee",
      shopId: String(employee.shopId),
      sid: String(sessionId),
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
      algorithm: "HS256",
    }
  );
}

export function signEmployeeRefreshToken(employeeId, sessionId) {
  return jwt.sign(
    {
      sub: String(employeeId),
      sid: String(sessionId),
      role: "employee",
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
      algorithm: "HS256",
      jwtid: randomBytes(16).toString("hex"),
    }
  );
}

export function verifyEmployeeRefreshToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
    if (payload?.type !== "refresh" || payload.role !== "employee" || !payload.sub || !payload.sid) {
      throw new AppError(SESSION_EXPIRED, 401);
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(SESSION_EXPIRED, 401);
  }
}

export function signAdminAccessToken(admin, sessionId) {
  if (!sessionId) {
    throw new AppError("Your session has expired. Please log in again.", 401);
  }
  return jwt.sign(
    { sub: String(admin._id), role: "admin", adminRole: admin.role, sid: String(sessionId), type: "admin_access" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m", algorithm: "HS256" }
  );
}

export function signAdminRefreshToken(adminId, sessionId) {
  return jwt.sign(
    { sub: String(adminId), sid: String(sessionId), role: "admin", type: "admin_refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d", algorithm: "HS256", jwtid: randomBytes(16).toString("hex") }
  );
}

export function verifyAdminAccessToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
    if (payload?.type !== "admin_access" || payload.role !== "admin" || !payload.sub || !payload.sid) {
      throw new AppError("Your session has expired. Please log in again.", 401);
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Your session has expired. Please log in again.", 401);
  }
}

export function verifyAdminRefreshToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
    if (payload?.type !== "admin_refresh" || payload.role !== "admin" || !payload.sub || !payload.sid) {
      throw new AppError("Your session has expired. Please log in again.", 401);
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Your session has expired. Please log in again.", 401);
  }
}

export function tokenExpiryDate(token) {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) {
    throw new AppError(SESSION_EXPIRED, 401);
  }
  return new Date(decoded.exp * 1000);
}
