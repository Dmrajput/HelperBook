import mongoose from "mongoose";
import { NOTIFICATION_MAX_PAGE_LIMIT, PUSH_PLATFORMS } from "../constants/notification.js";
import { AppError } from "../utils/appError.js";

const PREFERENCE_FIELDS = [
  "pushEnabled",
  "salaryReminderEnabled",
  "salaryPaidEnabled",
  "leaveUpdatesEnabled",
  "subscriptionRemindersEnabled",
];

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateNotificationList(query) {
  const source = query && typeof query === "object" ? query : {};
  const page = source.page === undefined || source.page === "" ? 1 : Number(source.page);
  const limit = source.limit === undefined || source.limit === "" ? 20 : Number(source.limit);
  if (!Number.isInteger(page) || page < 1) throw new AppError("Page must be a positive number.", 400);
  if (!Number.isInteger(limit) || limit < 1 || limit > NOTIFICATION_MAX_PAGE_LIMIT) {
    throw new AppError("Limit must be between 1 and 100.", 400);
  }
  return { page, limit };
}

export function validateNotificationId(value) {
  if (!mongoose.isValidObjectId(value)) throw new AppError("Notification was not found.", 404);
  return value;
}

export function validatePushToken(body) {
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const token = text(source.token);
  const platform = text(source.platform);
  const deviceId = text(source.deviceId);
  const appVersion = text(source.appVersion).slice(0, 40);
  if (!token || token.length > 200) throw new AppError("Enter a valid push token.", 400);
  if (!PUSH_PLATFORMS.includes(platform)) throw new AppError("Platform is not supported.", 400);
  if (!deviceId || deviceId.length > 80) throw new AppError("Device was not recognized.", 400);
  return { token, platform, deviceId, appVersion };
}

export function validateRemovePushToken(body) {
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const token = text(source.token);
  if (!token) throw new AppError("Enter a valid push token.", 400);
  return token;
}

export function validatePreferences(body) {
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : null;
  if (!source) throw new AppError("Notification settings are invalid.", 400);
  const next = {};
  for (const field of PREFERENCE_FIELDS) {
    if (typeof source[field] !== "boolean") {
      throw new AppError("Notification settings must be true or false.", 400);
    }
    next[field] = source[field];
  }
  return next;
}
