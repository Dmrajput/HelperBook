import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import { AppError } from "./appError.js";

const DATE_MESSAGE = "Please select a valid date.";

export function formatZoneDate(date, timeZone = EMPLOYEE_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayKey(timeZone = EMPLOYEE_TIME_ZONE) {
  return formatZoneDate(new Date(), timeZone);
}

export function weekdayKey(date, timeZone = EMPLOYEE_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(date).toLowerCase();
}

export function isValidCalendarKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return false;
  }
  const [year, month, day] = key.split("-").map(Number);
  if (year < 2000 || year > 2100) {
    return false;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

export function dateFromKey(key) {
  if (!isValidCalendarKey(key)) {
    throw new AppError(DATE_MESSAGE, 400);
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function keyFromDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(DATE_MESSAGE, 400);
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthBounds(year, month) {
  const startKey = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  if (!isValidCalendarKey(startKey)) {
    throw new AppError(DATE_MESSAGE, 400);
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endKey = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start: dateFromKey(startKey), end: dateFromKey(endKey), startKey };
}

export function currentMonth(timeZone = EMPLOYEE_TIME_ZONE) {
  const key = todayKey(timeZone);
  const [year, month] = key.split("-").map(Number);
  return { year, month, today: key };
}
