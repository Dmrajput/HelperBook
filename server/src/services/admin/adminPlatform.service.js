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
import { listAdminPlanPricing, resolvePlan, updateAdminPlanPricing } from "../planPricing.service.js";
import { AppError } from "../../utils/appError.js";
import { dateFromKey, todayKey } from "../../utils/attendanceDate.js";
import { createRazorpayRefund, razorpayConfigured } from "../razorpay.service.js";
import { hashPassword } from "./adminAuth.service.js";
import { writeAudit } from "./audit.service.js";
import { normalizeCouponCode } from "./coupon.service.js";
import { revokeEmployeeAccess } from "../employeeAuth.service.js";

const DEFINITIONS = {
  monthlyCollectedRevenue:
    "Sum of verified captured subscription payments in the period, minus refunds confirmed by the payment provider in that period. Pending and failed payments are excluded. Salary payments are excluded. Snapshot vs period: this is a period metric.",
  activePaidSubscriptions:
    "Subscriptions whose stored status is active, whose source is razorpay, and whose current period end is today or later. Free plans and trials are excluded. Snapshot metric.",
  trialConversionRate:
    "Shops that have used a trial and now have a razorpay-sourced active or cancelled-but-unexpired subscription, divided by shops that have used a trial.",
  churnRate:
    "Paid subscriptions that are expired, or cancelled with a period end before today, among paid subscriptions. Access that remains until period end is not counted as churn.",
  mrr:
    "Monthly recurring revenue in INR from currently active paid (razorpay) non-free subscriptions. Yearly plans contribute yearlyPrice/12. Complimentary/free plans excluded. Snapshot metric derived from current plan pricing, not cash collected.",
  activeCompanies:
    "Shops with isActive=true and accessSuspended=false. Snapshot metric.",
  activeEmployees:
    "Employee records with status=active across all shops. Snapshot metric.",
  newCompanies:
    "Shops created within the selected date range (Asia/Kolkata day boundaries). Period metric.",
  expiringSoon:
    "Active paid or trialing subscriptions whose period/trial end falls within the next 7 calendar days. Snapshot metric.",
};

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function auditFields(meta = {}) {
  return { requestId: meta.requestId || "", ipAddress: meta.ipAddress || "" };
}

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

async function computeMrrPaise() {
  const today = dateFromKey(todayKey());
  const rows = await Subscription.find({
    source: "razorpay",
    status: "active",
    planId: { $ne: "free" },
    currentPeriodEnd: { $gte: today },
  }).select("planId billingInterval");
  let total = 0;
  for (const row of rows) {
    const plan = await resolvePlan(row.planId);
    if (!plan) continue;
    if (row.billingInterval === "yearly") {
      const yearly = Number(plan.yearlyPrice);
      if (Number.isFinite(yearly) && yearly > 0) total += Math.round((yearly * 100) / 12);
    } else {
      const monthly = Number(plan.monthlyPrice);
      if (Number.isFinite(monthly) && monthly > 0) total += Math.round(monthly * 100);
    }
  }
  return total;
}

