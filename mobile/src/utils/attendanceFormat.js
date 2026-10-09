const TIME_ZONE = "Asia/Kolkata";

export function calendarKey(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayKey() {
  return calendarKey(new Date());
}

export function shiftKey(key, days) {
  const [year, month, day] = key.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function monthStartKey(key = todayKey()) {
  return `${key.slice(0, 8)}01`;
}

export function currentYearMonth(key = todayKey()) {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function formatAttendanceDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatMonth(year, month) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function keyFromPickerDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function pickerDateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function statusLabel(status) {
  if (!status) {
    return "Not Marked";
  }
  if (status === "half_day") {
    return "Half Day";
  }
  if (status === "present") {
    return "Present";
  }
  if (status === "absent") {
    return "Absent";
  }
  if (status === "leave") {
    return "Leave";
  }
  return status;
}
