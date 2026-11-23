import { AppError } from "../utils/appError.js";
import {
  INQUIRY_CATEGORIES,
  TEAM_SIZES,
} from "../models/MarketingLead.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function trim(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function requireText(value, label, { min = 1, max = 120 } = {}) {
  const text = trim(value, max);
  if (text.length < min) throw new AppError(`Enter a valid ${label}.`, 400);
  return text;
}

function optionalText(value, max) {
  return trim(value, max);
}

function validateEmail(value) {
  const email = trim(value, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new AppError("Enter a valid work email.", 400);
  return email;
}

/** Accepts international numbers loosely; stores digits and leading +. */
function validatePhone(value, { required = false } = {}) {
  const raw = trim(value, 30);
  if (!raw) {
    if (required) throw new AppError("Enter a phone number.", 400);
    return "";
  }
  const normalized = raw.replace(/[^\d+]/g, "");
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new AppError("Enter a valid phone number.", 400);
  }
  return normalized.startsWith("+") ? `+${digits}` : digits;
}

function validatePreferredDate(value) {
  const date = trim(value, 10);
  if (!date) return "";
  if (!DATE_RE.test(date)) throw new AppError("Enter a valid preferred date.", 400);
  return date;
}

export function validateDemoRequest(body = {}) {
  if (body.website || body.companyUrl) {
    throw new AppError("Unable to submit this request.", 400);
  }
  if (body.privacyAccepted !== true && body.privacyAcknowledged !== true) {
    throw new AppError("Please acknowledge the privacy policy.", 400);
  }
  const teamSize = trim(body.teamSize, 20);
  if (!TEAM_SIZES.includes(teamSize)) {
    throw new AppError("Choose a team size.", 400);
  }
  return {
    type: "demo",
    fullName: requireText(body.fullName, "full name", { min: 2, max: 120 }),
    companyName: requireText(body.companyName || body.businessName, "business name", { min: 2, max: 160 }),
    email: validateEmail(body.email),
    phone: validatePhone(body.phone, { required: true }),
    teamSize,
    message: optionalText(body.message || body.requirements, 4000),
    preferredDate: validatePreferredDate(body.preferredDate),
    preferredTimeWindow: optionalText(body.preferredTimeWindow, 80),
    timezone: optionalText(body.timezone, 64) || "Asia/Kolkata",
    sourcePage: optionalText(body.sourcePage, 200) || "/book-demo",
    marketingConsent: body.marketingConsent === true,
    privacyPolicyVersion: optionalText(body.privacyPolicyVersion, 40) || "2026-10-24",
    idempotencyKey: optionalText(body.idempotencyKey, 80) || undefined,
  };
}

export function validateInquiry(body = {}) {
  if (body.website || body.companyUrl) {
    throw new AppError("Unable to submit this request.", 400);
  }
  if (body.privacyAccepted !== true && body.privacyAcknowledged !== true) {
    throw new AppError("Please acknowledge the privacy policy.", 400);
  }
  const inquiryCategory = trim(body.inquiryCategory || body.inquiryType, 40);
  if (!INQUIRY_CATEGORIES.includes(inquiryCategory)) {
    throw new AppError("Choose an inquiry type.", 400);
  }
  return {
    type: "inquiry",
    fullName: requireText(body.fullName, "full name", { min: 2, max: 120 }),
    companyName: optionalText(body.companyName, 160),
    email: validateEmail(body.email),
    phone: validatePhone(body.phone, { required: false }),
    inquiryCategory,
    message: requireText(body.message, "message", { min: 10, max: 4000 }),
    timezone: optionalText(body.timezone, 64) || "Asia/Kolkata",
    sourcePage: optionalText(body.sourcePage, 200) || "/contact",
    marketingConsent: body.marketingConsent === true,
    privacyPolicyVersion: optionalText(body.privacyPolicyVersion, 40) || "2026-10-24",
    idempotencyKey: optionalText(body.idempotencyKey, 80) || undefined,
  };
}
