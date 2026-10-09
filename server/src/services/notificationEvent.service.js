import Employee from "../models/Employee.js";
import SalaryRecord from "../models/SalaryRecord.js";
import Shop from "../models/Shop.js";
import Subscription from "../models/Subscription.js";
import { REMINDER_DAY_OFFSETS } from "../constants/notification.js";
import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import { formatInr } from "../utils/currency.js";
import { dateFromKey, keyFromDate, todayKey } from "../utils/attendanceDate.js";
import { createIfNotExists } from "./notification.service.js";
import {
  dateSpan,
  leaveApprovedCopy,
  leaveCancelledCopy,
  leaveRejectedCopy,
  leaveSubmittedCopy,
  salaryPaidCopy,
  salaryPeriodLabel,
  salaryReminderCopy,
  subscriptionExpiredCopy,
  subscriptionExpiringCopy,
} from "./notificationTemplates.js";

function dayGap(fromKey, toKey) {
  return Math.round((dateFromKey(toKey).getTime() - dateFromKey(fromKey).getTime()) / 86400000);
}

function shopZone(shop) {
  return shop?.settings?.timezone || EMPLOYEE_TIME_ZONE;
}

async function notifyEmployee(shop, employeeId, input) {
  if (!employeeId) return null;
  try {
    return await createIfNotExists({
      userId: null,
      employeeId,
      shopId: shop._id,
      ...input,
    });
  } catch (error) {
    console.error("Employee notification failed.", error?.message || "unknown");
    return null;
  }
}

function employeeLeaveCopy(kind, span, reason) {
  const push = { pushTitle: "Leave Update", pushMessage: "Your leave request has been updated." };
  if (kind === "submitted") {
    return { title: "Leave Requested", message: `Your leave request for ${span} has been sent.`, ...push };
  }
  if (kind === "approved") {
    return { title: "Leave Approved", message: `Your leave request for ${span} has been approved.`, ...push };
  }
  if (kind === "rejected") {
    return {
      title: "Leave Rejected",
      message: reason ? `Your leave request was rejected. ${reason}` : "Your leave request was rejected.",
      ...push,
    };
  }
  return { title: "Leave Cancelled", message: `Your leave request for ${span} was cancelled.`, ...push };
}

async function employeeName(shopId, employeeId) {
  const employee = await Employee.findOne({ _id: employeeId, shopId }).select("name");
  return employee?.name || "An employee";
}

export async function onSalaryPaid({ shop, salary, payment }) {
  if (!shop || !salary || !payment) return null;
  const name = await employeeName(shop._id, salary.employeeId);
  const period = salaryPeriodLabel(salary.year, salary.month);
  const amount = formatInr(salary.calculation?.netSalary || payment.amount);
  const copy = salaryPaidCopy(name, period, amount);
  const ownerNotice = await createIfNotExists({
    userId: shop.ownerId,
    shopId: shop._id,
    type: "salary_paid",
    eventKey: `salary_paid:${salary._id}:${payment._id}`,
    entityType: "salary",
    entityId: salary._id,
    data: {
      entityType: "salary",
      entityId: String(salary._id),
      salaryId: String(salary._id),
      employeeId: String(salary.employeeId),
      paymentId: String(payment._id),
    },
    ...copy,
  });
  await notifyEmployee(shop, salary.employeeId, {
    type: "salary_paid",
    eventKey: `salary_paid:employee:${salary.employeeId}:${salary._id}:${payment._id}`,
    entityType: "salary",
    entityId: salary._id,
    data: { entityType: "salary", entityId: String(salary._id), salaryId: String(salary._id) },
    title: "Salary Paid",
    message: `Your ${period} salary has been marked as paid.`,
    pushTitle: "Salary Paid",
    pushMessage: "Your salary has been marked as paid.",
  });
  return ownerNotice;
}

export async function onLeaveSubmitted({ shop, leave, employeeName: name, startKey, endKey }) {
  const span = dateSpan(startKey, endKey);
  const copy = leaveSubmittedCopy(name, span);
  const ownerNotice = await createIfNotExists({
    userId: shop.ownerId,
    shopId: shop._id,
    type: "leave_submitted",
    eventKey: `leave_submitted:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id), employeeId: String(leave.employeeId) },
    ...copy,
  });
  await notifyEmployee(shop, leave.employeeId, {
    type: "leave_submitted",
    eventKey: `leave_submitted:employee:${leave.employeeId}:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id) },
    ...employeeLeaveCopy("submitted", span),
  });
  return ownerNotice;
}

export async function onLeaveApproved({ shop, leave, employeeName: name, startKey, endKey }) {
  const span = dateSpan(startKey, endKey);
  const copy = leaveApprovedCopy(name, span);
  const ownerNotice = await createIfNotExists({
    userId: shop.ownerId,
    shopId: shop._id,
    type: "leave_approved",
    eventKey: `leave_approved:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id), employeeId: String(leave.employeeId) },
    ...copy,
  });
  await notifyEmployee(shop, leave.employeeId, {
    type: "leave_approved",
    eventKey: `leave_approved:employee:${leave.employeeId}:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id) },
    ...employeeLeaveCopy("approved", span),
  });
  return ownerNotice;
}

