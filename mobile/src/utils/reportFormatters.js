import { formatMonth } from "./attendanceFormat";

export function currentMonthRange(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const from = `${values.year}-${values.month}-01`;
  const last = new Date(Date.UTC(year, month, 0));
  const to = last.toISOString().slice(0, 10);
  return { from, to, label: formatMonth(year, month) };
}

export function shiftMonthRange(from, delta) {
  const [year, month] = from.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  const nextYear = next.getUTCFullYear();
  const nextMonth = next.getUTCMonth() + 1;
  if (nextYear < 2000 || nextYear > 2100) {
    return currentMonthRange();
  }
  const start = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(nextYear, nextMonth, 0)).toISOString().slice(0, 10);
  return { from: start, to: end, label: formatMonth(nextYear, nextMonth) };
}

export function monthLabel(from) {
  const [year, month] = from.split("-").map(Number);
  return formatMonth(year, month);
}
