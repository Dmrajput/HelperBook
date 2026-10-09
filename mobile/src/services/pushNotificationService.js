import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { registerPushToken, removePushToken } from "./notificationService";
import { getDeviceInfo } from "../utils/deviceInfo";

let currentToken = "";
let notificationsModule = null;
let handlerReady = false;

function isExpoGo() {
  return Constants.executionEnvironment === "storeClient" || Constants.appOwnership === "expo";
}

export function remotePushAvailable() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android" && isExpoGo()) return false;
  return true;
}

function loadNotifications() {
  if (!remotePushAvailable()) return null;
  if (notificationsModule) return notificationsModule;
  try {
    notificationsModule = require("expo-notifications");
  } catch {
    notificationsModule = null;
    return null;
  }
  if (!handlerReady) {
    handlerReady = true;
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return notificationsModule;
}

export function getCurrentPushToken() {
  return currentToken;
}

async function ensureChannels(Notifications) {
  if (Platform.OS !== "android") return;
  const channels = [
    ["default", "HelperBook", Notifications.AndroidImportance.DEFAULT],
    ["salary", "Salary", Notifications.AndroidImportance.DEFAULT],
    ["leave", "Leave", Notifications.AndroidImportance.DEFAULT],
    ["subscription", "Subscription", Notifications.AndroidImportance.LOW],
  ];
  for (const [id, name, importance] of channels) {
    await Notifications.setNotificationChannelAsync(id, { name, importance });
  }
}

export async function setupPushNotifications() {
  const Notifications = loadNotifications();
  if (!Notifications || !Device.isDevice) {
    return { granted: false, token: "" };
  }
  try {
    await ensureChannels(Notifications);
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") {
      return { granted: false, token: "" };
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
      return { granted: true, token: "" };
    }
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResult?.data || "";
    if (!token) return { granted: true, token: "" };
    const device = await getDeviceInfo();
    if (device.platform !== "android" && device.platform !== "ios") {
      return { granted: true, token: "" };
    }
    await registerPushToken({
      token,
      platform: device.platform,
      deviceId: device.deviceId,
      appVersion: Constants.expoConfig?.version || "1.0.0",
    });
    currentToken = token;
    return { granted: true, token };
  } catch {
    return { granted: false, token: "" };
  }
}

export async function unregisterCurrentPushToken() {
  const token = currentToken;
  currentToken = "";
  if (!token) return;
  try {
    await removePushToken(token);
  } catch {
    currentToken = token;
  }
}

export async function setAppBadge(count) {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.setBadgeCountAsync(Number(count) || 0);
  } catch {
    // Badge support depends on the device.
  }
}

export function listenForPushEvents({ onReceive, onTap }) {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};
  try {
    const received = Notifications.addNotificationReceivedListener(() => {
      if (onReceive) onReceive();
    });
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const data = event?.notification?.request?.content?.data;
      if (data && onTap) onTap(data);
    });
    return () => {
      received.remove();
      response.remove();
    };
  } catch {
    return () => {};
  }
}

export async function lastPushData() {
  const Notifications = loadNotifications();
  if (!Notifications) return null;
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification?.request?.content?.data || null;
  } catch {
    return null;
  }
}

export async function devicePushPermission() {
  if (Platform.OS === "android" && isExpoGo()) return "expo-go";
  if (Platform.OS === "web" || !Device.isDevice) return "unavailable";
  const Notifications = loadNotifications();
  if (!Notifications) return "unavailable";
  try {
    const permission = await Notifications.getPermissionsAsync();
    return permission.status;
  } catch {
    return "unavailable";
  }
}
