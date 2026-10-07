import { WEEKDAYS } from "../constants/shop";

const LABELS = Object.fromEntries(WEEKDAYS.map((day) => [day.id, day.label]));
const ORDER = WEEKDAYS.map((day) => day.id);

export function formatTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
  if (!match) {
    return value || "";
  }

  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

export function formatWorkingDays(days) {
  const selected = ORDER.filter((day) => days?.includes(day));
  if (selected.length === 0) {
    return "No working days";
  }
  if (selected.length === 7) {
    return "Every day";
  }

  const indexes = selected.map((day) => ORDER.indexOf(day));
  const consecutive = indexes.every((value, index) => index === 0 || value === indexes[index - 1] + 1);
  if (consecutive && selected.length > 1) {
    return `${LABELS[selected[0]]} – ${LABELS[selected[selected.length - 1]]}`;
  }

  return selected.map((day) => LABELS[day]).join(", ");
}

export function formatIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const national = digits.length >= 10 ? digits.slice(-10) : digits;
  if (national.length !== 10) {
    return value || "";
  }
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}

export function businessLabel(source) {
  if (source?.businessType === "Other" && source?.customBusinessType) {
    return source.customBusinessType;
  }
  return source?.businessType || "";
}

export function formatAddress(address) {
  if (!address) {
    return "";
  }

  const lines = [address.addressLine1, address.addressLine2].filter(Boolean);
  const place = [address.city, address.state].filter(Boolean).join(", ");
  const locality = [place, address.pincode].filter(Boolean).join(" - ");
  return [...lines, locality].filter(Boolean).join("\n");
}
