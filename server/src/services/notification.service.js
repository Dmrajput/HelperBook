import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Notification from "../models/Notification.js";
import Subscription from "../models/Subscription.js";
import NotificationPreference from "../models/NotificationPreference.js";
import PushToken from "../models/PushToken.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { NOTIFICATION_RETENTION_DAYS, PUSH_ATTEMPT_LIMIT } from "../constants/notification.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, keyFromDate, todayKey } from "../utils/attendanceDate.js";
import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import { isExpoPushToken, sendExpoPush } from "./pushNotification.service.js";

const PREFERENCE_FIELDS = [
  "pushEnabled",
  "salaryReminderEnabled",
  "salaryPaidEnabled",
  "leaveUpdatesEnabled",
  "subscriptionRemindersEnabled",
];

const CATEGORY_FIELD = {
  salary_reminder: "salaryReminderEnabled",
  salary_paid: "salaryPaidEnabled",
  leave_submitted: "leaveUpdatesEnabled",
  leave_approved: "leaveUpdatesEnabled",
  leave_rejected: "leaveUpdatesEnabled",
  leave_cancelled: "leaveUpdatesEnabled",
  subscription_expiring: "subscriptionRemindersEnabled",
  subscription_expired: "subscriptionRemindersEnabled",
};

export function defaultPreferences() {
  return {
    pushEnabled: true,
    salaryReminderEnabled: true,
    salaryPaidEnabled: true,
    leaveUpdatesEnabled: true,
    subscriptionRemindersEnabled: true,
  };
}

export async function requireShop(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new AppError("Please log in again.", 401);
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) throw new AppError("Create your shop before using notifications.", 404);
  return { user, shop };
}

export async function getPreferences(userId) {
  const saved = await NotificationPreference.findOne({ userId });
  const values = defaultPreferences();
  if (!saved) return values;
  PREFERENCE_FIELDS.forEach((field) => {
    values[field] = saved[field];
  });
  return values;
}

