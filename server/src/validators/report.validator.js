import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { currentMonth, dateFromKey, isValidCalendarKey, keyFromDate, monthBounds } from "../utils/attendanceDate.js";

export const EXPORT_ROW_LIMIT = 10000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthEndKey(year, month) {
  const { end } = monthBounds(year, month);
  return keyFromDate(new Date(end.getTime() - 86400000));
}

export function defaultRange() {
  const { year, month } = currentMonth();
  return { from: monthBounds(year, month).startKey, to: monthEndKey(year, month) };
}

export function inclusiveDayCount(from, to) {
  const start = dateFromKey(from).getTime();
  const end = dateFromKey(to).getTime();
  return Math.round((end - start) / 86400000) + 1;
}

export function parseDateRange(query) {
  const fallback = defaultRange();
  const from = query.from || fallback.from;
  const to = query.to || fallback.to;
  if (!isValidCalendarKey(from) || !isValidCalendarKey(to)) {
    throw new AppError("Please select a valid date.", 400);
  }
  if (from > to) {
    throw new AppError("The start date must be on or before the end date.", 400);
  }
  if (inclusiveDayCount(from, to) > 365) {
    throw new AppError("Please select a date range of 365 days or less.", 400);
  }
  return { from, to, fromDate: dateFromKey(from), toDate: dateFromKey(to) };
}

export function parsePagination(query, forExport = false) {
  if (forExport) {
    return { page: 1, limit: EXPORT_ROW_LIMIT, forExport: true };
  }
  const page = query.page === undefined || query.page === "" ? 1 : Number(query.page);
  const limit = query.limit === undefined || query.limit === "" ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Page must be a positive number.", 400);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Limit must be between 1 and 100.", 400);
  }
  return { page, limit, forExport: false };
}

export function oneOf(value, allowed, label) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (value === "all" && !allowed.includes("all")) {
    return undefined;
  }
  if (!allowed.includes(value)) {
    throw new AppError(`${label} is not supported.`, 400);
  }
  return value;
}

export function assertExportSize(total) {
  if (total > EXPORT_ROW_LIMIT) {
    throw new AppError(
      "This report is too large to export at once. Please narrow the date range or employee filter.",
      400
    );
  }
}

export function pageOf(items, page, limit) {
  const total = items.length;
  const pages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    rows: items.slice(start, start + limit),
    pagination: { page, limit: Math.min(limit, EXPORT_ROW_LIMIT), total, pages },
  };
}

export async function requireShop(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("Please log in again.", 401);
  }
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) {
    throw new AppError("Create your shop before viewing reports.", 404);
  }
  return shop;
}

export async function requireEmployee(shopId, employeeId) {
  if (!employeeId) {
    return null;
  }
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError("Employee was not found.", 404);
  }
  const employee = await Employee.findOne({ _id: employeeId, shopId }).select("name");
  if (!employee) {
    throw new AppError("Employee was not found.", 404);
  }
  return employee;
}

export async function prepareReport(userId, query, forExport = false) {
  const shop = await requireShop(userId);
  const range = parseDateRange(query);
  const employee = await requireEmployee(shop._id, query.employeeId);
  const pagination = parsePagination(query, forExport);
  return { shop, range, employee, pagination, generatedAt: new Date() };
}

export function formatReportDate(key) {
  if (!key) {
    return "";
  }
  const [year, month, day] = key.split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;
}

export function periodLabel(from, to) {
  return `${formatReportDate(from)} - ${formatReportDate(to)}`;
}

export function generatedLabel(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const dayPeriod = String(values.dayPeriod || "").toUpperCase();
  return `${values.day} ${values.month} ${values.year}, ${values.hour}:${values.minute} ${dayPeriod}`;
}

export function reportFileName(kind, from, to, extension) {
  const monthStart = from.endsWith("-01");
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const [year, month] = from.split("-").map(Number);
  const isFullMonth = monthStart && sameMonth && to === monthEndKey(year, month);
  const stamp = isFullMonth ? from.slice(0, 7) : `${from}_to_${to}`;
  return `HelperBook_${kind}_Report_${stamp}.${extension}`.replace(/[^A-Za-z0-9._-]/g, "");
}

export function excelDate(key) {
  if (!key) {
    return null;
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}
