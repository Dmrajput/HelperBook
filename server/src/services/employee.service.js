import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { DEPENDENT_COLLECTIONS } from "../constants/employee.js";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { dateFromKey, todayKey } from "../utils/attendanceDate.js";
import { AppError } from "../utils/appError.js";
import { generateTemporaryPassword } from "../utils/password.js";
import { runInTransaction } from "../utils/mongoTransaction.js";
import { claimEmployeeSlot, releaseEmployeeSlot } from "./subscription.service.js";

const NOT_FOUND = "Employee not found.";
const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const DELETE_BLOCKED =
  "This employee has existing records and cannot be permanently deleted. Deactivate the employee instead.";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function requireShop(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }

  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) {
    throw new AppError(SHOP_REQUIRED, 404);
  }
  return shop;
}

async function findOwnedEmployee(shopId, employeeId) {
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError(NOT_FOUND, 404);
  }

  const employee = await Employee.findOne({ _id: employeeId, shopId });
  if (!employee) {
    throw new AppError(NOT_FOUND, 404);
  }
  return employee;
}

export function toPublicEmployee(employee) {
  return {
    id: String(employee._id),
    name: employee.name,
    phone: employee.phone || null,
    role: employee.role,
    customRole: employee.customRole || null,
    joiningDate: new Date(employee.joiningDate).toISOString(),
    salary: {
      type: employee.salary.type,
      amount: employee.salary.amount,
      currency: employee.salary.currency,
    },
    status: employee.status,
    deactivatedAt: employee.deactivatedAt ? new Date(employee.deactivatedAt).toISOString() : null,
    notes: employee.notes || "",
    loginEnabled: Boolean(employee.loginEnabled),
    mustChangePassword: Boolean(employee.mustChangePassword),
    phoneVerified: Boolean(employee.phoneVerified),
    lastLoginAt: employee.lastLoginAt ? new Date(employee.lastLoginAt).toISOString() : null,
    createdAt: new Date(employee.createdAt).toISOString(),
    updatedAt: new Date(employee.updatedAt).toISOString(),
  };
}

async function assertPhoneAvailableForLogin(phone, excludeEmployeeId = null) {
  if (!phone) return;
  const filter = {
    phone,
    status: "active",
    loginEnabled: true,
  };
  if (excludeEmployeeId) {
    filter._id = { $ne: excludeEmployeeId };
  }
  const conflict = await Employee.findOne(filter).select("_id");
  if (conflict) {
    throw new AppError("Another employee already uses this phone number for login.", 409, true, {
      code: "EMPLOYEE_PHONE_IN_USE",
    });
  }
}

async function assertPhoneUniqueInShop(shopId, phone, excludeEmployeeId = null) {
  if (!phone) return;
  const filter = { shopId, phone };
  if (excludeEmployeeId) {
    filter._id = { $ne: excludeEmployeeId };
  }
  const existing = await Employee.findOne(filter).select("_id");
  if (existing) {
    throw new AppError("An employee with this mobile number already exists in your shop.", 409, true, {
      code: "EMPLOYEE_PHONE_DUPLICATE",
    });
  }
}

async function hashTemporaryPassword() {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  return { temporaryPassword, passwordHash };
}

export async function hasDependentRecords(employeeId, shopId) {
  const existing = new Set(
    (await mongoose.connection.db.listCollections().toArray()).map((collection) => collection.name)
  );
  const employeeObjectId = new mongoose.Types.ObjectId(String(employeeId));
  const shopObjectId = new mongoose.Types.ObjectId(String(shopId));

  for (const name of DEPENDENT_COLLECTIONS) {
    if (!existing.has(name)) {
      continue;
    }
    const record = await mongoose.connection.collection(name).findOne({
      employeeId: employeeObjectId,
      shopId: shopObjectId,
    });
    if (record) {
      return true;
    }
  }

  return false;
}

export async function createEmployee(userId, payload) {
  const shop = await requireShop(userId);
  const status = payload.status === "inactive" ? "inactive" : "active";
  const createLogin = status === "active" && Boolean(payload.phone);

  await assertPhoneUniqueInShop(shop._id, payload.phone);
  if (createLogin) {
    await assertPhoneAvailableForLogin(payload.phone);
  }

  let claimed = false;
  if (status === "active") {
    await claimEmployeeSlot(shop);
    claimed = true;
  }

  try {
    let temporaryPassword = null;
    const employee = await runInTransaction(async (session) => {
      let passwordHash = "";
      let mustChangePassword = false;
      let loginEnabled = false;
      let employeeAuthCreatedAt = null;

      if (createLogin) {
        const generated = await hashTemporaryPassword();
        temporaryPassword = generated.temporaryPassword;
        passwordHash = generated.passwordHash;
        mustChangePassword = true;
        loginEnabled = true;
        employeeAuthCreatedAt = new Date();
      }

      const document = {
        shopId: shop._id,
        name: payload.name,
        phone: payload.phone,
        role: payload.role,
        customRole: payload.customRole,
        joiningDate: payload.joiningDate,
        salary: payload.salary,
        status,
        deactivatedAt: status === "inactive" ? dateFromKey(todayKey()) : null,
        notes: payload.notes,
        loginEnabled,
        passwordHash,
        mustChangePassword,
        employeeAuthCreatedAt,
      };

      if (session) {
        const docs = await Employee.create([document], { session });
        return docs[0];
      }
      return Employee.create(document);
    });

    return {
      employee: toPublicEmployee(employee),
      temporaryPassword,
    };
  } catch (error) {
    if (claimed) await releaseEmployeeSlot(shop._id);
    throw error;
  }
}

