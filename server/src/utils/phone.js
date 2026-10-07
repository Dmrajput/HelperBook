import { AppError } from "./appError.js";

export function normalizeIndianPhone(phoneNumber, countryCode) {
  const code = typeof countryCode === "string" ? countryCode.trim() : "";

  if (code !== "+91") {
    throw new AppError("Country code must be +91.", 400);
  }

  let digits = String(phoneNumber ?? "").replace(/\D/g, "");

  if (!digits) {
    throw new AppError("Enter your mobile number.", 400);
  }

  if (digits.startsWith("0091")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new AppError("Enter a valid 10-digit mobile number.", 400);
  }

  return {
    countryCode: "+91",
    nationalNumber: digits,
    e164: `+91${digits}`,
  };
}
