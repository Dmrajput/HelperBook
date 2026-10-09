import mongoose from "mongoose";
import { DEPENDENT_COLLECTIONS } from "../constants/employee.js";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { dateFromKey, todayKey } from "../utils/attendanceDate.js";
import { AppError } from "../utils/appError.js";
import { assertEmployeeCapacity } from "./subscription.service.js";

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
    phoneVerified: Boolean(employee.phoneVerified),
    lastLoginAt: employee.lastLoginAt ? new Date(employee.lastLoginAt).toISOString() : null,
    createdAt: new Date(employee.createdAt).toISOString(),
    updatedAt: new Date(employee.updatedAt).toISOString(),
  };
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
  await assertEmployeeCapacity(shop, 1);
  const employee = await Employee.create({
    shopId: shop._id,
    name: payload.name,
    phone: payload.phone,
    role: payload.role,
    customRole: payload.customRole,
    joiningDate: payload.joiningDate,
    salary: payload.salary,
    status: "active",
    notes: payload.notes,
  });
  return toPublicEmployee(employee);
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
      .select("name phone role customRole joiningDate salary status notes loginEnabled phoneVerified lastLoginAt createdAt updatedAt")
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
  employee.name = payload.name;
  employee.phone = payload.phone;
  employee.role = payload.role;
  employee.customRole = payload.customRole;
  employee.joiningDate = payload.joiningDate;
  employee.salary = payload.salary;
  employee.notes = payload.notes;
  if (phoneChanged) {
    employee.phoneVerified = false;
    employee.loginEnabled = false;
    const { revokeEmployeeAccess } = await import("./employeeAuth.service.js");
    await revokeEmployeeAccess(employee._id);
  }
  await employee.save();
  return toPublicEmployee(employee);
}

export async function updateEmployeeStatus(userId, employeeId, status) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  if (status === "active" && employee.status !== "active") {
    await assertEmployeeCapacity(shop, 1);
  }
  employee.status = status;
  employee.deactivatedAt = status === "inactive" ? dateFromKey(todayKey()) : null;
  if (status === "inactive") {
    employee.loginEnabled = false;
    const { revokeEmployeeAccess } = await import("./employeeAuth.service.js");
    await revokeEmployeeAccess(employee._id);
  }
  await employee.save();
  return toPublicEmployee(employee);
}

export async function setEmployeeLoginStatus(userId, employeeId, loginEnabled) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  if (loginEnabled) {
    if (employee.status !== "active") {
      throw new AppError("Activate this employee before enabling login.", 400, true, { code: "EMPLOYEE_INACTIVE" });
    }
    if (!employee.phone) {
      throw new AppError("A phone number is required before this employee can log in.", 400, true, {
        code: "EMPLOYEE_PHONE_REQUIRED",
      });
    }
    const conflict = await Employee.findOne({
      phone: employee.phone,
      status: "active",
      loginEnabled: true,
      _id: { $ne: employee._id },
    });
    if (conflict) {
      throw new AppError("Another employee already uses this phone number for login.", 409);
    }
    employee.loginEnabled = true;
    if (!employee.employeeAuthCreatedAt) employee.employeeAuthCreatedAt = new Date();
  } else {
    employee.loginEnabled = false;
    const { revokeEmployeeAccess } = await import("./employeeAuth.service.js");
    await revokeEmployeeAccess(employee._id);
  }
  await employee.save();
  return { employeeId: String(employee._id), loginEnabled: employee.loginEnabled };
}

export async function deleteEmployee(userId, employeeId) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  if (await hasDependentRecords(employee._id, shop._id)) {
    throw new AppError(DELETE_BLOCKED, 409);
  }
  await employee.deleteOne();
}
