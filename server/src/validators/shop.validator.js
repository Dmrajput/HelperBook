import { BUSINESS_TYPES, DEFAULT_SETTINGS, WEEKDAYS } from "../constants/shop.js";
import { AppError } from "../utils/appError.js";
import { normalizeIndianPhone } from "../utils/phone.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function requireLength(value, minimum, maximum, emptyMessage, lengthMessage) {
  const cleaned = text(value);
  if (!cleaned) {
    throw new AppError(emptyMessage, 400);
  }
  if (cleaned.length < minimum || cleaned.length > maximum) {
    throw new AppError(lengthMessage, 400);
  }
  return cleaned;
}

function optionalEmail(value) {
  const cleaned = text(value).toLowerCase();
  if (!cleaned) {
    return "";
  }
  if (cleaned.length > 254 || !EMAIL_PATTERN.test(cleaned)) {
    throw new AppError("Please enter a valid email.", 400);
  }
  return cleaned;
}

function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function validateSickLeaveTreatment(body) {
  const value = typeof body?.sickLeaveTreatment === "string" ? body.sickLeaveTreatment.trim() : "";
  if (value !== "paid" && value !== "unpaid") {
    throw new AppError("Sick leave must be paid or unpaid.", 400);
  }
  return value;
}

export function validateShopPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Please check your information.", 400);
  }

  const name = requireLength(
    body.name,
    2,
    100,
    "Shop name is required.",
    "Shop name must be between 2 and 100 characters."
  );

  const businessType = text(body.businessType);
  if (!BUSINESS_TYPES.includes(businessType)) {
    throw new AppError("Please select a business type.", 400);
  }

  let customBusinessType = null;
  if (businessType === "Other") {
    customBusinessType = requireLength(
      body.customBusinessType,
      2,
      80,
      "Please enter your business type.",
      "Business type must be between 2 and 80 characters."
    );
  }

  const owner = body.owner;
  if (!owner || typeof owner !== "object" || Array.isArray(owner)) {
    throw new AppError("Please enter your name.", 400);
  }

  const fullName = requireLength(
    owner.fullName,
    2,
    100,
    "Please enter your name.",
    "Name must be between 2 and 100 characters."
  );
  const ownerEmail = optionalEmail(owner.email);

  const contact = body.contact && typeof body.contact === "object" && !Array.isArray(body.contact)
    ? body.contact
    : {};
  let shopPhone = "";
  if (text(contact.shopPhone)) {
    shopPhone = normalizeIndianPhone(contact.shopPhone, "+91").nationalNumber;
  }
  const contactEmail = optionalEmail(contact.email);

  const address = body.address;
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    throw new AppError("Address is required.", 400);
  }

  const addressLine1 = requireLength(address.addressLine1, 2, 200, "Address is required.", "Address is required.");
  const addressLine2 = text(address.addressLine2);
  if (addressLine2.length > 200) {
    throw new AppError("Address line 2 is too long.", 400);
  }
  const city = requireLength(address.city, 2, 80, "City is required.", "City is required.");
  const state = requireLength(address.state, 2, 80, "State is required.", "State is required.");
  const pincode = text(address.pincode);
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    throw new AppError("Please enter a valid 6-digit pincode.", 400);
  }

  const country = text(address.country || "India");
  if (country.toLowerCase() !== "india") {
    throw new AppError("Country must be India.", 400);
  }

  const schedule = body.workingSchedule;
  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) {
    throw new AppError("Select at least one working day.", 400);
  }
  if (!Array.isArray(schedule.workingDays)) {
    throw new AppError("Please select valid working days.", 400);
  }

  const workingDays = WEEKDAYS.filter((day) => schedule.workingDays.includes(day));
  if (schedule.workingDays.length === 0 || workingDays.length !== new Set(schedule.workingDays).size) {
    throw new AppError(
      schedule.workingDays.length === 0
        ? "Select at least one working day."
        : "Please select valid working days.",
      400
    );
  }
  if (workingDays.length !== schedule.workingDays.length) {
    throw new AppError("Please select valid working days.", 400);
  }

  const startTime = text(schedule.startTime);
  const endTime = text(schedule.endTime);
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    throw new AppError("Please select valid working hours.", 400);
  }
  if (startTime === endTime) {
    throw new AppError("Opening and closing time cannot be the same.", 400);
  }
  if (toMinutes(endTime) < toMinutes(startTime)) {
    throw new AppError("Overnight working hours are not supported yet.", 400);
  }

  const settingsInput = body.settings && typeof body.settings === "object" ? body.settings : {};
  const currency = text(settingsInput.currency || DEFAULT_SETTINGS.currency);
  const timezone = text(settingsInput.timezone || DEFAULT_SETTINGS.timezone);
  const language = text(settingsInput.language || DEFAULT_SETTINGS.language);
  if (currency !== "INR") {
    throw new AppError("Currency must be INR.", 400);
  }
  if (timezone !== "Asia/Kolkata") {
    throw new AppError("Timezone must be Asia/Kolkata.", 400);
  }
  if (language !== "en") {
    throw new AppError("Language must be English.", 400);
  }

  return {
    name,
    businessType,
    customBusinessType,
    owner: { fullName, email: ownerEmail },
    contact: { shopPhone, email: contactEmail },
    address: {
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country: "India",
    },
    workingSchedule: { workingDays, startTime, endTime },
    settings: { currency, timezone, language },
  };
}
