import mongoose from "mongoose";
import AdminUser from "../../models/AdminUser.js";
import Coupon from "../../models/Coupon.js";
import CouponRedemption from "../../models/CouponRedemption.js";
import Employee from "../../models/Employee.js";
import PlatformSetting from "../../models/PlatformSetting.js";
import Session from "../../models/Session.js";
import Shop from "../../models/Shop.js";
import Subscription from "../../models/Subscription.js";
import SubscriptionHistory from "../../models/SubscriptionHistory.js";
import SubscriptionPayment from "../../models/SubscriptionPayment.js";
import SupportTicket, { CATEGORIES, PRIORITIES, STATUSES } from "../../models/SupportTicket.js";
import User from "../../models/User.js";
import Attendance from "../../models/Attendance.js";
import Leave from "../../models/Leave.js";
import SalaryRecord from "../../models/SalaryRecord.js";
import AdminAuditLog from "../../models/AdminAuditLog.js";
import { adminHasPermission } from "../../config/adminPermissions.js";
import { getSubscriptionConfig } from "../../config/subscription.config.js";
import { AppError } from "../../utils/appError.js";
import { dateFromKey, todayKey } from "../../utils/attendanceDate.js";
import { createRazorpayRefund, razorpayConfigured } from "../razorpay.service.js";
import { hashPassword } from "./adminAuth.service.js";
import { writeAudit } from "./audit.service.js";
import { normalizeCouponCode } from "./coupon.service.js";
import { revokeEmployeeAccess } from "../employeeAuth.service.js";

const DEFINITIONS = {
  monthlyCollectedRevenue: "Sum of verified captured subscription payments in the period, minus refunds confirmed by the payment provider in that period. Pending and failed payments are excluded. Salary payments are excluded.",
  activePaidSubscriptions: "Subscriptions whose stored status is active, whose source is razorpay, and whose current period end is today or later. Free plans and trials are excluded.",
  trialConversionRate: "Shops that have used a trial and now have a razorpay-sourced active or cancelled-but-unexpired subscription, divided by shops that have used a trial.",
  churnRate: "Paid subscriptions that are expired, or cancelled with a period end before today, among paid subscriptions. Access that remains until period end is not counted as churn.",
};

function pageParams(query) {
  const page = Math.max(1, Number(query?.page) || 1);
  let limit = Number(query?.limit) || 20;
  if (!Number.isInteger(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  return { page, limit, skip: (page - 1) * limit };
}

function rangeBounds(query) {
  const today = todayKey();
  const preset = query?.range || "last_30_days";
  let startKey = today;
  let endKey = today;
  if (preset === "today") {
    startKey = today;
  } else if (preset === "last_7_days") {
    startKey = shift(today, -6);
  } else if (preset === "last_30_days") {
    startKey = shift(today, -29);
  } else if (preset === "this_month") {
    startKey = `${today.slice(0, 8)}01`;
  } else if (preset === "previous_month") {
    const [year, month] = today.split("-").map(Number);
    const previous = new Date(Date.UTC(year, month - 2, 1));
    startKey = previous.toISOString().slice(0, 10);
    endKey = shift(`${today.slice(0, 8)}01`, -1);
  } else if (preset === "custom") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.startDate || "") || !/^\d{4}-\d{2}-\d{2}$/.test(query.endDate || "")) {
      throw new AppError("Select a valid date range.", 400);
    }
    startKey = query.startDate;
    endKey = query.endDate;
  }
  if (startKey > endKey) throw new AppError("The start date must be on or before the end date.", 400);
  const start = dateFromKey(startKey);
  const end = new Date(dateFromKey(endKey).getTime() + 86400000);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days > 366) throw new AppError("Select a date range of 366 days or less.", 400);
  return { start, end, startKey, endKey, preset };
}

function shift(key, days) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `******${digits.slice(-4)}`;
}

function reasonOf(body) {
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 5 || reason.length > 300) {
    throw new AppError("Enter a reason between 5 and 300 characters.", 400);
  }
  return reason;
}

async function counts(model, match) {
  return model.countDocuments(match);
}

