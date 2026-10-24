import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";

const DEFAULT_INACTIVE = "Account is inactive. Please contact support.";
const DEFAULT_SHOP_REQUIRED = "Shop setup is required before managing employees.";
const DEFAULT_EMPLOYEE_NOT_FOUND = "Employee not found.";

/**
 * Resolve the active shop for an owner account.
 * Call sites can customize messages without duplicating User+Shop lookups.
 */
export async function requireOwnerShop(userId, options = {}) {
  const {
    inactiveMessage = DEFAULT_INACTIVE,
    inactiveStatus = 403,
    missingShopMessage = DEFAULT_SHOP_REQUIRED,
    missingShopStatus = 404,
    withUser = false,
    userSelect,
    shopSelect,
  } = options;

  const userQuery = User.findById(userId);
  if (userSelect) {
    userQuery.select(userSelect);
  } else if (!withUser) {
    userQuery.select("_id isActive");
  }
  const user = await userQuery;
  if (!user || !user.isActive) {
    throw new AppError(inactiveMessage, inactiveStatus);
  }

  const shopQuery = Shop.findOne({ ownerId: user._id, isActive: true });
  if (shopSelect) {
    shopQuery.select(shopSelect);
  }
  const shop = await shopQuery;
  if (!shop) {
    throw new AppError(missingShopMessage, missingShopStatus);
  }

  return withUser ? { user, shop } : shop;
}

export async function findOwnedEmployee(shopId, employeeId, options = {}) {
  const {
    notFoundMessage = DEFAULT_EMPLOYEE_NOT_FOUND,
    notFoundStatus = 404,
    invalidIdMessage = notFoundMessage,
    invalidIdStatus = notFoundStatus,
    select,
  } = options;

  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError(invalidIdMessage, invalidIdStatus);
  }

  const query = Employee.findOne({ _id: employeeId, shopId });
  if (select) {
    query.select(select);
  }
  const employee = await query;
  if (!employee) {
    throw new AppError(notFoundMessage, notFoundStatus);
  }
  return employee;
}