export async function dashboardSummary(query) {
  const { start, end, startKey, endKey, preset } = rangeBounds(query);
  const today = dateFromKey(todayKey());
  const in7 = dateFromKey(shift(todayKey(), 7));
  const monthStart = dateFromKey(`${todayKey().slice(0, 8)}01`);

  const [
    owners,
    totalCompanies,
    activeCompanies,
    activeEmployees,
    paid,
    trials,
    expired,
    pastDue,
    expiringSoon,
    newCompanies,
    newCompaniesThisMonth,
    captured,
    failed,
    pending,
    openTickets,
    registrations,
    redemptions,
    mrrPaise,
    suspendedRecently,
  ] = await Promise.all([
    counts(User, { role: "owner" }),
    counts(Shop, { isActive: true }),
    counts(Shop, { isActive: true, accessSuspended: false }),
    counts(Employee, { status: "active" }),
    counts(Subscription, { source: "razorpay", status: "active", currentPeriodEnd: { $gte: today } }),
    counts(Subscription, { isTrial: true, status: "trialing" }),
    counts(Subscription, { status: "expired" }),
    counts(Subscription, { status: "past_due" }),
    counts(Subscription, {
      $or: [
        { source: "razorpay", status: "active", currentPeriodEnd: { $gte: today, $lt: in7 } },
        { isTrial: true, status: "trialing", trialEndsAt: { $gte: today, $lt: in7 } },
      ],
    }),
    counts(Shop, { isActive: true, createdAt: { $gte: start, $lt: end } }),
    counts(Shop, { isActive: true, createdAt: { $gte: monthStart } }),
    SubscriptionPayment.aggregate([
      { $match: { status: "paid", paidAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    counts(SubscriptionPayment, { status: "failed", createdAt: { $gte: start, $lt: end } }),
    counts(SubscriptionPayment, { status: { $in: ["created", "pending"] }, createdAt: { $gte: start, $lt: end } }),
    counts(SupportTicket, { status: { $in: ["open", "in_progress", "waiting_for_customer"] } }),
    counts(User, { role: "owner", createdAt: { $gte: start, $lt: end } }),
    counts(CouponRedemption, { createdAt: { $gte: start, $lt: end } }),
    computeMrrPaise(),
    counts(Shop, { accessSuspended: true, updatedAt: { $gte: start, $lt: end } }),
  ]);

  const refunds = await SubscriptionPayment.aggregate([
    { $match: { refundStatus: "processed", updatedAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const capturedPaise = captured[0]?.total || 0;
  const refundPaise = refunds[0]?.total || 0;

  return {
    range: { start: startKey, end: endKey, preset, timezone: "Asia/Kolkata" },
    snapshot: {
      totalCompanies,
      activeCompanies,
      activeEmployees,
      activePaidSubscriptions: paid,
      activeTrials: trials,
      expiredSubscriptions: expired,
      pastDueSubscriptions: pastDue,
      expiringIn7Days: expiringSoon,
      mrr: mrrPaise / 100,
      mrrPaise,
      openTickets,
    },
    period: {
      newCompanies,
      newCompaniesThisMonth,
      newRegistrations: registrations,
      capturedRevenue: (capturedPaise - refundPaise) / 100,
      successfulPayments: captured[0]?.count || 0,
      failedPayments: failed,
      pendingPayments: pending,
      couponRedemptions: redemptions,
      suspendedCompanies: suspendedRecently,
    },
    owners,
    shops: totalCompanies,
    employees: activeEmployees,
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
    mrr: mrrPaise / 100,
    mrrPaise,
    expiringIn7Days: expiringSoon,
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
      { fullName: { $regex: escapeRegex(term), $options: "i" } },
      { phoneNumber: { $regex: term.replace(/\D/g, "").slice(-10) || escapeRegex(term) } },
    ];
  }
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  const ownerIds = rows.map((row) => row._id);
  const shops = await Shop.find({ ownerId: { $in: ownerIds } }).select("name ownerId");
  const shopByOwner = new Map(shops.map((shop) => [String(shop.ownerId), shop]));
  const shopIds = shops.map((shop) => shop._id);
  const subscriptions = await Subscription.find({ shopId: { $in: shopIds } }).select("shopId planId status isTrial");
  const subByShop = new Map(subscriptions.map((item) => [String(item.shopId), item]));
  const users = rows.map((user) => {
    const shop = shopByOwner.get(String(user._id));
    const subscription = shop ? subByShop.get(String(shop._id)) : null;
    return {
      id: String(user._id),
      name: user.fullName || shop?.owner?.fullName || "Owner",
      phone: maskPhone(user.phoneNumber),
      status: user.isActive ? "active" : "suspended",
      shops: shop ? 1 : 0,
      shopId: shop ? String(shop._id) : null,
      shopName: shop?.name || null,
      planId: subscription?.planId || null,
      subscriptionStatus: subscription?.status || null,
      trial: Boolean(subscription?.isTrial),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  });
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

export async function setUserStatus(admin, id, body, meta = {}) {
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
  await writeAudit(admin, {
    action: suspend ? "user.suspend" : "user.reactivate",
    resourceType: "user",
    resourceId: user._id,
    reason,
    beforeSummary: before,
    afterSummary: { isActive: user.isActive },
    ...auditFields(meta),
  });
  return { id: String(user._id), status: user.isActive ? "active" : "suspended" };
}

export async function listShops(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = { isActive: true };
  if (query.businessType) filter.businessType = query.businessType;
  if (query.status === "suspended") filter.accessSuspended = true;
  if (query.status === "active") filter.accessSuspended = false;
  if (query.search) {
    const term = escapeRegex(String(query.search).trim().slice(0, 80));
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { "owner.fullName": { $regex: term, $options: "i" } },
      { "address.city": { $regex: term, $options: "i" } },
    ];
  }
  if (query.registeredFrom || query.registeredTo) {
    filter.createdAt = {};
    if (query.registeredFrom) filter.createdAt.$gte = dateFromKey(query.registeredFrom);
    if (query.registeredTo) filter.createdAt.$lt = new Date(dateFromKey(query.registeredTo).getTime() + 86400000);
  }

  let shopIdsForPlan = null;
  if (query.planId || query.subscriptionStatus) {
    const subFilter = {};
    if (query.planId) subFilter.planId = query.planId;
    if (query.subscriptionStatus) subFilter.status = query.subscriptionStatus;
    if (query.expiryFrom || query.expiryTo) {
      subFilter.currentPeriodEnd = {};
      if (query.expiryFrom) subFilter.currentPeriodEnd.$gte = dateFromKey(query.expiryFrom);
      if (query.expiryTo) subFilter.currentPeriodEnd.$lt = new Date(dateFromKey(query.expiryTo).getTime() + 86400000);
    }
    const matched = await Subscription.find(subFilter).select("shopId");
    shopIdsForPlan = matched.map((row) => row.shopId);
    filter._id = { $in: shopIdsForPlan };
  }

  const [rows, total] = await Promise.all([
    Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Shop.countDocuments(filter),
  ]);
  const shopIds = rows.map((shop) => shop._id);
  const ownerIds = rows.map((shop) => shop.ownerId).filter(Boolean);
  const [employeeCounts, subscriptions, owners] = await Promise.all([
    Employee.aggregate([
      { $match: { shopId: { $in: shopIds }, status: "active" } },
      { $group: { _id: "$shopId", count: { $sum: 1 } } },
    ]),
    Subscription.find({ shopId: { $in: shopIds } }).select(
      "shopId planId status isTrial billingInterval currentPeriodEnd trialEndsAt"
    ),
    User.find({ _id: { $in: ownerIds } }).select("fullName phoneNumber"),
  ]);
  const countByShop = new Map(employeeCounts.map((row) => [String(row._id), row.count]));
  const subByShop = new Map(subscriptions.map((item) => [String(item.shopId), item]));
  const ownerById = new Map(owners.map((owner) => [String(owner._id), owner]));

  const planIds = [...new Set(subscriptions.map((item) => item.planId).filter(Boolean))];
  const planEntries = await Promise.all(planIds.map(async (planId) => [planId, await resolvePlan(planId)]));
  const planById = new Map(planEntries);

  const shops = rows.map((shop) => {
    const subscription = subByShop.get(String(shop._id));
    const owner = ownerById.get(String(shop.ownerId));
    const plan = subscription ? planById.get(subscription.planId) : null;
    const activeEmployees = countByShop.get(String(shop._id)) || 0;
    const employeeLimit = plan?.employeeLimit ?? null;
    return {
      id: String(shop._id),
      name: shop.name,
      owner: owner?.fullName || shop.owner?.fullName || "",
      ownerId: shop.ownerId ? String(shop.ownerId) : null,
      ownerPhone: maskPhone(owner?.phoneNumber),
      businessType: shop.businessType,
      city: shop.address?.city || "",
      state: shop.address?.state || "",
      createdAt: shop.createdAt,
      activeEmployees,
      employeeLimit,
      nearLimit: employeeLimit != null ? activeEmployees >= Math.max(1, employeeLimit - 1) : false,
      planId: subscription?.planId || null,
      subscriptionStatus: subscription?.status || null,
      isTrial: Boolean(subscription?.isTrial),
      renewalAt: subscription?.currentPeriodEnd || subscription?.trialEndsAt || null,
      accessSuspended: Boolean(shop.accessSuspended),
      status: shop.accessSuspended ? "suspended" : "active",
    };
  });
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

export async function setShopStatus(admin, id, body, meta = {}) {
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
  await writeAudit(admin, {
    action: suspend ? "shop.suspend" : "shop.reactivate",
    resourceType: "shop",
    resourceId: shop._id,
    reason,
    beforeSummary: before,
    afterSummary: { accessSuspended: shop.accessSuspended },
    ...auditFields(meta),
  });
  return { id: String(shop._id), accessSuspended: shop.accessSuspended };
}

export async function updateShopNotes(admin, id, body, meta = {}) {
  if (!adminHasPermission(admin, "shops.update") && !adminHasPermission(admin, "*")) {
    throw new AppError("You do not have permission to perform this action.", 403, true, { code: "ADMIN_PERMISSION_DENIED" });
  }
  const shop = await Shop.findById(id);
  if (!shop) throw new AppError("Shop was not found.", 404);
  const reason = reasonOf(body);
  const before = { adminNotes: shop.adminNotes || "" };
  if (typeof body.name === "string" && body.name.trim()) shop.name = body.name.trim().slice(0, 100);
  if (typeof body.adminNotes === "string") shop.adminNotes = body.adminNotes.trim().slice(0, 2000);
  if (typeof body.businessType === "string" && body.businessType.trim()) shop.businessType = body.businessType.trim().slice(0, 80);
  await shop.save();
  await writeAudit(admin, {
    action: "shop.update",
    resourceType: "shop",
    resourceId: shop._id,
    reason,
    beforeSummary: before,
    afterSummary: { name: shop.name, adminNotes: shop.adminNotes || "" },
    ...auditFields(meta),
  });
  return { id: String(shop._id), name: shop.name, adminNotes: shop.adminNotes || "" };
}

export async function listEmployees(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  if (query.status === "active" || query.status === "inactive") filter.status = query.status;
  if (query.loginEnabled === "true") filter.loginEnabled = true;
  if (query.loginEnabled === "false") filter.loginEnabled = false;
  if (query.shopId && mongoose.isValidObjectId(query.shopId)) filter.shopId = query.shopId;
  if (query.search) filter.name = { $regex: escapeRegex(String(query.search).trim().slice(0, 80)), $options: "i" };
  if (query.joinedFrom || query.joinedTo) {
    filter.joiningDate = {};
    if (query.joinedFrom) filter.joiningDate.$gte = dateFromKey(query.joinedFrom);
    if (query.joinedTo) filter.joiningDate.$lt = new Date(dateFromKey(query.joinedTo).getTime() + 86400000);
  }
  const [rows, total] = await Promise.all([
    Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("name shopId role status loginEnabled lastLoginAt joiningDate createdAt"),
    Employee.countDocuments(filter),
  ]);
  const shopIds = [...new Set(rows.map((row) => String(row.shopId)))];
  const shops = await Shop.find({ _id: { $in: shopIds } }).select("name ownerId owner");
  const shopById = new Map(shops.map((shop) => [String(shop._id), shop]));
  const employees = rows.map((employee) => {
    const shop = shopById.get(String(employee.shopId));
    return {
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
      createdAt: employee.createdAt,
    };
  });
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

export async function setEmployeeLogin(admin, id, body, meta = {}) {
  if (!adminHasPermission(admin, "employees.update") && admin.role !== "super_admin") {
    throw new AppError("You do not have permission to perform this action.", 403, true, { code: "ADMIN_PERMISSION_DENIED" });
  }
  const employee = await Employee.findById(id);
  if (!employee) throw new AppError("Employee was not found.", 404);
  const reason = reasonOf(body);
  if (typeof body.loginEnabled !== "boolean") throw new AppError("Choose whether login should be enabled.", 400);
  const before = { loginEnabled: employee.loginEnabled };
  employee.loginEnabled = body.loginEnabled;
  if (!body.loginEnabled) await revokeEmployeeAccess(employee._id);
  await employee.save();
  await writeAudit(admin, {
    action: "employee.login",
    resourceType: "employee",
    resourceId: employee._id,
    reason,
    beforeSummary: before,
    afterSummary: { loginEnabled: employee.loginEnabled },
    ...auditFields(meta),
  });
  return { id: String(employee._id), loginEnabled: employee.loginEnabled };
}

export async function listSubscriptions(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  if (query.planId) filter.planId = query.planId;
  if (query.status) filter.status = query.status;
  if (query.billingInterval) filter.billingInterval = query.billingInterval;
  if (query.shopId && mongoose.isValidObjectId(query.shopId)) filter.shopId = query.shopId;
  const [rows, total] = await Promise.all([
    Subscription.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Subscription.countDocuments(filter),
  ]);
  const shopIds = rows.map((item) => item.shopId);
  const [shops, employeeCounts] = await Promise.all([
    Shop.find({ _id: { $in: shopIds } }).select("name owner"),
    Employee.aggregate([
      { $match: { shopId: { $in: shopIds }, status: "active" } },
      { $group: { _id: "$shopId", count: { $sum: 1 } } },
    ]),
  ]);
  const shopById = new Map(shops.map((shop) => [String(shop._id), shop]));
  const countByShop = new Map(employeeCounts.map((row) => [String(row._id), row.count]));
  const planIds = [...new Set(rows.map((item) => item.planId).filter(Boolean))];
  const planEntries = await Promise.all(planIds.map(async (planId) => [planId, await resolvePlan(planId)]));
  const planById = new Map(planEntries);
  const subscriptions = rows.map((item) => {
    const shop = shopById.get(String(item.shopId));
    const plan = planById.get(item.planId);
    const amount =
      item.billingInterval === "yearly"
        ? Number(plan?.yearlyPrice ?? 0)
        : Number(plan?.monthlyPrice ?? 0);
    return {
      id: String(item._id),
      shop: shop?.name || "",
      shopId: String(item.shopId),
      owner: shop?.owner?.fullName || "",
      planId: item.planId,
      billingInterval: item.billingInterval,
      status: item.status,
      source: item.source,
      isTrial: item.isTrial,
      currentPeriodStart: item.currentPeriodStart,
      currentPeriodEnd: item.currentPeriodEnd,
      trialEndsAt: item.trialEndsAt,
      amount,
      currency: "INR",
      employeeLimit: plan?.employeeLimit || getSubscriptionConfig().plans[item.planId]?.employeeLimit || null,
      activeEmployees: countByShop.get(String(item.shopId)) || 0,
      cancelAtPeriodEnd: item.cancelAtPeriodEnd,
    };
  });
  return { subscriptions, page, limit, total };
}

export async function listPlanPricing() {
  return listAdminPlanPricing();
}

export async function updatePlanPricing(admin, planId, body) {
  return updateAdminPlanPricing(admin, planId, body);
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

export async function recoverSubscription(admin, id, body, meta = {}) {
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
  await writeAudit(admin, {
    action: "subscription.trial_recovery",
    resourceType: "subscription",
    resourceId: item._id,
    reason,
    beforeSummary: before,
    afterSummary: { trialEndsAt: item.trialEndsAt, ticketId: body.ticketId || null },
    ...auditFields(meta),
  });
  return { id: String(item._id), trialEndsAt: item.trialEndsAt };
}

export async function cancelSubscriptionRenewal(admin, id, body, meta = {}) {
  const item = await Subscription.findById(id);
  if (!item) throw new AppError("Subscription was not found.", 404);
  const reason = reasonOf(body);
  if (!["active", "trialing"].includes(item.status)) {
    throw new AppError("Only active or trialing subscriptions can cancel renewal.", 400);
  }
  const before = { cancelAtPeriodEnd: item.cancelAtPeriodEnd, status: item.status };
  item.cancelAtPeriodEnd = true;
  await item.save();
  await SubscriptionHistory.create({
    shopId: item.shopId,
    userId: item.userId,
    subscriptionId: item._id,
    eventType: "subscription_cancelled",
    fromPlanId: item.planId,
    toPlanId: item.planId,
  });
  await writeAudit(admin, {
    action: "subscription.cancel_renewal",
    resourceType: "subscription",
    resourceId: item._id,
    reason,
    beforeSummary: before,
    afterSummary: { cancelAtPeriodEnd: true },
    ...auditFields(meta),
  });
  return { id: String(item._id), cancelAtPeriodEnd: true };
}

export async function assignSubscriptionPlan(admin, id, body, meta = {}) {
  const item = await Subscription.findById(id);
  if (!item) throw new AppError("Subscription was not found.", 404);
  const reason = reasonOf(body);
  const planId = String(body.planId || "").trim();
  const billingInterval = body.billingInterval === "yearly" ? "yearly" : "monthly";
  const config = getSubscriptionConfig();
  if (!config.plans[planId]) throw new AppError("Choose a valid plan.", 400);
  const plan = await resolvePlan(planId);
  const activeEmployees = await Employee.countDocuments({ shopId: item.shopId, status: "active" });
  if (plan?.employeeLimit != null && activeEmployees > plan.employeeLimit) {
    throw new AppError(
      `This shop has ${activeEmployees} active employees, which exceeds the ${plan.employeeLimit} limit for ${planId}. Deactivate employees before assigning this plan.`,
      409,
      true,
      { code: "EMPLOYEE_LIMIT_EXCEEDED" }
    );
  }
  const before = {
    planId: item.planId,
    status: item.status,
    billingInterval: item.billingInterval,
    source: item.source,
  };
  const complimentary = body.complimentary === true || planId === "free";
  const days = Number(body.periodDays);
  const periodDays = Number.isInteger(days) && days >= 1 && days <= 366 ? days : billingInterval === "yearly" ? 365 : 30;
  const start = new Date();
  const end = new Date(start.getTime() + periodDays * 86400000);
  item.planId = planId;
  item.billingInterval = planId === "free" ? "monthly" : billingInterval;
  item.status = "active";
  item.isTrial = false;
  item.source = complimentary ? "free" : body.source === "manual" ? "free" : item.source === "razorpay" ? "razorpay" : "free";
  if (complimentary || body.source === "manual") item.source = "free";
  item.currentPeriodStart = start;
  item.currentPeriodEnd = end;
  item.expiresOn = end;
  item.cancelAtPeriodEnd = false;
  item.scheduledPlanId = null;
  item.scheduledBillingInterval = null;
  await item.save();
  await SubscriptionHistory.create({
    shopId: item.shopId,
    userId: item.userId,
    subscriptionId: item._id,
    eventType: "plan_changed",
    fromPlanId: before.planId,
    toPlanId: planId,
  });
  await writeAudit(admin, {
    action: complimentary ? "subscription.complimentary" : "subscription.assign_plan",
    resourceType: "subscription",
    resourceId: item._id,
    reason,
    beforeSummary: before,
    afterSummary: {
      planId: item.planId,
      billingInterval: item.billingInterval,
      source: item.source,
      currentPeriodEnd: item.currentPeriodEnd,
      manual: true,
    },
    ...auditFields(meta),
  });
  return {
    id: String(item._id),
    planId: item.planId,
    billingInterval: item.billingInterval,
    status: item.status,
    source: item.source,
    currentPeriodEnd: item.currentPeriodEnd,
  };
}

export async function recordManualPayment(admin, body, meta = {}) {
  const reason = reasonOf(body);
  if (!mongoose.isValidObjectId(body.shopId)) throw new AppError("Choose a valid company.", 400);
  const shop = await Shop.findById(body.shopId);
  if (!shop) throw new AppError("Shop was not found.", 404);
  const subscription = await Subscription.findOne({ shopId: shop._id });
  if (!subscription) throw new AppError("Subscription was not found for this company.", 404);
  const amountRupees = Number(body.amount);
  if (!Number.isFinite(amountRupees) || amountRupees <= 0) throw new AppError("Enter a valid payment amount.", 400);
  const amountPaise = Math.round(amountRupees * 100);
  const planId = body.planId || subscription.planId;
  const billingInterval = body.billingInterval === "yearly" ? "yearly" : subscription.billingInterval || "monthly";
  const requestId = `manual-${admin._id}-${shop._id}-${amountPaise}-${String(body.idempotencyKey || Date.now()).slice(0, 40)}`;
  const existing = await SubscriptionPayment.findOne({ requestId });
  if (existing) {
    return {
      id: String(existing._id),
      amount: existing.amount / 100,
      status: existing.status,
      source: "manual",
      duplicate: true,
    };
  }
  const payment = await SubscriptionPayment.create({
    userId: shop.ownerId,
    shopId: shop._id,
    subscriptionId: subscription._id,
    planId,
    billingInterval,
    amount: amountPaise,
    currency: "INR",
    status: "paid",
    paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
    requestId,
    metadata: {
      source: "manual",
      recordedByAdminId: String(admin._id),
      note: String(body.note || "").slice(0, 300),
    },
  });
  await writeAudit(admin, {
    action: "payment.manual_record",
    resourceType: "payment",
    resourceId: payment._id,
    reason,
    afterSummary: {
      amountPaise,
      shopId: String(shop._id),
      planId,
      source: "manual",
      notProviderVerified: true,
    },
    ...auditFields(meta),
  });
  return {
    id: String(payment._id),
    amount: amountPaise / 100,
    status: "paid",
    source: "manual",
    duplicate: false,
  };
}

export async function listPayments(query) {
  const { page, limit, skip } = pageParams(query);
  const { start, end } = query.range || query.startDate ? rangeBounds(query) : { start: new Date(0), end: new Date(Date.now() + 86400000) };
  const filter = { createdAt: { $gte: start, $lt: end } };
  if (query.status) filter.status = query.status;
  if (query.planId) filter.planId = query.planId;
  if (query.shopId && mongoose.isValidObjectId(query.shopId)) filter.shopId = query.shopId;
  const [rows, total] = await Promise.all([
    SubscriptionPayment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-razorpaySignature"),
    SubscriptionPayment.countDocuments(filter),
  ]);
  const shopIds = [...new Set(rows.map((row) => String(row.shopId)))];
  const shops = await Shop.find({ _id: { $in: shopIds } }).select("name");
  const shopById = new Map(shops.map((shop) => [String(shop._id), shop]));
  return {
    payments: rows.map((payment) => {
      const manual = payment.metadata?.source === "manual" || String(payment.requestId || "").startsWith("manual-");
      return {
        id: String(payment._id),
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        shopId: String(payment.shopId),
        shopName: shopById.get(String(payment.shopId))?.name || "",
        subscriptionId: payment.subscriptionId ? String(payment.subscriptionId) : null,
        planId: payment.planId,
        billingInterval: payment.billingInterval,
        amount: payment.amount / 100,
        currency: payment.currency || "INR",
        status: payment.status,
        refundStatus: payment.refundStatus || "none",
        source: manual ? "manual" : "razorpay",
        provider: manual ? "manual" : "razorpay",
        razorpayPaymentId: payment.razorpayPaymentId ? `${String(payment.razorpayPaymentId).slice(0, 6)}…` : "",
      };
    }),
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

export async function refundPayment(admin, id, body, meta = {}) {
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
    await writeAudit(admin, {
      action: "payment.refund_requested",
      resourceType: "payment",
      resourceId: payment._id,
      reason,
      afterSummary: { refundStatus: "requested", providerConfirmed: false },
      ...auditFields(meta),
    });
    return { refundStatus: "requested", providerConfirmed: false, message: "The refund request was recorded. Razorpay is not configured, so the payment is still paid." };
  }
  try {
    const result = await createRazorpayRefund(payment.razorpayPaymentId, payment.amount);
    const confirmed = result?.status === "processed";
    payment.refundStatus = confirmed ? "processed" : "pending";
    payment.providerRefundId = result?.id || "";
    if (confirmed) payment.status = "refunded";
    await payment.save();
    await writeAudit(admin, {
      action: confirmed ? "payment.refund_processed" : "payment.refund_pending",
      resourceType: "payment",
      resourceId: payment._id,
      reason,
      afterSummary: { refundStatus: payment.refundStatus, providerRefundId: payment.providerRefundId },
      ...auditFields(meta),
    });
    return { refundStatus: payment.refundStatus, providerConfirmed: confirmed, providerRefundId: payment.providerRefundId };
  } catch (error) {
    payment.refundStatus = "failed";
    await payment.save();
    await writeAudit(admin, {
      action: "payment.refund_failed",
      resourceType: "payment",
      resourceId: payment._id,
      reason,
      afterSummary: { refundStatus: "failed" },
      ...auditFields(meta),
    });
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
  const filter = {};
  if (query.action) filter.action = String(query.action).trim().slice(0, 80);
  if (query.resourceType) filter.resourceType = String(query.resourceType).trim().slice(0, 40);
  if (query.resourceId) filter.resourceId = String(query.resourceId).trim().slice(0, 80);
  if (query.adminId && mongoose.isValidObjectId(query.adminId)) filter.adminId = query.adminId;
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = dateFromKey(query.startDate);
    if (query.endDate) filter.createdAt.$lt = new Date(dateFromKey(query.endDate).getTime() + 86400000);
  }
  const [rows, total] = await Promise.all([
    AdminAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AdminAuditLog.countDocuments(filter),
  ]);
  const adminIds = [...new Set(rows.map((row) => String(row.adminId)))];
  const admins = await AdminUser.find({ _id: { $in: adminIds } }).select("name email role");
  const adminById = new Map(admins.map((admin) => [String(admin._id), admin]));
  return {
    logs: rows.map((row) => {
      const actor = adminById.get(String(row.adminId));
      return {
        id: String(row._id),
        adminId: String(row.adminId),
        adminName: actor?.name || "",
        adminEmail: actor?.email || "",
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        reason: row.reason,
        beforeSummary: row.beforeSummary,
        afterSummary: row.afterSummary,
        requestId: row.requestId || "",
        ipAddress: row.ipAddress || "",
        createdAt: row.createdAt,
      };
    }),
    page,
    limit,
    total,
  };
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
  return {
    admins: admins.map((admin) => ({
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    })),
  };
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

export async function setAdminActive(actor, id, isActive, meta = {}) {
  if (String(actor._id) === String(id)) throw new AppError("You cannot disable your own admin account.", 400);
  const admin = await AdminUser.findById(id);
  if (!admin) throw new AppError("Admin was not found.", 404);
  const nextActive = Boolean(isActive);
  if (admin.role === "super_admin" && admin.isActive && !nextActive) {
    const remaining = await AdminUser.countDocuments({
      role: "super_admin",
      isActive: true,
      _id: { $ne: admin._id },
    });
    if (remaining < 1) {
      throw new AppError("You cannot disable the last active Super Admin.", 400, true, {
        code: "LAST_SUPER_ADMIN",
      });
    }
  }
  admin.isActive = nextActive;
  await admin.save();
  if (!admin.isActive) {
    await (await import("../../models/AdminSession.js")).default.updateMany(
      { adminId: admin._id, revokedAt: null },
      { revokedAt: new Date() }
    );
  }
  await writeAudit(actor, {
    action: admin.isActive ? "admin.enable" : "admin.disable",
    resourceType: "admin",
    resourceId: admin._id,
    afterSummary: { isActive: admin.isActive },
    ...auditFields(meta),
  });
  return { id: String(admin._id), isActive: admin.isActive };
}

export async function overviewAttention() {
  const today = dateFromKey(todayKey());
  const in7 = dateFromKey(shift(todayKey(), 7));
  const [expiring, failedPayments, nearLimitShops, suspended, recentAudit] = await Promise.all([
    Subscription.find({
      $or: [
        { source: "razorpay", status: "active", currentPeriodEnd: { $gte: today, $lt: in7 } },
        { isTrial: true, status: "trialing", trialEndsAt: { $gte: today, $lt: in7 } },
      ],
    })
      .sort({ currentPeriodEnd: 1 })
      .limit(10)
      .select("shopId planId status currentPeriodEnd trialEndsAt"),
    SubscriptionPayment.find({ status: "failed" }).sort({ createdAt: -1 }).limit(10).select("shopId planId amount createdAt"),
    Shop.find({ isActive: true, accessSuspended: false }).select("name activeEmployeeSlots"),
    Shop.find({ accessSuspended: true }).sort({ updatedAt: -1 }).limit(8).select("name accessSuspensionReason updatedAt"),
    AdminAuditLog.find().sort({ createdAt: -1 }).limit(8),
  ]);

  const nearShopIds = nearLimitShops.map((shop) => shop._id);
  const nearSubs = await Subscription.find({ shopId: { $in: nearShopIds } }).select("shopId planId");
  const nearSubByShop = new Map(nearSubs.map((sub) => [String(sub.shopId), sub]));
  const nearPlanIds = [...new Set(nearSubs.map((sub) => sub.planId).filter(Boolean))];
  const nearPlanEntries = await Promise.all(nearPlanIds.map(async (planId) => [planId, await resolvePlan(planId)]));
  const nearPlanById = new Map(nearPlanEntries);
  const missingSlotIds = nearLimitShops.filter((shop) => shop.activeEmployeeSlots == null).map((shop) => shop._id);
  const slotCounts =
    missingSlotIds.length > 0
      ? await Employee.aggregate([
          { $match: { shopId: { $in: missingSlotIds }, status: "active" } },
          { $group: { _id: "$shopId", count: { $sum: 1 } } },
        ])
      : [];
  const slotByShop = new Map(slotCounts.map((row) => [String(row._id), row.count]));
  const nearLimit = [];
  for (const shop of nearLimitShops) {
    const sub = nearSubByShop.get(String(shop._id));
    if (!sub) continue;
    const plan = nearPlanById.get(sub.planId);
    const limit = plan?.employeeLimit;
    const used = shop.activeEmployeeSlots ?? slotByShop.get(String(shop._id)) ?? 0;
    if (limit != null && used >= Math.max(1, limit - 1)) {
      nearLimit.push({
        id: String(shop._id),
        name: shop.name,
        activeEmployees: used,
        employeeLimit: limit,
        planId: sub.planId,
      });
    }
    if (nearLimit.length >= 10) break;
  }

  const shopIds = [
    ...expiring.map((row) => String(row.shopId)),
    ...failedPayments.map((row) => String(row.shopId)),
  ];
  const shops = await Shop.find({ _id: { $in: shopIds } }).select("name");
  const shopById = new Map(shops.map((shop) => [String(shop._id), shop.name]));
  const adminIds = [...new Set(recentAudit.map((row) => String(row.adminId)))];
  const admins = await AdminUser.find({ _id: { $in: adminIds } }).select("name");
  const adminById = new Map(admins.map((admin) => [String(admin._id), admin.name]));

  return {
    expiringSubscriptions: expiring.map((row) => ({
      id: String(row._id),
      shopId: String(row.shopId),
      shopName: shopById.get(String(row.shopId)) || "",
      planId: row.planId,
      status: row.status,
      endsAt: row.currentPeriodEnd || row.trialEndsAt,
    })),
    failedPayments: failedPayments.map((row) => ({
      id: String(row._id),
      shopId: String(row.shopId),
      shopName: shopById.get(String(row.shopId)) || "",
      planId: row.planId,
      amount: row.amount / 100,
      createdAt: row.createdAt,
    })),
    nearLimitCompanies: nearLimit,
    suspendedCompanies: suspended.map((shop) => ({
      id: String(shop._id),
      name: shop.name,
      reason: shop.accessSuspensionReason || "",
      updatedAt: shop.updatedAt,
    })),
    recentAdminActivity: recentAudit.map((row) => ({
      id: String(row._id),
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      adminName: adminById.get(String(row.adminId)) || "",
      reason: row.reason || "",
      createdAt: row.createdAt,
    })),
  };
}

export { DEFINITIONS };
