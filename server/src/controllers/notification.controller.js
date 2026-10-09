import {
  getNotifications,
  getSubscriptionStatus,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  registerPushToken,
  removePushToken,
  getPreferences,
  updatePreferences,
} from "../services/notification.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  validateNotificationId,
  validateNotificationList,
  validatePreferences,
  validatePushToken,
  validateRemovePushToken,
} from "../validators/notification.validator.js";

export async function listNotifications(req, res) {
  const data = await getNotifications(req.user.id, validateNotificationList(req.query));
  sendSuccess(res, "Notifications fetched successfully", data);
}

export async function unreadCount(req, res) {
  const data = await getUnreadCount(req.user.id);
  sendSuccess(res, "Unread notifications fetched successfully", data);
}

export async function readNotification(req, res) {
  const data = await markAsRead(req.user.id, validateNotificationId(req.params.id));
  sendSuccess(res, "Notification marked as read", data);
}

export async function readAllNotifications(req, res) {
  const data = await markAllAsRead(req.user.id);
  sendSuccess(res, "Notifications marked as read", data);
}

export async function savePushToken(req, res) {
  const data = await registerPushToken(req.user.id, validatePushToken(req.body));
  sendSuccess(res, "Push token saved", data);
}

export async function deletePushToken(req, res) {
  const data = await removePushToken(req.user.id, validateRemovePushToken(req.body));
  sendSuccess(res, "Push token removed", data);
}

export async function readPreferences(req, res) {
  await getUnreadCount(req.user.id);
  const data = await getPreferences(req.user.id);
  sendSuccess(res, "Notification settings fetched successfully", data);
}

export async function savePreferences(req, res) {
  await getUnreadCount(req.user.id);
  const data = await updatePreferences(req.user.id, validatePreferences(req.body));
  sendSuccess(res, "Notification settings saved", data);
}

export async function readSubscriptionStatus(req, res) {
  const data = await getSubscriptionStatus(req.user.id);
  sendSuccess(res, "Subscription status fetched successfully", data);
}
