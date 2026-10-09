import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

export function getNotifications(params) {
  return request(async () => {
    const response = await apiClient.get("/notifications", { params });
    return response.data.data;
  });
}

export function getUnreadCount() {
  return request(async () => {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data.data.count;
  });
}

export function markNotificationRead(id) {
  return request(async () => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data.data;
  });
}

export function markAllNotificationsRead() {
  return request(async () => {
    await apiClient.patch("/notifications/read-all");
  });
}

export function registerPushToken(payload) {
  return request(async () => {
    const { getSessionRole } = await import("../utils/tokenStorage");
    const role = await getSessionRole();
    const path = role === "employee" ? "/employee-portal/push-token" : "/notifications/push-token";
    const response = await apiClient.post(path, payload);
    return response.data.data;
  });
}

export function removePushToken(token) {
  return request(async () => {
    const { getSessionRole } = await import("../utils/tokenStorage");
    const role = await getSessionRole();
    const path = role === "employee" ? "/employee-portal/push-token" : "/notifications/push-token";
    await apiClient.delete(path, { data: { token } });
  });
}

export function getNotificationPreferences() {
  return request(async () => {
    const response = await apiClient.get("/notifications/preferences");
    return response.data.data;
  });
}

export function updateNotificationPreferences(payload) {
  return request(async () => {
    const response = await apiClient.put("/notifications/preferences", payload);
    return response.data.data;
  });
}

export function getSubscriptionStatus() {
  return request(async () => {
    const response = await apiClient.get("/notifications/subscription");
    return response.data.data.subscription;
  });
}
