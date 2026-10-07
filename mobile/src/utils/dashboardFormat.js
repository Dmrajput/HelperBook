const DEFAULT_TIME_ZONE = "Asia/Kolkata";

function calendarKey(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftCalendarKey(key, days) {
  const [year, month, day] = key.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function greetingLine(fullName, timeZone = DEFAULT_TIME_ZONE) {
  const name = String(fullName || "")
    .trim()
    .split(/\s+/)[0];
  if (!name) {
    return "Welcome back 👋";
  }

  const hour = Number.parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
    10
  );

  let period = "evening";
  if (hour < 12) {
    period = "morning";
  } else if (hour < 17) {
    period = "afternoon";
  }

  return `Good ${period}, ${name} 👋`;
}

export function todayLabel(timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function weekdayLabel(timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
  }).format(new Date());
}

export function formatInr(amount) {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(safe) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function addedLabel(createdAt, timeZone = DEFAULT_TIME_ZONE) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return "";
  }

  const createdKey = calendarKey(created, timeZone);
  const today = calendarKey(new Date(), timeZone);
  if (createdKey === today) {
    return "Added today";
  }
  if (createdKey === shiftCalendarKey(today, -1)) {
    return "Added yesterday";
  }

  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(created);
  return `Added ${formatted}`;
}

export function peopleLabel(count, emptyLabel) {
  const total = Number(count) || 0;
  if (total <= 0) {
    return emptyLabel;
  }
  return total === 1 ? "1 employee" : `${total} employees`;
}