export async function onLeaveRejected({ shop, leave, employeeName: name, reason }) {
  const copy = leaveRejectedCopy(name, reason);
  const ownerNotice = await createIfNotExists({
    userId: shop.ownerId,
    shopId: shop._id,
    type: "leave_rejected",
    eventKey: `leave_rejected:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id), employeeId: String(leave.employeeId) },
    ...copy,
  });
  await notifyEmployee(shop, leave.employeeId, {
    type: "leave_rejected",
    eventKey: `leave_rejected:employee:${leave.employeeId}:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id) },
    ...employeeLeaveCopy("rejected", "", reason),
  });
  return ownerNotice;
}

export async function onLeaveCancelled({ shop, leave, employeeName: name, startKey, endKey }) {
  const span = dateSpan(startKey, endKey);
  const copy = leaveCancelledCopy(name, span);
  const ownerNotice = await createIfNotExists({
    userId: shop.ownerId,
    shopId: shop._id,
    type: "leave_cancelled",
    eventKey: `leave_cancelled:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id), employeeId: String(leave.employeeId) },
    ...copy,
  });
  await notifyEmployee(shop, leave.employeeId, {
    type: "leave_cancelled",
    eventKey: `leave_cancelled:employee:${leave.employeeId}:${leave._id}`,
    entityType: "leave",
    entityId: leave._id,
    data: { entityType: "leave", entityId: String(leave._id) },
    ...employeeLeaveCopy("cancelled", span),
  });
  return ownerNotice;
}

export async function processSalaryReminders() {
  const salaries = await SalaryRecord.find({ status: "finalized", paymentStatus: "unpaid" }).select(
    "shopId employeeId year month periodEnd calculation.netSalary status paymentStatus"
  );
  const shops = await Shop.find({ _id: { $in: salaries.map((salary) => salary.shopId) }, isActive: true });
  const shopById = new Map(shops.map((shop) => [String(shop._id), shop]));
  for (const salary of salaries) {
    const shop = shopById.get(String(salary.shopId));
    if (!shop) continue;
    const today = todayKey(shopZone(shop));
    const periodEnd = keyFromDate(salary.periodEnd);
    if (today <= periodEnd) continue;
    const name = await employeeName(shop._id, salary.employeeId);
    const copy = salaryReminderCopy(name, salaryPeriodLabel(salary.year, salary.month), formatInr(salary.calculation?.netSalary));
    await createIfNotExists({
      userId: shop.ownerId,
      shopId: shop._id,
      type: "salary_reminder",
      eventKey: `salary_reminder:${salary._id}:${today}`,
      entityType: "salary",
      entityId: salary._id,
      data: {
        entityType: "salary",
        entityId: String(salary._id),
        salaryId: String(salary._id),
        employeeId: String(salary.employeeId),
        paymentStatus: "unpaid",
      },
      ...copy,
    });
  }
}

async function subscriptionCopies(kind, subscription, days) {
  const shop = await Shop.findOne({ _id: subscription.shopId, isActive: true });
  if (!shop) return;
  const expiryKey = keyFromDate(subscription.expiresOn);
  if (kind === "expiring") {
    const copy = subscriptionExpiringCopy(days);
    await createIfNotExists({
      userId: subscription.userId,
      shopId: shop._id,
      type: "subscription_expiring",
      eventKey: `subscription_expiring:${subscription._id}:${expiryKey}:${days}`,
      entityType: "subscription",
      entityId: subscription._id,
      data: { entityType: "subscription", entityId: String(subscription._id), days },
      ...copy,
    });
    return;
  }
  const copy = subscriptionExpiredCopy(subscription.source);
  await createIfNotExists({
    userId: subscription.userId,
    shopId: shop._id,
    type: "subscription_expired",
    eventKey: `subscription_expired:${subscription._id}:${expiryKey}`,
    entityType: "subscription",
    entityId: subscription._id,
    data: { entityType: "subscription", entityId: String(subscription._id) },
    ...copy,
  });
}

export async function processSubscriptionReminders() {
  const subscriptions = await Subscription.find({});
  for (const subscription of subscriptions) {
    const shop = await Shop.findOne({ _id: subscription.shopId, isActive: true }).select("settings.timezone");
    if (!shop) continue;
    if (!subscription.expiresOn || subscription.source === "free" || subscription.planId === "free") continue;
    const today = todayKey(shopZone(shop));
    const expiryKey = keyFromDate(subscription.expiresOn);
    const days = dayGap(today, expiryKey);
    if (!REMINDER_DAY_OFFSETS.includes(days)) continue;
    await subscriptionCopies("expiring", subscription, days);
  }
}

export async function processSubscriptionExpiry() {
  const subscriptions = await Subscription.find({});
  for (const subscription of subscriptions) {
    const shop = await Shop.findOne({ _id: subscription.shopId, isActive: true }).select("settings.timezone");
    if (!shop) continue;
    if (!subscription.expiresOn || subscription.source === "free" || subscription.planId === "free") continue;
    const today = todayKey(shopZone(shop));
    const expiryKey = keyFromDate(subscription.expiresOn);
    const stillActive = subscription.source === "razorpay" && expiryKey >= today;
    if (stillActive || expiryKey > today) continue;
    await subscriptionCopies("expired", subscription);
  }
}
