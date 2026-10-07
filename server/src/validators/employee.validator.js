import {
  DEFAULT_PAGE_LIMIT,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYEE_TIME_ZONE,
  MAX_PAGE_LIMIT,
  SALARY_LIMITS,
  SALARY_TYPES,
} from "../constants/employee.js";
import { AppError } from "../utils/appError.js";
import { normalizeIndianPhone } from "../utils/phone.js";

const DETAILS = "Please check the employee details.";

function text(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function notesText(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError(DETAILS, 400);
  }
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function requireObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(DETAILS, 400);
  }
  return value;
}

function calendarKey(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatZoneDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return calendarKey(values.year, values.month, values.day);
}

function parseCalendarDate(value) {
  const raw = text(value);
  if (!raw) {
    throw new AppError("Joining date is required.", 400);
  }

  let key = "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    key = raw;
  } else if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const instant = new Date(raw);
    if (Number.isNaN(instant.getTime())) {
      throw new AppError("Please select a valid joining date.", 400);
    }
    key = formatZoneDate(instant, EMPLOYEE_TIME_ZONE);
  } else {
    throw new AppError("Please select a valid joining date.", 400);
  }

  const [year, month, day] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day ||
    year < 1950
  ) {
    throw new AppError("Please select a valid joining date.", 400);
  }

  const today = formatZoneDate(new Date(), EMPLOYEE_TIME_ZONE);
  const allowFuture = process.env.EMPLOYEE_ALLOW_FUTURE_JOINING_DATE === "true";
  if (!allowFuture && key > today) {
    throw new AppError("Joining date cannot be in the future.", 400);
  }

  return utc;
}

function parseSalary(salary) {
  if (!salary || typeof salary !== "object" || Array.isArray(salary)) {
    throw new AppError("Please select a salary type.", 400);
  }

  const type = text(salary.type);
  if (!SALARY_TYPES.includes(type)) {
    throw new AppError("Please select a salary type.", 400);
  }

  if (salary.amount === undefined || salary.amount === null || salary.amount === "") {
    throw new AppError("Salary amount is required.", 400);
  }

  if (typeof salary.amount === "object") {
    throw new AppError("Enter a valid salary amount.", 400);
  }

  const rawAmount = typeof salary.amount === "number" ? String(salary.amount) : text(salary.amount);
  if (!/^\d+(\.\d{1,2})?$/.test(rawAmount)) {
    throw new AppError("Enter a valid salary amount.", 400);
  }

  const amount = Math.round(Number(rawAmount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Salary must be greater than 0.", 400);
  }
  if (amount > SALARY_LIMITS[type]) {
    throw new AppError("Salary amount is too large.", 400);
  }

  if (salary.currency !== undefined && text(salary.currency) !== "INR") {
    throw new AppError("Currency must be INR.", 400);
  }

  return { type, amount, currency: "INR" };
}

function parsePhone(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string" || !raw.trim()) {
    if (typeof raw === "string" && !raw.trim()) {
      return null;
    }
    throw new AppError("Enter a valid 10-digit mobile number.", 400);
  }
  return normalizeIndianPhone(raw, "+91").e164;
}

export function validateEmployeePayload(body) {
  const source = requireObject(body);
  const nameValue = text(source.name);
  if (!nameValue) {
    throw new AppError("Employee name is required.", 400);
  }
  if (nameValue.length < 2 || nameValue.length > 100) {
    throw new AppError("Employee name must be between 2 and 100 characters.", 400);
  }

  const role = text(source.role);
  if (!EMPLOYEE_ROLES.includes(role)) {
    throw new AppError("Please select a role.", 400);
  }

  let customRole = null;
  if (role === "other") {
    const custom = text(source.customRole);
    if (!custom) {
      throw new AppError("Please enter a custom role.", 400);
    }
    if (custom.length < 2 || custom.length > 80) {
      throw new AppError("Custom role must be between 2 and 80 characters.", 400);
    }
    customRole = custom;
  }

  const notes = notesText(source.notes);
  if (notes.length > 500) {
    throw new AppError("Notes must be 500 characters or less.", 400);
  }

  return {
    name: nameValue,
    phone: parsePhone(source.phone),
    role,
    customRole,
    joiningDate: parseCalendarDate(source.joiningDate),
    salary: parseSalary(source.salary),
    notes,
  };
}

export function validateEmployeeStatus(body) {
  const source = requireObject(body);
  const status = text(source.status);
  if (!EMPLOYEE_STATUSES.includes(status)) {
    throw new AppError("Please choose a valid status.", 400);
  }
  return status;
}

function integerQuery(value, fallback, maximum) {
  if (value === undefined) {
    return fallback;
  }
  if (Array.isArray(value) || !/^\d+$/.test(String(value))) {
    throw new AppError(DETAILS, 400);
  }
  const number = Number(value);
  if (number < 1) {
    throw new AppError(DETAILS, 400);
  }
  return maximum ? Math.min(number, maximum) : number;
}

export function validateEmployeeQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  if (Array.isArray(source.status) || Array.isArray(source.role) || Array.isArray(source.search)) {
    throw new AppError(DETAILS, 400);
  }

  const status = source.status === undefined ? "active" : text(source.status);
  if (!EMPLOYEE_STATUSES.includes(status)) {
    throw new AppError("Please choose a valid status.", 400);
  }

  let role = "";
  if (source.role !== undefined && text(source.role)) {
    role = text(source.role);
    if (!EMPLOYEE_ROLES.includes(role)) {
      throw new AppError("Please select a role.", 400);
    }
  }

  const search = text(source.search);
  if (search.length > 80) {
    throw new AppError(DETAILS, 400);
  }

  return {
    status,
    role,
    search,
    page: integerQuery(source.page, 1),
    limit: integerQuery(source.limit, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT),
  };
}
