import { EMPLOYEE_ROLES } from "../constants/employees";

const ROLE_LABELS = Object.fromEntries(EMPLOYEE_ROLES.map((role) => [role.value, role.label]));

export function roleLabel(employee) {
  if (employee?.role === "other" && employee?.customRole) {
    return employee.customRole;
  }
  return ROLE_LABELS[employee?.role] || "";
}

export function formatSalary(salary) {
  const amount = Number(salary?.amount);
  if (!Number.isFinite(amount)) {
    return "";
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} / ${salary.type === "daily" ? "day" : "month"}`;
}

export function formatJoiningDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const national = digits.length >= 10 ? digits.slice(-10) : digits;
  if (national.length !== 10) {
    return value || "";
  }
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}

export function toCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromApi(value) {
  const date = new Date(value);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