export async function getEmployees(userId, query) {
  const shop = await requireShop(userId);
  const filter = { shopId: shop._id, status: query.status };
  if (query.role) {
    filter.role = query.role;
  }
  if (query.search) {
    const clauses = [{ name: { $regex: escapeRegex(query.search), $options: "i" } }];
    const digits = query.search.replace(/\D/g, "");
    if (digits) {
      clauses.push({ phone: { $regex: escapeRegex(digits) } });
    }
    filter.$or = clauses;
  }

  const skip = (query.page - 1) * query.limit;
  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .select("name phone role customRole joiningDate salary status notes loginEnabled mustChangePassword phoneVerified lastLoginAt createdAt updatedAt")
      .sort({ name: 1, _id: 1 })
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  return {
    employees: employees.map(toPublicEmployee),
    total,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getEmployeeById(userId, employeeId) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  return toPublicEmployee(employee);
}

export async function updateEmployee(userId, employeeId, payload) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  const phoneChanged = (employee.phone || null) !== (payload.phone || null);
  if (phoneChanged && payload.phone) {
    await assertPhoneUniqueInShop(shop._id, payload.phone, employee._id);
  }
  employee.name = payload.name;
  employee.phone = payload.phone;
  employee.role = payload.role;
  employee.customRole = payload.customRole;
  employee.joiningDate = payload.joiningDate;
  employee.salary = payload.salary;
  employee.notes = payload.notes;
  if (phoneChanged) {
    employee.phoneVerified = false;
    employee.passwordHash = "";
    employee.loginEnabled = false;
    employee.mustChangePassword = false;
    const { revokeEmployeeAccess } = await import("./employeeAuth.service.js");
    await revokeEmployeeAccess(employee._id);
  }
  await employee.save();
  return toPublicEmployee(employee);
}

export async function updateEmployeeStatus(userId, employeeId, status) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  const wasActive = employee.status === "active";
  let claimed = false;
  if (status === "active" && !wasActive) {
    await claimEmployeeSlot(shop);
    claimed = true;
  }
  employee.status = status;
  employee.deactivatedAt = status === "inactive" ? dateFromKey(todayKey()) : null;
  if (status === "inactive") {
    employee.loginEnabled = false;
    const { revokeEmployeeAccess } = await import("./employeeAuth.service.js");
    await revokeEmployeeAccess(employee._id);
  }
  try {
    await employee.save();
  } catch (error) {
    if (claimed) await releaseEmployeeSlot(shop._id);
    throw error;
  }
  if (wasActive && status === "inactive") await releaseEmployeeSlot(shop._id);
  return toPublicEmployee(employee);
}

export async function setEmployeeLoginStatus(userId, employeeId, loginEnabled) {
  const shop = await requireShop(userId);
  const owned = await findOwnedEmployee(shop._id, employeeId);
  const employee = await Employee.findById(owned._id).select("+passwordHash");
  let temporaryPassword = null;

  if (loginEnabled) {
    if (employee.status !== "active") {
      throw new AppError("Activate this employee before enabling login.", 400, true, { code: "EMPLOYEE_INACTIVE" });
    }
    if (!employee.phone) {
      throw new AppError("A phone number is required before this employee can log in.", 400, true, {
        code: "EMPLOYEE_PHONE_REQUIRED",
      });
    }
    await assertPhoneAvailableForLogin(employee.phone, employee._id);

    if (!employee.passwordHash) {
      const generated = await hashTemporaryPassword();
      temporaryPassword = generated.temporaryPassword;
      employee.passwordHash = generated.passwordHash;
      employee.mustChangePassword = true;
    }
    employee.loginEnabled = true;
    if (!employee.employeeAuthCreatedAt) employee.employeeAuthCreatedAt = new Date();
  } else {
    employee.loginEnabled = false;
    const { revokeEmployeeAccess } = await import("./employeeAuth.service.js");
    await revokeEmployeeAccess(employee._id);
  }
  await employee.save();
  return {
    employeeId: String(employee._id),
    loginEnabled: employee.loginEnabled,
    mustChangePassword: Boolean(employee.mustChangePassword),
    temporaryPassword,
  };
}

export async function issueEmployeeTemporaryPassword(userId, employeeId) {
  const shop = await requireShop(userId);
  const owned = await findOwnedEmployee(shop._id, employeeId);
  const employee = await Employee.findById(owned._id).select("+passwordHash");
  if (employee.status !== "active") {
    throw new AppError("Activate this employee before resetting login.", 400, true, { code: "EMPLOYEE_INACTIVE" });
  }
  if (!employee.phone) {
    throw new AppError("A phone number is required before this employee can log in.", 400, true, {
      code: "EMPLOYEE_PHONE_REQUIRED",
    });
  }
  await assertPhoneAvailableForLogin(employee.phone, employee._id);

  const generated = await hashTemporaryPassword();
  employee.passwordHash = generated.passwordHash;
  employee.mustChangePassword = true;
  employee.loginEnabled = true;
  if (!employee.employeeAuthCreatedAt) employee.employeeAuthCreatedAt = new Date();
  await employee.save();

  const { revokeEmployeeAccess } = await import("./employeeAuth.service.js");
  await revokeEmployeeAccess(employee._id);

  return {
    employeeId: String(employee._id),
    name: employee.name,
    phone: employee.phone,
    loginEnabled: true,
    mustChangePassword: true,
    temporaryPassword: generated.temporaryPassword,
  };
}

export async function deleteEmployee(userId, employeeId) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  if (await hasDependentRecords(employee._id, shop._id)) {
    throw new AppError(DELETE_BLOCKED, 409);
  }
  const wasActive = employee.status === "active";
  await employee.deleteOne();
  if (wasActive) await releaseEmployeeSlot(shop._id);
}
