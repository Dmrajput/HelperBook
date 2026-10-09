import { cleanupOldNotifications, retryFailedPushes } from "../services/notification.service.js";
import {
  processSalaryReminders,
  processSubscriptionExpiry,
  processSubscriptionReminders,
} from "../services/notificationEvent.service.js";
import { processSubscriptionLifecycle } from "../services/subscription.service.js";

const HOUR_MS = 60 * 60 * 1000;
let running = false;
let started = false;

export async function runNotificationJobs() {
  if (running) return;
  running = true;
  try {
    await processSubscriptionLifecycle();
    await processSalaryReminders();
    await processSubscriptionReminders();
    await processSubscriptionExpiry();
    await retryFailedPushes();
    await cleanupOldNotifications();
  } catch (error) {
    console.error("Notification job failed.", error?.message || "unknown");
  } finally {
    running = false;
  }
}

export function startNotificationJobs() {
  if (started) return;
  started = true;
  setTimeout(runNotificationJobs, 20000);
  setInterval(runNotificationJobs, HOUR_MS);
}