export async function updatePreferences(userId, input) {
  const saved = await NotificationPreference.findOneAndUpdate(
    { userId },
    { userId, ...input },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  const values = defaultPreferences();
  PREFERENCE_FIELDS.forEach((field) => {
    values[field] = saved[field];
  });
  return values;
}

function publicNotification(notification) {
  return {
    id: String(notification._id),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entityType: notification.entityType,
    entityId: notification.entityId ? String(notification.entityId) : null,
    data: notification.data || {},
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export async function getNotifications(userId, { page, limit }) {
  const { shop } = await requireShop(userId);
  const filter = { userId, shopId: shop._id };
  const skip = (page - 1) * limit;
  const [rows, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);
  return {
    notifications: rows.map(publicNotification),
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function getUnreadCount(userId) {
  const { shop } = await requireShop(userId);
  const count = await Notification.countDocuments({ userId, shopId: shop._id, isRead: false });
  return { count };
}

export async function markAsRead(userId, notificationId) {
  const { shop } = await requireShop(userId);
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new AppError("Notification was not found.", 404);
  }
  const notification = await Notification.findOne({ _id: notificationId, userId, shopId: shop._id });
  if (!notification) throw new AppError("Notification was not found.", 404);
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  return publicNotification(notification);
}

export async function markAllAsRead(userId) {
  const { shop } = await requireShop(userId);
  await Notification.updateMany(
    { userId, shopId: shop._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { count: 0 };
}

export async function registerPushToken(userId, input) {
  const { shop } = await requireShop(userId);
  if (!isExpoPushToken(input.token)) {
    throw new AppError("Enter a valid push token.", 400);
  }
  await PushToken.deleteMany({
    token: input.token,
    userId: { $ne: userId },
  });
  await PushToken.deleteMany({
    userId,
    deviceId: input.deviceId,
    token: { $ne: input.token },
  });
  const saved = await PushToken.findOneAndUpdate(
    { token: input.token },
    {
      userId,
      shopId: shop._id,
      token: input.token,
      platform: input.platform,
      deviceId: input.deviceId,
      appVersion: input.appVersion || "",
      employeeId: null,
      isActive: true,
      lastUsedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  return { id: String(saved._id), platform: saved.platform, isActive: saved.isActive };
}

export async function removePushToken(userId, token) {
  if (!token) return { removed: false };
  const result = await PushToken.updateOne({ userId, token }, { isActive: false });
  return { removed: result.matchedCount > 0 };
}

async function recipientPreferences(input) {
  if (input.employeeId) {
    const employee = await Employee.findById(input.employeeId).select("notificationSettings");
    const settings = employee?.notificationSettings || {};
    return {
      pushEnabled: settings.pushEnabled !== false,
      salaryPaidEnabled: settings.salaryPaidEnabled !== false,
      leaveUpdatesEnabled: settings.leaveUpdatesEnabled !== false,
      salaryReminderEnabled: false,
      subscriptionRemindersEnabled: false,
    };
  }
  return getPreferences(input.userId);
}

async function deliverPush(notification) {
  const preferences = await recipientPreferences(notification);
  if (!preferences.pushEnabled) {
    notification.pushStatus = "not_sent";
    await notification.save();
    return;
  }
  const tokens = notification.employeeId
    ? await PushToken.find({ employeeId: notification.employeeId, shopId: notification.shopId, isActive: true })
    : await PushToken.find({ userId: notification.userId, shopId: notification.shopId, isActive: true, employeeId: null });
  if (!tokens.length) {
    notification.pushStatus = "not_sent";
    await notification.save();
    return;
  }
  notification.pushAttempts += 1;
  const result = await sendExpoPush({
    tokens,
    title: notification.pushTitle || notification.title,
    message: notification.pushMessage || notification.message,
    type: notification.type,
    data: {
      type: notification.type,
      notificationId: String(notification._id),
      entityType: notification.entityType,
      entityId: notification.entityId ? String(notification.entityId) : "",
      ...(notification.data || {}),
    },
  });
  notification.pushStatus = result.accepted ? "sent" : "failed";
  notification.pushSentAt = result.accepted ? new Date() : null;
  await notification.save();
}

export async function createIfNotExists(input) {
  const preferences = await recipientPreferences(input);
  const category = CATEGORY_FIELD[input.type];
  if (category && preferences[category] === false) {
    return { notification: null, created: false };
  }
  if (input.employeeId && (input.type === "salary_reminder" || input.type.startsWith("subscription_"))) {
    return { notification: null, created: false };
  }
  try {
    const notification = await Notification.create({
      userId: input.userId || null,
      employeeId: input.employeeId || null,
      recipientType: input.employeeId ? "employee" : "owner",
      shopId: input.shopId,
      type: input.type,
      title: input.title,
      message: input.message,
      pushTitle: input.pushTitle || input.title,
      pushMessage: input.pushMessage || input.message,
      data: input.data || {},
      entityType: input.entityType,
      entityId: input.entityId || null,
      eventKey: input.eventKey,
      pushStatus: "pending",
    });
    await deliverPush(notification);
    return { notification, created: true };
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Notification.findOne({ eventKey: input.eventKey });
      return { notification: existing, created: false };
    }
    throw error;
  }
}

export async function getSubscriptionStatus(userId) {
  const { shop } = await requireShop(userId);
  const subscription = await Subscription.findOne({ shopId: shop._id });
  if (!subscription?.expiresOn || subscription.source === "free" || subscription.planId === "free") return { subscription: null };
  const today = todayKey(shop.settings?.timezone || EMPLOYEE_TIME_ZONE);
  const expiresOn = keyFromDate(subscription.expiresOn);
  const daysRemaining = Math.round((dateFromKey(expiresOn).getTime() - dateFromKey(today).getTime()) / 86400000);
  return {
    subscription: {
      id: String(subscription._id),
      planName: subscription.planName || "",
      expiresOn,
      daysRemaining,
      expired: expiresOn <= today,
    },
  };
}

export async function notifySafely(work) {
  try {
    await work();
  } catch (error) {
    console.error("Notification event failed.", error?.message || "unknown");
  }
}

export async function retryFailedPushes() {
  const pending = await Notification.find({
    pushStatus: "failed",
    pushAttempts: { $lt: PUSH_ATTEMPT_LIMIT },
  }).limit(50);
  for (const notification of pending) {
    await deliverPush(notification);
  }
}

export async function cleanupOldNotifications() {
  const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await Notification.deleteMany({ isRead: true, createdAt: { $lt: cutoff } });
}

export async function listEmployeeNotifications(employee, page, limit) {
  const filter = { employeeId: employee._id, shopId: employee.shopId, recipientType: "employee" };
  const skip = (page - 1) * limit;
  const [rows, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);
  return {
    notifications: rows.map(publicNotification),
    unreadCount,
    pagination: { page, limit, total, pages: total === 0 ? 0 : Math.ceil(total / limit) },
  };
}

export async function markEmployeeNotificationRead(employee, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) throw new AppError("Notification was not found.", 404);
  const notification = await Notification.findOne({
    _id: notificationId,
    employeeId: employee._id,
    shopId: employee.shopId,
  });
  if (!notification) throw new AppError("Notification was not found.", 404);
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  return publicNotification(notification);
}

export async function markAllEmployeeNotificationsRead(employee) {
  await Notification.updateMany(
    { employeeId: employee._id, shopId: employee.shopId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { count: 0 };
}

export async function registerEmployeePushToken(employee, input) {
  if (!isExpoPushToken(input.token)) throw new AppError("Enter a valid push token.", 400);
  await PushToken.deleteMany({ token: input.token });
  await PushToken.deleteMany({ employeeId: employee._id, deviceId: input.deviceId });
  const saved = await PushToken.create({
    employeeId: employee._id,
    shopId: employee.shopId,
    token: input.token,
    platform: input.platform,
    deviceId: input.deviceId,
    appVersion: input.appVersion || "",
    isActive: true,
    lastUsedAt: new Date(),
  });
  return { id: String(saved._id), platform: saved.platform, isActive: saved.isActive };
}

export async function removeEmployeePushToken(employee, token) {
  if (!token) return { removed: false };
  const result = await PushToken.updateOne({ employeeId: employee._id, token }, { isActive: false });
  return { removed: result.matchedCount > 0 };
}

export function employeeNotificationPreferences(employee) {
  const settings = employee.notificationSettings || {};
  return {
    pushEnabled: settings.pushEnabled !== false,
    leaveUpdatesEnabled: settings.leaveUpdatesEnabled !== false,
    salaryPaidEnabled: settings.salaryPaidEnabled !== false,
  };
}

export async function updateEmployeeNotificationPreferences(employee, input) {
  employee.notificationSettings = {
    pushEnabled: input.pushEnabled !== false,
    leaveUpdatesEnabled: input.leaveUpdatesEnabled !== false,
    salaryPaidEnabled: input.salaryPaidEnabled !== false,
  };
  employee.markModified("notificationSettings");
  await employee.save();
  return employeeNotificationPreferences(employee);
}