export async function dashboardSummary(query) {
  const { start, end } = rangeBounds(query);
  const today = dateFromKey(todayKey());
  const [owners, shops, employees, paid, trials, expired, captured, failed, pending, openTickets, registrations, redemptions] = await Promise.all([
    counts(User, { role: "owner" }),
    counts(Shop, { isActive: true }),
    counts(Employee, {}),
    counts(Subscription, { source: "razorpay", status: "active", currentPeriodEnd: { $gte: today } }),
    counts(Subscription, { isTrial: true, status: "trialing" }),
    counts(Subscription, { status: "expired" }),
    SubscriptionPayment.aggregate([{ $match: { status: "paid", paidAt: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    counts(SubscriptionPayment, { status: "failed", createdAt: { $gte: start, $lt: end } }),
    counts(SubscriptionPayment, { status: { $in: ["created", "pending"] }, createdAt: { $gte: start, $lt: end } }),
    counts(SupportTicket, { status: { $in: ["open", "in_progress", "waiting_for_customer"] } }),
    counts(User, { role: "owner", createdAt: { $gte: start, $lt: end } }),
    counts(CouponRedemption, { createdAt: { $gte: start, $lt: end } }),
  ]);
  const refunds = await SubscriptionPayment.aggregate([
    { $match: { refundStatus: "processed", updatedAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const capturedPaise = captured[0]?.total || 0;
  const refundPaise = refunds[0]?.total || 0;
  return {
    range: { start: start.toISOString(), end: end.toISOString() },
    owners,
    shops,
    employees,
    activePaidSubscriptions: paid,
    activeTrials: trials,
    expiredSubscriptions: expired,
    capturedRevenue: (capturedPaise - refundPaise) / 100,
    successfulPayments: captured[0]?.count || 0,
    failedPayments: failed,
    pendingPayments: pending,
    openTickets,
    newRegistrations: registrations,
    couponRedemptions: redemptions,
    definitions: DEFINITIONS,
  };
}

export async function dashboardTrends(query) {
  const { start, end } = rangeBounds(query);
  const [registrations, shops, payments, plans, statuses, tickets] = await Promise.all([
    User.aggregate([{ $match: { role: "owner", createdAt: { $gte: start, $lt: end } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Shop.aggregate([{ $match: { createdAt: { $gte: start, $lt: end } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    SubscriptionPayment.aggregate([{ $match: { createdAt: { $gte: start, $lt: end }, status: { $in: ["paid", "failed"] } } }, { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, status: "$status" }, count: { $sum: 1 }, amount: { $sum: "$amount" } } }, { $sort: { "_id.day": 1 } }]),
    Subscription.aggregate([{ $group: { _id: "$planId", count: { $sum: 1 } } }]),
    Subscription.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    SupportTicket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  return { registrations, shops, payments, plans, statuses, tickets };
}

export async function recentActivity() {
  const [owners, shops, payments, history, tickets] = await Promise.all([
    User.find({ role: "owner" }).sort({ createdAt: -1 }).limit(5).select("fullName phoneNumber createdAt"),
    Shop.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select("name createdAt ownerId"),
    SubscriptionPayment.find({ status: "paid" }).sort({ paidAt: -1 }).limit(5).select("amount paidAt planId shopId userId"),
    SubscriptionHistory.find().sort({ createdAt: -1 }).limit(5).select("eventType toPlanId createdAt shopId"),
    SupportTicket.find().sort({ createdAt: -1 }).limit(5).select("ticketNumber subject status createdAt"),
  ]);
  return {
    owners: owners.map((user) => ({ id: String(user._id), name: user.fullName || "Owner", phone: maskPhone(user.phoneNumber), createdAt: user.createdAt })),
    shops: shops.map((shop) => ({ id: String(shop._id), name: shop.name, createdAt: shop.createdAt })),
    payments: payments.map((payment) => ({ id: String(payment._id), amount: payment.amount / 100, planId: payment.planId, paidAt: payment.paidAt })),
    history: history.map((item) => ({ id: String(item._id), eventType: item.eventType, planId: item.toPlanId, createdAt: item.createdAt })),
    tickets: tickets.map((ticket) => ({ id: String(ticket._id), ticketNumber: ticket.ticketNumber, subject: ticket.subject, status: ticket.status, createdAt: ticket.createdAt })),
  };
}

export async function listUsers(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = { role: "owner" };
  if (query.status === "active") filter.isActive = true;
  if (query.status === "suspended") filter.isActive = false;
  if (query.search) {
    const term = String(query.search).trim().slice(0, 80);
    filter.$or = [
      { fullName: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { phoneNumber: { $regex: term.replace(/\D/g, "").slice(-10) || term } },
    ];
  }
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  const users = [];
  for (const user of rows) {
    const shop = await Shop.findOne({ ownerId: user._id }).select("name");
    const subscription = shop ? await Subscription.findOne({ shopId: shop._id }).select("planId status isTrial") : null;
    users.push({
      id: String(user._id),
      name: user.fullName || shop?.owner?.fullName || "Owner",
      phone: maskPhone(user.phoneNumber),
      status: user.isActive ? "active" : "suspended",
      shops: shop ? 1 : 0,
      planId: subscription?.planId || null,
      trial: Boolean(subscription?.isTrial),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    });
  }
  return { users, page, limit, total };
}

export async function getUser(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("User was not found.", 404);
  const user = await User.findOne({ _id: id, role: "owner" });
  if (!user) throw new AppError("User was not found.", 404);
  const shop = await Shop.findOne({ ownerId: user._id });
  const subscription = shop ? await Subscription.findOne({ shopId: shop._id }) : null;
  const payments = await SubscriptionPayment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).select("amount status planId paidAt createdAt");
  const tickets = await SupportTicket.find({ requesterUserId: user._id }).sort({ createdAt: -1 }).limit(10).select("ticketNumber subject status createdAt");
  return {
    user: {
      id: String(user._id),
      name: user.fullName || "",
      phone: maskPhone(user.phoneNumber),
      status: user.isActive ? "active" : "suspended",
      suspensionReason: user.suspensionReason || "",
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      adminNotes: user.adminNotes || "",
    },
    shop: shop ? { id: String(shop._id), name: shop.name, accessSuspended: shop.accessSuspended } : null,
    subscription: subscription ? { id: String(subscription._id), planId: subscription.planId, status: subscription.status, isTrial: subscription.isTrial } : null,
    payments: payments.map((payment) => ({ id: String(payment._id), amount: payment.amount / 100, status: payment.status, planId: payment.planId, paidAt: payment.paidAt })),
    tickets: tickets.map((ticket) => ({ id: String(ticket._id), ticketNumber: ticket.ticketNumber, subject: ticket.subject, status: ticket.status })),
  };
}

export async function setUserStatus(admin, id, body) {
  const user = await User.findOne({ _id: id, role: "owner" });
  if (!user) throw new AppError("User was not found.", 404);
  const reason = reasonOf(body);
  const suspend = body.status === "suspended";
  if (body.status !== "suspended" && body.status !== "active") throw new AppError("Choose active or suspended.", 400);
  if (!suspend && !adminHasPermission(admin, "users.update")) {
    throw new AppError("You do not have permission to perform this action.", 403, true, { code: "ADMIN_PERMISSION_DENIED" });
  }
  const before = { isActive: user.isActive };
  user.isActive = !suspend;
  user.suspensionReason = suspend ? reason : "";
  user.suspendedAt = suspend ? new Date() : null;
  user.suspendedByAdminId = suspend ? admin._id : null;
  if (typeof body.note === "string") user.adminNotes = body.note.trim().slice(0, 1000);
  await user.save();
  if (suspend) await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
  await writeAudit(admin, { action: suspend ? "user.suspend" : "user.reactivate", resourceType: "user", resourceId: user._id, reason, beforeSummary: before, afterSummary: { isActive: user.isActive } });
  return { id: String(user._id), status: user.isActive ? "active" : "suspended" };
}

export async function listShops(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = { isActive: true };
  if (query.businessType) filter.businessType = query.businessType;
  if (query.status === "suspended") filter.accessSuspended = true;
  if (query.status === "active") filter.accessSuspended = false;
  if (query.search) filter.name = { $regex: String(query.search).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const [rows, total] = await Promise.all([
    Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Shop.countDocuments(filter),
  ]);
  const shops = [];
  for (const shop of rows) {
    const [employees, subscription, owner] = await Promise.all([
      Employee.countDocuments({ shopId: shop._id, status: "active" }),
      Subscription.findOne({ shopId: shop._id }).select("planId status"),
      User.findById(shop.ownerId).select("fullName phoneNumber"),
    ]);
    shops.push({
      id: String(shop._id),
      name: shop.name,
      owner: owner?.fullName || shop.owner?.fullName || "",
      businessType: shop.businessType,
      city: shop.address?.city || "",
      state: shop.address?.state || "",
      createdAt: shop.createdAt,
      activeEmployees: employees,
      planId: subscription?.planId || null,
      accessSuspended: Boolean(shop.accessSuspended),
    });
  }
  return { shops, page, limit, total };
}

export async function getShop(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Shop was not found.", 404);
  const shop = await Shop.findById(id);
  if (!shop) throw new AppError("Shop was not found.", 404);
  const [owner, employees, subscription] = await Promise.all([
    User.findById(shop.ownerId).select("fullName phoneNumber isActive lastLoginAt"),
    Employee.countDocuments({ shopId: shop._id, status: "active" }),
    Subscription.findOne({ shopId: shop._id }),
  ]);
  return {
    shop: {
      id: String(shop._id),
      name: shop.name,
      businessType: shop.businessType,
      city: shop.address?.city,
      state: shop.address?.state,
      createdAt: shop.createdAt,
      accessSuspended: Boolean(shop.accessSuspended),
      accessSuspensionReason: shop.accessSuspensionReason || "",
      adminNotes: shop.adminNotes || "",
      activeEmployees: employees,
    },
    owner: owner ? { id: String(owner._id), name: owner.fullName || shop.owner?.fullName, phone: maskPhone(owner.phoneNumber), status: owner.isActive ? "active" : "suspended" } : null,
    subscription: subscription ? { id: String(subscription._id), planId: subscription.planId, status: subscription.status, isTrial: subscription.isTrial, currentPeriodEnd: subscription.currentPeriodEnd } : null,
  };
}

export async function setShopStatus(admin, id, body) {
  const shop = await Shop.findById(id);
  if (!shop) throw new AppError("Shop was not found.", 404);
  const reason = reasonOf(body);
  const suspend = body.status === "suspended";
  if (body.status !== "suspended" && body.status !== "active") throw new AppError("Choose active or suspended.", 400);
  const before = { accessSuspended: shop.accessSuspended };
  shop.accessSuspended = suspend;
  shop.accessSuspensionReason = suspend ? reason : "";
  if (typeof body.note === "string") shop.adminNotes = body.note.trim().slice(0, 1000);
  await shop.save();
  await writeAudit(admin, { action: suspend ? "shop.suspend" : "shop.reactivate", resourceType: "shop", resourceId: shop._id, reason, beforeSummary: before, afterSummary: { accessSuspended: shop.accessSuspended } });
  return { id: String(shop._id), accessSuspended: shop.accessSuspended };
}

export async function listEmployees(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  if (query.status === "active" || query.status === "inactive") filter.status = query.status;
  if (query.loginEnabled === "true") filter.loginEnabled = true;
  if (query.loginEnabled === "false") filter.loginEnabled = false;
  if (query.shopId && mongoose.isValidObjectId(query.shopId)) filter.shopId = query.shopId;
  if (query.search) filter.name = { $regex: String(query.search).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const [rows, total] = await Promise.all([
    Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("name shopId role status loginEnabled lastLoginAt joiningDate"),
    Employee.countDocuments(filter),
  ]);
  const employees = [];
  for (const employee of rows) {
    const shop = await Shop.findById(employee.shopId).select("name ownerId owner");
    employees.push({
      id: String(employee._id),
      name: employee.name,
      shop: shop?.name || "",
      shopId: String(employee.shopId),
      owner: shop?.owner?.fullName || "",
      role: employee.role,
      joiningDate: employee.joiningDate,
      status: employee.status,
      loginEnabled: Boolean(employee.loginEnabled),
      lastLoginAt: employee.lastLoginAt,
    });
  }
  return { employees, page, limit, total };
}

export async function getEmployee(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Employee was not found.", 404);
  const employee = await Employee.findById(id).select("-notificationSettings");
  if (!employee) throw new AppError("Employee was not found.", 404);
  const shop = await Shop.findById(employee.shopId).select("name owner");
  return {
    employee: {
      id: String(employee._id),
      name: employee.name,
      role: employee.role,
      status: employee.status,
      joiningDate: employee.joiningDate,
      loginEnabled: Boolean(employee.loginEnabled),
      phoneVerified: Boolean(employee.phoneVerified),
      lastLoginAt: employee.lastLoginAt,
      phone: maskPhone(employee.phone),
    },
    shop: shop ? { id: String(shop._id), name: shop.name, owner: shop.owner?.fullName || "" } : null,
  };
}

export async function setEmployeeLogin(admin, id, body) {
  const employee = await Employee.findById(id);
  if (!employee) throw new AppError("Employee was not found.", 404);
  const reason = reasonOf(body);
  if (typeof body.loginEnabled !== "boolean") throw new AppError("Choose whether login should be enabled.", 400);
  const before = { loginEnabled: employee.loginEnabled };
  employee.loginEnabled = body.loginEnabled;
  if (!body.loginEnabled) await revokeEmployeeAccess(employee._id);
  await employee.save();
  await writeAudit(admin, { action: "employee.login", resourceType: "employee", resourceId: employee._id, reason, beforeSummary: before, afterSummary: { loginEnabled: employee.loginEnabled } });
  return { id: String(employee._id), loginEnabled: employee.loginEnabled };
}

export async function listSubscriptions(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  if (query.planId) filter.planId = query.planId;
  if (query.status) filter.status = query.status;
  if (query.billingInterval) filter.billingInterval = query.billingInterval;
  const [rows, total] = await Promise.all([
    Subscription.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Subscription.countDocuments(filter),
  ]);
  const config = getSubscriptionConfig();
  const subscriptions = [];
  for (const item of rows) {
    const shop = await Shop.findById(item.shopId).select("name owner");
    const activeEmployees = await Employee.countDocuments({ shopId: item.shopId, status: "active" });
    subscriptions.push({
      id: String(item._id),
      shop: shop?.name || "",
      shopId: String(item.shopId),
      owner: shop?.owner?.fullName || "",
      planId: item.planId,
      billingInterval: item.billingInterval,
      status: item.status,
      isTrial: item.isTrial,
      currentPeriodEnd: item.currentPeriodEnd,
      trialEndsAt: item.trialEndsAt,
      employeeLimit: config.plans[item.planId]?.employeeLimit || null,
      activeEmployees,
      cancelAtPeriodEnd: item.cancelAtPeriodEnd,
    });
  }
  return { subscriptions, page, limit, total };
}

export async function getSubscription(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Subscription was not found.", 404);
  const item = await Subscription.findById(id);
  if (!item) throw new AppError("Subscription was not found.", 404);
  const [shop, history, payments] = await Promise.all([
    Shop.findById(item.shopId).select("name owner"),
    SubscriptionHistory.find({ subscriptionId: item._id }).sort({ createdAt: -1 }).limit(30),
    SubscriptionPayment.find({ subscriptionId: item._id }).sort({ createdAt: -1 }).limit(20).select("amount status planId paidAt createdAt refundStatus"),
  ]);
  return {
    subscription: item.toObject({ versionKey: false }),
    shop: shop ? { id: String(shop._id), name: shop.name, owner: shop.owner?.fullName || "" } : null,
    history: history.map((entry) => ({ id: String(entry._id), eventType: entry.eventType, toPlanId: entry.toPlanId, amount: entry.amount, createdAt: entry.createdAt })),
    payments: payments.map((payment) => ({ id: String(payment._id), amount: payment.amount / 100, status: payment.status, refundStatus: payment.refundStatus, paidAt: payment.paidAt })),
  };
}

export async function recoverSubscription(admin, id, body) {
  const item = await Subscription.findById(id);
  if (!item) throw new AppError("Subscription was not found.", 404);
  const reason = reasonOf(body);
  const days = Number(body.extendTrialDays);
  if (!item.isTrial || item.status !== "trialing" || !Number.isInteger(days) || days < 1 || days > 14) {
    throw new AppError("Trial recovery can extend an active trial by 1 to 14 days only.", 400);
  }
  const before = { trialEndsAt: item.trialEndsAt };
  const next = new Date(item.trialEndsAt || new Date());
  next.setUTCDate(next.getUTCDate() + days);
  item.trialEndsAt = next;
  item.expiresOn = next;
  await item.save();
  await writeAudit(admin, { action: "subscription.trial_recovery", resourceType: "subscription", resourceId: item._id, reason, beforeSummary: before, afterSummary: { trialEndsAt: item.trialEndsAt, ticketId: body.ticketId || null } });
  return { id: String(item._id), trialEndsAt: item.trialEndsAt };
}

export async function listPayments(query) {
  const { page, limit, skip } = pageParams(query);
  const { start, end } = query.range ? rangeBounds(query) : { start: new Date(0), end: new Date(Date.now() + 86400000) };
  const filter = { createdAt: { $gte: start, $lt: end } };
  if (query.status) filter.status = query.status;
  if (query.planId) filter.planId = query.planId;
  const [rows, total] = await Promise.all([
    SubscriptionPayment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-razorpaySignature -metadata"),
    SubscriptionPayment.countDocuments(filter),
  ]);
  return {
    payments: rows.map((payment) => ({
      id: String(payment._id),
      createdAt: payment.createdAt,
      shopId: String(payment.shopId),
      planId: payment.planId,
      billingInterval: payment.billingInterval,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      refundStatus: payment.refundStatus || "none",
      razorpayPaymentId: payment.razorpayPaymentId ? `${String(payment.razorpayPaymentId).slice(0, 6)}…` : "",
    })),
    page,
    limit,
    total,
  };
}

export async function getPayment(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Payment was not found.", 404);
  const payment = await SubscriptionPayment.findById(id).select("-razorpaySignature");
  if (!payment) throw new AppError("Payment was not found.", 404);
  const shop = await Shop.findById(payment.shopId).select("name owner");
  return {
    payment: {
      id: String(payment._id),
      amount: payment.amount / 100,
      listAmount: (payment.metadata?.listAmountPaise || payment.amount) / 100,
      discount: (payment.metadata?.discountPaise || 0) / 100,
      couponCode: payment.metadata?.couponCode || null,
      currency: payment.currency,
      status: payment.status,
      planId: payment.planId,
      billingInterval: payment.billingInterval,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId || "",
      paidAt: payment.paidAt,
      refundStatus: payment.refundStatus || "none",
      refundReason: payment.refundReason || "",
      providerRefundId: payment.providerRefundId || "",
      createdAt: payment.createdAt,
    },
    shop: shop ? { id: String(shop._id), name: shop.name, owner: shop.owner?.fullName || "" } : null,
  };
}

export async function refundPayment(admin, id, body) {
  const payment = await SubscriptionPayment.findById(id);
  if (!payment) throw new AppError("Payment was not found.", 404);
  const reason = reasonOf(body);
  if (payment.status !== "paid" || payment.refundStatus === "processed" || payment.refundStatus === "pending") {
    throw new AppError("This payment is not eligible for a refund.", 409, true, { code: "REFUND_NOT_ELIGIBLE" });
  }
  payment.refundReason = reason;
  payment.refundRequestedBy = admin._id;
  if (!razorpayConfigured() || !payment.razorpayPaymentId) {
    payment.refundStatus = "requested";
    await payment.save();
    await writeAudit(admin, { action: "payment.refund_requested", resourceType: "payment", resourceId: payment._id, reason, afterSummary: { refundStatus: "requested", providerConfirmed: false } });
    return { refundStatus: "requested", providerConfirmed: false, message: "The refund request was recorded. Razorpay is not configured, so the payment is still paid." };
  }
  try {
    const result = await createRazorpayRefund(payment.razorpayPaymentId, payment.amount);
    const confirmed = result?.status === "processed";
    payment.refundStatus = confirmed ? "processed" : "pending";
    payment.providerRefundId = result?.id || "";
    if (confirmed) payment.status = "refunded";
    await payment.save();
    await writeAudit(admin, { action: confirmed ? "payment.refund_processed" : "payment.refund_pending", resourceType: "payment", resourceId: payment._id, reason, afterSummary: { refundStatus: payment.refundStatus, providerRefundId: payment.providerRefundId } });
    return { refundStatus: payment.refundStatus, providerConfirmed: confirmed, providerRefundId: payment.providerRefundId };
  } catch (error) {
    payment.refundStatus = "failed";
    await payment.save();
    await writeAudit(admin, { action: "payment.refund_failed", resourceType: "payment", resourceId: payment._id, reason, afterSummary: { refundStatus: "failed" } });
    throw new AppError("The payment provider did not confirm the refund.", 502, true, { code: "REFUND_FAILED" });
  }
}

export async function registrationReport(query) {
  const { start, end } = rangeBounds(query);
  const [owners, shops, employees] = await Promise.all([
    User.countDocuments({ role: "owner", createdAt: { $gte: start, $lt: end } }),
    Shop.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    Employee.countDocuments({ createdAt: { $gte: start, $lt: end } }),
  ]);
  return { owners, shops, employees, start, end };
}

export async function paymentReport(query) {
  const { start, end } = rangeBounds(query);
  const rows = await SubscriptionPayment.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
  ]);
  const byStatus = Object.fromEntries(rows.map((row) => [row._id, { count: row.count, amount: row.amount / 100 }]));
  const collected = byStatus.paid?.amount || 0;
  return { byStatus, collected, pendingExcluded: true, salaryExcluded: true };
}

export async function supportReport(query) {
  const { start, end } = rangeBounds(query);
  const rows = await SupportTicket.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: { status: "$status", category: "$category" }, count: { $sum: 1 } } },
  ]);
  return { rows };
}

export async function couponReport() {
  const coupons = await Coupon.find().select("code status");
  const counts = await CouponRedemption.aggregate([{ $group: { _id: "$couponId", count: { $sum: 1 }, discount: { $sum: "$discountPaise" } } }]);
  return { coupons, counts };
}

function ticketView(ticket, { includeNotes }) {
  return {
    id: String(ticket._id),
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    shopId: ticket.shopId ? String(ticket.shopId) : null,
    requesterType: ticket.requesterType,
    assignedAdminId: ticket.assignedAdminId ? String(ticket.assignedAdminId) : null,
    messages: ticket.messages || [],
    internalNotes: includeNotes ? ticket.internalNotes || [] : undefined,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export async function listTickets(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  const [rows, total] = await Promise.all([
    SupportTicket.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).select("-internalNotes -messages"),
    SupportTicket.countDocuments(filter),
  ]);
  return { tickets: rows.map((ticket) => ticketView(ticket, { includeNotes: false })), page, limit, total };
}

export async function getTicket(id) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new AppError("Ticket was not found.", 404);
  return { ticket: ticketView(ticket, { includeNotes: true }) };
}

async function nextTicketNumber() {
  const setting = await PlatformSetting.findOneAndUpdate(
    { key: "platform" },
    { $inc: { ticketSequence: 1 }, $setOnInsert: { key: "platform" } },
    { upsert: true, returnDocument: "after" }
  );
  return `HB-SUP-${String(setting.ticketSequence).padStart(6, "0")}`;
}

export async function createOwnerTicket(user, body) {
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) throw new AppError("Create your shop before contacting support.", 404);
  if (!CATEGORIES.includes(body.category)) throw new AppError("Choose a support category.", 400);
  const subject = String(body.subject || "").trim();
  const description = String(body.description || "").trim();
  if (subject.length < 4 || description.length < 8) throw new AppError("Describe the issue with a subject and details.", 400);
  const ticket = await SupportTicket.create({
    ticketNumber: await nextTicketNumber(),
    requesterType: "owner",
    requesterUserId: user._id,
    shopId: shop._id,
    category: body.category,
    subject: subject.slice(0, 160),
    description: description.slice(0, 4000),
    messages: [{ authorType: "customer", authorId: user._id, body: description.slice(0, 4000) }],
  });
  return { ticket: ticketView(ticket, { includeNotes: false }) };
}

export async function replyTicket(admin, id, body) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new AppError("Ticket was not found.", 404);
  const message = String(body.body || "").trim();
  if (message.length < 2) throw new AppError("Enter a reply.", 400);
  ticket.messages.push({ authorType: "admin", authorId: admin._id, body: message.slice(0, 4000) });
  if (!ticket.firstResponseAt) ticket.firstResponseAt = new Date();
  await ticket.save();
  await writeAudit(admin, { action: "support.reply", resourceType: "ticket", resourceId: ticket._id, afterSummary: { status: ticket.status } });
  return { ticket: ticketView(ticket, { includeNotes: true }) };
}

export async function noteTicket(admin, id, body) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new AppError("Ticket was not found.", 404);
  const message = String(body.body || "").trim();
  if (message.length < 2) throw new AppError("Enter an internal note.", 400);
  ticket.internalNotes.push({ adminId: admin._id, body: message.slice(0, 4000) });
  await ticket.save();
  return { ticket: ticketView(ticket, { includeNotes: true }) };
}

export async function updateTicket(admin, id, patch) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw new AppError("Ticket was not found.", 404);
  const before = { status: ticket.status, priority: ticket.priority, assignedAdminId: ticket.assignedAdminId };
  if (patch.status) {
    if (!STATUSES.includes(patch.status)) throw new AppError("Choose a valid status.", 400);
    ticket.status = patch.status;
    if (patch.status === "resolved") ticket.resolvedAt = new Date();
    if (patch.status === "closed") ticket.closedAt = new Date();
  }
  if (patch.priority) {
    if (!PRIORITIES.includes(patch.priority)) throw new AppError("Choose a valid priority.", 400);
    ticket.priority = patch.priority;
  }
  if (patch.assignedAdminId) {
    if (!mongoose.isValidObjectId(patch.assignedAdminId)) throw new AppError("Choose an admin.", 400);
    ticket.assignedAdminId = patch.assignedAdminId;
  }
  await ticket.save();
  await writeAudit(admin, { action: "support.update", resourceType: "ticket", resourceId: ticket._id, beforeSummary: before, afterSummary: { status: ticket.status, priority: ticket.priority } });
  return { ticket: ticketView(ticket, { includeNotes: true }) };
}

export async function listCoupons() {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  const counts = await CouponRedemption.aggregate([{ $group: { _id: "$couponId", count: { $sum: 1 } } }]);
  const byId = new Map(counts.map((row) => [String(row._id), row.count]));
  return { coupons: coupons.map((coupon) => ({ ...publicCoupon(coupon), redemptions: byId.get(String(coupon._id)) || 0 })) };
}

function publicCoupon(coupon) {
  return {
    id: String(coupon._id),
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    applicablePlanIds: coupon.applicablePlanIds,
    applicableBillingIntervals: coupon.applicableBillingIntervals,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    maxTotalRedemptions: coupon.maxTotalRedemptions,
    maxRedemptionsPerUser: coupon.maxRedemptionsPerUser,
    minimumAmount: (coupon.minimumAmountPaise || 0) / 100,
    status: coupon.status,
    createdAt: coupon.createdAt,
  };
}

export async function createCoupon(admin, body) {
  const code = normalizeCouponCode(body.code);
  if (!/^[A-Z0-9]{4,20}$/.test(code)) throw new AppError("Use 4 to 20 letters or numbers for the coupon code.", 400);
  if (!["percentage", "fixed"].includes(body.discountType)) throw new AppError("Choose a discount type.", 400);
  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) throw new AppError("Enter a discount greater than zero.", 400);
  if (body.discountType === "percentage" && discountValue > 90) throw new AppError("Percentage discounts cannot exceed 90.", 400);
  const coupon = await Coupon.create({
    code,
    normalizedCode: code,
    description: String(body.description || "").slice(0, 300),
    discountType: body.discountType,
    discountValue,
    applicablePlanIds: Array.isArray(body.applicablePlanIds) ? body.applicablePlanIds.filter((id) => ["starter", "business", "pro"].includes(id)) : [],
    applicableBillingIntervals: Array.isArray(body.applicableBillingIntervals) ? body.applicableBillingIntervals.filter((id) => ["monthly", "yearly"].includes(id)) : ["monthly"],
    startsAt: new Date(body.startsAt),
    expiresAt: new Date(body.expiresAt),
    maxTotalRedemptions: body.maxTotalRedemptions ? Number(body.maxTotalRedemptions) : null,
    maxRedemptionsPerUser: body.maxRedemptionsPerUser ? Number(body.maxRedemptionsPerUser) : 1,
    minimumAmountPaise: Math.round((Number(body.minimumAmount) || 0) * 100),
    status: body.status === "inactive" ? "inactive" : "active",
    createdByAdminId: admin._id,
  });
  await writeAudit(admin, { action: "coupon.create", resourceType: "coupon", resourceId: coupon._id, afterSummary: { code: coupon.code, status: coupon.status } });
  return { coupon: publicCoupon(coupon) };
}

export async function updateCoupon(admin, id, body) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError("Coupon was not found.", 404);
  const before = { status: coupon.status };
  if (body.status === "active" || body.status === "inactive") coupon.status = body.status;
  if (body.expiresAt) coupon.expiresAt = new Date(body.expiresAt);
  await coupon.save();
  await writeAudit(admin, { action: "coupon.update", resourceType: "coupon", resourceId: coupon._id, beforeSummary: before, afterSummary: { status: coupon.status } });
  return { coupon: publicCoupon(coupon) };
}

export async function analytics(section, query) {
  const bounds = rangeBounds(query);
  if (section === "acquisition") {
    return { ...(await registrationReport(query)), definitions: DEFINITIONS };
  }
  if (section === "subscriptions") {
    const [paid, free, trials, expired] = await Promise.all([
      Subscription.countDocuments({ source: "razorpay", status: "active" }),
      Subscription.countDocuments({ planId: "free" }),
      Subscription.countDocuments({ isTrial: true, status: "trialing" }),
      Subscription.countDocuments({ status: "expired" }),
    ]);
    const trialUsed = await Subscription.countDocuments({ isTrialUsed: true });
    const converted = await Subscription.countDocuments({ isTrialUsed: true, source: "razorpay", status: { $in: ["active", "cancelled"] } });
    return { paid, free, trials, expired, trialConversionRate: trialUsed ? converted / trialUsed : null, definitions: DEFINITIONS };
  }
  if (section === "revenue") return { ...(await paymentReport(query)), definitions: DEFINITIONS };
  if (section === "engagement") {
    const [attendance, salaries, leaves] = await Promise.all([
      Attendance.countDocuments({ createdAt: { $gte: bounds.start, $lt: bounds.end } }),
      SalaryRecord.countDocuments({ createdAt: { $gte: bounds.start, $lt: bounds.end } }),
      Leave.countDocuments({ createdAt: { $gte: bounds.start, $lt: bounds.end } }),
    ]);
    return { attendanceMarks: attendance, salaryRecords: salaries, leaveRequests: leaves, definitions: DEFINITIONS };
  }
  const open = await SupportTicket.countDocuments({ status: { $in: ["open", "in_progress", "waiting_for_customer"] } });
  const byCategory = await SupportTicket.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  const byPriority = await SupportTicket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]);
  const responded = await SupportTicket.find({ firstResponseAt: { $ne: null } }).select("createdAt firstResponseAt");
  const resolved = await SupportTicket.find({ resolvedAt: { $ne: null } }).select("createdAt resolvedAt");
  const average = (rows, field) => {
    if (!rows.length) return null;
    const total = rows.reduce((sum, row) => sum + (new Date(row[field]).getTime() - new Date(row.createdAt).getTime()), 0);
    return Math.round(total / rows.length / 60000);
  };
  return { open, byCategory, byPriority, averageFirstResponseMinutes: average(responded, "firstResponseAt"), averageResolutionMinutes: average(resolved, "resolvedAt"), definitions: DEFINITIONS };
}

export async function searchAdmin(query, admin) {
  const term = String(query.q || "").trim().slice(0, 80);
  if (term.length < 2) return { results: [] };
  const results = [];
  if (admin.role !== "finance_admin") {
    const users = await User.find({ role: "owner", fullName: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }).limit(5).select("fullName");
    users.forEach((user) => results.push({ type: "user", id: String(user._id), label: user.fullName || "Owner" }));
    const shops = await Shop.find({ name: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }).limit(5).select("name");
    shops.forEach((shop) => results.push({ type: "shop", id: String(shop._id), label: shop.name }));
  }
  if (adminHasPermission(admin, "employees.read")) {
    const employees = await Employee.find({ name: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }).limit(5).select("name");
    employees.forEach((employee) => results.push({ type: "employee", id: String(employee._id), label: employee.name }));
  }
  if (adminHasPermission(admin, "payments.read") && /^[A-Za-z0-9_]{6,40}$/.test(term)) {
    const payments = await SubscriptionPayment.find({
      $or: [{ razorpayOrderId: term }, { razorpayPaymentId: term }],
    }).limit(5).select("razorpayOrderId planId amount status");
    payments.forEach((payment) => results.push({
      type: "payment",
      id: String(payment._id),
      label: `${payment.planId} · ₹${payment.amount / 100} · ${payment.status}`,
    }));
  }
  if (mongoose.isValidObjectId(term) && adminHasPermission(admin, "shops.read")) {
    const shop = await Shop.findById(term).select("name");
    if (shop) results.push({ type: "shop", id: String(shop._id), label: shop.name });
  }
  if (adminHasPermission(admin, "support.read")) {
    const tickets = await SupportTicket.find({ ticketNumber: term.toUpperCase() }).limit(3).select("ticketNumber subject");
    tickets.forEach((ticket) => results.push({ type: "ticket", id: String(ticket._id), label: `${ticket.ticketNumber} ${ticket.subject}` }));
  }
  return { results: results.slice(0, 20) };
}

export async function listAudit(query) {
  const { page, limit, skip } = pageParams(query);
  const [rows, total] = await Promise.all([
    AdminAuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AdminAuditLog.countDocuments(),
  ]);
  return { logs: rows, page, limit, total };
}

export async function getSettings() {
  const setting = await PlatformSetting.findOne({ key: "platform" });
  return {
    displayName: setting?.displayName || "HelperBook",
    supportEmail: setting?.supportEmail || "",
    supportPhone: setting?.supportPhone || "",
    supportHours: setting?.supportHours || "",
    maintenanceBanner: setting?.maintenanceBanner || "",
    couponsEnabled: setting?.couponsEnabled !== false,
  };
}

export async function updateSettings(admin, body) {
  const before = await getSettings();
  const setting = await PlatformSetting.findOneAndUpdate(
    { key: "platform" },
    {
      key: "platform",
      displayName: String(body.displayName || "HelperBook").slice(0, 80),
      supportEmail: String(body.supportEmail || "").slice(0, 254),
      supportPhone: String(body.supportPhone || "").slice(0, 20),
      supportHours: String(body.supportHours || "").slice(0, 160),
      maintenanceBanner: String(body.maintenanceBanner || "").slice(0, 300),
      couponsEnabled: body.couponsEnabled !== false,
    },
    { upsert: true, returnDocument: "after" }
  );
  await writeAudit(admin, { action: "settings.update", resourceType: "settings", resourceId: "platform", beforeSummary: before, afterSummary: { displayName: setting.displayName, couponsEnabled: setting.couponsEnabled } });
  return getSettings();
}

export async function listAdmins() {
  const admins = await AdminUser.find().select("name email role isActive lastLoginAt createdAt");
  return { admins };
}

export async function createAdmin(actor, body) {
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Enter a valid email.", 400);
  if (!["super_admin", "support_agent", "finance_admin", "read_only_admin"].includes(body.role)) {
    throw new AppError("Choose a valid admin role.", 400);
  }
  const admin = await AdminUser.create({
    email,
    name: String(body.name || "").trim().slice(0, 100) || "Admin",
    passwordHash: await hashPassword(body.password),
    role: body.role,
  });
  await writeAudit(actor, { action: "admin.create", resourceType: "admin", resourceId: admin._id, afterSummary: { email: admin.email, role: admin.role } });
  return { id: String(admin._id), email: admin.email, role: admin.role };
}

export async function setAdminActive(actor, id, isActive) {
  if (String(actor._id) === String(id)) throw new AppError("You cannot disable your own admin account.", 400);
  const admin = await AdminUser.findById(id);
  if (!admin) throw new AppError("Admin was not found.", 404);
  admin.isActive = Boolean(isActive);
  await admin.save();
  if (!admin.isActive) await (await import("../../models/AdminSession.js")).default.updateMany({ adminId: admin._id, revokedAt: null }, { revokedAt: new Date() });
  await writeAudit(actor, { action: admin.isActive ? "admin.enable" : "admin.disable", resourceType: "admin", resourceId: admin._id, afterSummary: { isActive: admin.isActive } });
  return { id: String(admin._id), isActive: admin.isActive };
}

export { DEFINITIONS };
