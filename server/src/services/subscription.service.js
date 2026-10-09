import crypto from "crypto";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import Subscription from "../models/Subscription.js";
import SubscriptionHistory from "../models/SubscriptionHistory.js";
import SubscriptionPayment from "../models/SubscriptionPayment.js";
import User from "../models/User.js";
import { getSubscriptionConfig, listPlans, priceFor, publicPlan, rupeesToPaise } from "../config/subscription.config.js";
import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import { dateFromKey, keyFromDate, todayKey } from "../utils/attendanceDate.js";
import { AppError } from "../utils/appError.js";
import { runInTransaction } from "../utils/mongoTransaction.js";
import { checkoutSignature, createRazorpayOrder, fetchRazorpayPayment, razorpayKeyId, safeEqual } from "./razorpay.service.js";

const PLAN_RANK = { free: 0, starter: 1, business: 2, pro: 3 };

function shopZone(shop) {
  return shop?.settings?.timezone || EMPLOYEE_TIME_ZONE;
}

function dayGap(fromKey, toKey) {
  return Math.round((dateFromKey(toKey).getTime() - dateFromKey(fromKey).getTime()) / 86400000);
}

export function addCalendarDays(key, days) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return keyFromDate(date);
}

export function addCalendarInterval(key, interval) {
  const [year, month, day] = key.split("-").map(Number);
  const months = interval === "yearly" ? 12 : 1;
  const index = month - 1 + months;
  const nextYear = year + Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  const nextDay = Math.min(day, lastDay);
  return keyFromDate(new Date(Date.UTC(nextYear, nextMonth - 1, nextDay)));
}

function fail(code, message, statusCode, extra = {}) {
  return new AppError(message, statusCode, true, { code, ...extra });
}

async function requireOwnerShop(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) {
    throw new AppError("Shop setup is required before managing a subscription.", 404);
  }
  return { user, shop };
}

async function writeHistory(entry, session) {
  const docs = await SubscriptionHistory.create([entry], session ? { session } : undefined);
  return docs[0];
}

function limitError(snapshot) {
  const limit = snapshot.plan.employeeLimit;
  const employeeWord = limit === 1 ? "employee" : "employees";
  return fail("EMPLOYEE_LIMIT_REACHED", `Your current plan allows up to ${limit} active ${employeeWord}.`, 403, {
    currentCount: snapshot.activeEmployeeCount,
    limit: snapshot.plan.employeeLimit,
    planId: snapshot.plan.id,
    planName: snapshot.plan.name,
  });
}

export async function startTrialForNewShop(userId, shop) {
  const existing = await Subscription.findOne({ shopId: shop._id });
  if (existing) return existing;
  const config = getSubscriptionConfig();
  const plan = config.plans[config.trialPlan];
  const today = todayKey(shopZone(shop));
  const ends = addCalendarDays(today, config.trialDays);
  let subscription;
  try {
    subscription = await Subscription.create({
      userId,
      shopId: shop._id,
      planId: plan.id,
      planName: plan.name,
      billingInterval: "monthly",
      status: "trialing",
      source: "trial",
      isTrial: true,
      isTrialUsed: true,
      trialStartedAt: dateFromKey(today),
      trialEndsAt: dateFromKey(ends),
      currentPeriodStart: dateFromKey(today),
      currentPeriodEnd: dateFromKey(ends),
      expiresOn: dateFromKey(ends),
    });
  } catch (error) {
    if (error?.code === 11000) return Subscription.findOne({ shopId: shop._id });
    throw error;
  }
  await writeHistory({
    userId,
    shopId: shop._id,
    subscriptionId: subscription._id,
    eventType: "trial_started",
    toPlanId: plan.id,
    toBillingInterval: "monthly",
    metadata: { trialDays: config.trialDays },
  });
  return subscription;
}

async function ensureSubscription(user, shop) {
  const existing = await Subscription.findOne({ shopId: shop._id });
  if (existing) return existing;
  const plan = getSubscriptionConfig().plans.free;
  try {
    const subscription = await Subscription.create({
      userId: user._id,
      shopId: shop._id,
      planId: "free",
      planName: plan.name,
      billingInterval: "monthly",
      status: "active",
      source: "free",
      isTrial: false,
      isTrialUsed: true,
      expiresOn: null,
    });
    await writeHistory({
      userId: user._id,
      shopId: shop._id,
      subscriptionId: subscription._id,
      eventType: "subscription_created",
      toPlanId: "free",
      metadata: { reason: "existing_shop" },
    });
    return subscription;
  } catch (error) {
    if (error?.code === 11000) return Subscription.findOne({ shopId: shop._id });
    throw error;
  }
}

function accessKind(subscription, today) {
  if (!subscription) return "free";
  const planId = subscription.planId || "free";
  if (subscription.status === "trialing" && subscription.trialEndsAt && keyFromDate(subscription.trialEndsAt) > today) {
    return "trial";
  }
  if (
    (subscription.status === "active" || subscription.status === "cancelled") &&
    subscription.source === "razorpay" &&
    planId !== "free" &&
    subscription.currentPeriodEnd &&
    keyFromDate(subscription.currentPeriodEnd) >= today
  ) {
    return "paid";
  }
  if (subscription.status === "active" && (planId === "free" || subscription.source === "free")) return "free";
  return "expired";
}

async function buildSnapshot(user, shop, subscription) {
  const config = getSubscriptionConfig();
  const today = todayKey(shopZone(shop));
  const kind = accessKind(subscription, today);
  const effectiveId = kind === "trial" || kind === "paid" ? subscription.planId : "free";
  const plan = publicPlan(config.plans[effectiveId]);
  const activeEmployeeCount = await Employee.countDocuments({ shopId: shop._id, status: "active" });
  const remainingEmployeeSlots = Math.max(0, plan.employeeLimit - activeEmployeeCount);
  const trialDaysRemaining = kind === "trial" ? Math.max(0, dayGap(today, keyFromDate(subscription.trialEndsAt))) : null;
  const periodEnd = subscription.currentPeriodEnd ? keyFromDate(subscription.currentPeriodEnd) : null;
  const daysUntilExpiry = kind === "paid" && periodEnd ? Math.max(0, dayGap(today, periodEnd)) : trialDaysRemaining;
  const scheduled = subscription.scheduledPlanId ? publicPlan(config.plans[subscription.scheduledPlanId]) : null;
  return {
    plan,
    billingInterval: kind === "free" ? null : subscription.billingInterval || "monthly",
    status: kind === "expired" ? "expired" : subscription.status,
    storedStatus: subscription.status,
    source: subscription.source || "free",
    isTrial: kind === "trial",
    isTrialUsed: Boolean(subscription.isTrialUsed),
    currentPeriodStart: subscription.currentPeriodStart ? keyFromDate(subscription.currentPeriodStart) : null,
    currentPeriodEnd: periodEnd,
    trialStartedAt: subscription.trialStartedAt ? keyFromDate(subscription.trialStartedAt) : null,
    trialEndsAt: subscription.trialEndsAt ? keyFromDate(subscription.trialEndsAt) : null,
    trialDaysRemaining,
    daysUntilExpiry,
    activeEmployeeCount,
    remainingEmployeeSlots,
    overLimit: activeEmployeeCount > plan.employeeLimit,
    cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd) && kind === "paid",
    scheduledPlan: scheduled
      ? {
          id: scheduled.id,
          name: scheduled.name,
          employeeLimit: scheduled.employeeLimit,
          billingInterval: subscription.scheduledBillingInterval,
        }
      : null,
    subscriptionId: String(subscription._id),
  };
}

async function loadSnapshot(userId) {
  const { user, shop } = await requireOwnerShop(userId);
  const subscription = await ensureSubscription(user, shop);
  const snapshot = await buildSnapshot(user, shop, subscription);
  return { user, shop, subscription, snapshot };
}

export async function getPlans() {
  return listPlans();
}

export async function getMySubscription(userId) {
  const { snapshot } = await loadSnapshot(userId);
  return snapshot;
}

export async function getDashboardSubscription(userId) {
  try {
    const snapshot = await getMySubscription(userId);
    return {
      planId: snapshot.plan.id,
      planName: snapshot.plan.name,
      employeeLimit: snapshot.plan.employeeLimit,
      activeEmployeeCount: snapshot.activeEmployeeCount,
      remainingEmployeeSlots: snapshot.remainingEmployeeSlots,
      overLimit: snapshot.overLimit,
      status: snapshot.status,
      isTrial: snapshot.isTrial,
      trialDaysRemaining: snapshot.trialDaysRemaining,
      daysUntilExpiry: snapshot.daysUntilExpiry,
      billingInterval: snapshot.billingInterval,
    };
  } catch (error) {
    console.error("Subscription summary skipped.", error?.message || "unknown");
    return null;
  }
}

export async function assertEmployeeCapacity(shop, adding = 1) {
  const user = await User.findById(shop.ownerId);
  const subscription = await ensureSubscription(user, shop);
  const snapshot = await buildSnapshot(user, shop, subscription);
  if (snapshot.activeEmployeeCount + adding > snapshot.plan.employeeLimit) {
    throw limitError(snapshot);
  }
  return snapshot;
}

function ranked(planId) {
  return PLAN_RANK[planId] ?? 0;
}

function validateTarget(planId, billingInterval) {
  const config = getSubscriptionConfig();
  const plan = config.plans[planId];
  if (!plan) throw fail("INVALID_PLAN", "Choose a valid plan.", 400);
  if (billingInterval !== "monthly" && billingInterval !== "yearly") {
    throw fail("INVALID_BILLING_INTERVAL", "Choose monthly or yearly billing.", 400);
  }
  if (planId !== "free" && billingInterval === "yearly" && plan.yearlyPrice === null) {
    throw fail("INVALID_BILLING_INTERVAL", "Yearly billing is not available yet.", 400);
  }
  return plan;
}

async function findReusablePayment(shopId, requestId) {
  if (!requestId) return null;
  return SubscriptionPayment.findOne({ shopId, requestId });
}

export async function createCheckout(userId, { planId, billingInterval, requestId }) {
  const plan = validateTarget(planId, billingInterval);
  if (planId === "free") throw fail("INVALID_PLAN", "The Free plan does not require payment.", 400);
  const rupees = priceFor(planId, billingInterval);
  if (rupees === null || rupees <= 0) {
    throw fail("INVALID_BILLING_INTERVAL", "Yearly billing is not available yet.", 400);
  }
  const { user, shop, subscription } = await loadSnapshot(userId);
  const existing = await findReusablePayment(shop._id, requestId);
  if (existing?.status === "paid") {
    throw fail("PAYMENT_ALREADY_PROCESSED", "This payment was already recorded.", 409);
  }
  if (existing && (existing.status === "created" || existing.status === "pending")) {
    return checkoutPayload(existing, plan);
  }
  const amount = rupeesToPaise(rupees);
  const pendingId = new crypto.randomBytes(8).toString("hex");
  const order = await createRazorpayOrder({
    amount,
    receipt: `hb${pendingId}`.slice(0, 40),
    notes: {
      shopId: String(shop._id),
      planId,
      billingInterval,
    },
  });
  if (!order?.id || Number(order.amount) !== amount || order.currency !== "INR") {
    throw fail("RAZORPAY_ERROR", "Razorpay could not start the payment.", 502);
  }
  const payment = await SubscriptionPayment.create({
    userId: user._id,
    shopId: shop._id,
    subscriptionId: subscription._id,
    planId,
    billingInterval,
    amount,
    currency: "INR",
    status: "created",
    requestId: requestId || null,
    razorpayOrderId: order.id,
    metadata: { expectedPlanId: planId },
  });
  return checkoutPayload(payment, plan);
}

function checkoutPayload(payment, plan) {
  return {
    orderId: payment.razorpayOrderId,
    amount: payment.amount,
    currency: "INR",
    keyId: razorpayKeyId(),
    planId: payment.planId,
    billingInterval: payment.billingInterval,
    planName: plan.name,
    employeeLimit: plan.employeeLimit,
  };
}

async function applyPaidPlan(subscription, payment, session) {
  const config = getSubscriptionConfig();
  const plan = config.plans[payment.planId];
  const shop = await Shop.findById(subscription.shopId);
  const today = todayKey(shopZone(shop));
  const currentEnd = subscription.currentPeriodEnd ? keyFromDate(subscription.currentPeriodEnd) : null;
  const fromPlanId = subscription.planId;
  const fromBillingInterval = subscription.billingInterval;
  const samePlan =
    fromPlanId === payment.planId &&
    fromBillingInterval === payment.billingInterval &&
    subscription.source === "razorpay" &&
    currentEnd &&
    currentEnd >= today;
  const startKey = samePlan ? currentEnd : today;
  const endKey = addCalendarInterval(startKey, payment.billingInterval);
  const resolvedEvent = samePlan
    ? "subscription_renewed"
    : subscription.source === "razorpay" && ranked(payment.planId) > ranked(fromPlanId)
      ? "subscription_upgraded"
      : "subscription_activated";
  subscription.planId = plan.id;
  subscription.planName = plan.name;
  subscription.billingInterval = payment.billingInterval;
  subscription.status = "active";
  subscription.source = "razorpay";
  subscription.isTrial = false;
  subscription.cancelAtPeriodEnd = false;
  subscription.scheduledPlanId = null;
  subscription.scheduledBillingInterval = null;
  subscription.currentPeriodStart = dateFromKey(samePlan ? currentEnd : today);
  subscription.currentPeriodEnd = dateFromKey(endKey);
  subscription.expiresOn = dateFromKey(endKey);
  await subscription.save(session ? { session } : undefined);
  await writeHistory(
    {
      userId: subscription.userId,
      shopId: subscription.shopId,
      subscriptionId: subscription._id,
      eventType: resolvedEvent,
      fromPlanId,
      toPlanId: plan.id,
      fromBillingInterval,
      toBillingInterval: payment.billingInterval,
      amount: payment.amount,
      currency: "INR",
      razorpayPaymentId: payment.razorpayPaymentId,
    },
    session
  );
}

export async function settlePaidPayment(payment, { razorpayPaymentId, razorpaySignature }) {
  const already = await SubscriptionHistory.findOne({
    razorpayPaymentId,
    eventType: "payment_success",
  });
  if (payment.status === "paid" && already) {
    return Subscription.findById(payment.subscriptionId);
  }
  return runInTransaction(async (session) => {
    const current = await SubscriptionPayment.findById(payment._id).session(session || null);
    if (!current) throw fail("PAYMENT_VERIFICATION_FAILED", "Payment could not be verified.", 400);
    const duplicate = await SubscriptionHistory.findOne({ razorpayPaymentId, eventType: "payment_success" }).session(session || null);
    if (current.status === "paid" && duplicate) return Subscription.findById(current.subscriptionId).session(session || null);
    if (current.razorpayPaymentId && current.razorpayPaymentId !== razorpayPaymentId) {
      throw fail("PAYMENT_ALREADY_PROCESSED", "This payment was already recorded.", 409);
    }
    current.status = "paid";
    current.razorpayPaymentId = razorpayPaymentId;
    current.razorpaySignature = razorpaySignature || current.razorpaySignature;
    current.paidAt = current.paidAt || new Date();
    current.failureReason = "";
    await current.save(session ? { session } : undefined);
    const subscription = await Subscription.findById(current.subscriptionId).session(session || null);
    await applyPaidPlan(subscription, current, session);
    await writeHistory(
      {
        userId: current.userId,
        shopId: current.shopId,
        subscriptionId: current.subscriptionId,
        eventType: "payment_success",
        toPlanId: current.planId,
        toBillingInterval: current.billingInterval,
        amount: current.amount,
        currency: "INR",
        razorpayPaymentId,
      },
      session
    );
    return subscription;
  });
}

export async function verifyPayment(userId, input) {
  const { shop } = await requireOwnerShop(userId);
  const payment = await SubscriptionPayment.findOne({ shopId: shop._id, razorpayOrderId: input.orderId });
  if (!payment) throw fail("PAYMENT_VERIFICATION_FAILED", "Payment could not be verified.", 400);
  if (!safeEqual(checkoutSignature(input.orderId, input.paymentId), input.signature)) {
    throw fail("PAYMENT_VERIFICATION_FAILED", "Payment could not be verified.", 400);
  }
  const remote = await fetchRazorpayPayment(input.paymentId);
  if (
    remote?.order_id !== payment.razorpayOrderId ||
    remote?.currency !== "INR" ||
    Number(remote?.amount) !== payment.amount ||
    !["captured", "authorized"].includes(remote?.status)
  ) {
    throw fail("PAYMENT_VERIFICATION_FAILED", "Payment could not be verified.", 400);
  }
  await settlePaidPayment(payment, { razorpayPaymentId: input.paymentId, razorpaySignature: input.signature });
  return getMySubscription(userId);
}

export async function markPaymentFailed(orderId, reason) {
  const payment = await SubscriptionPayment.findOne({ razorpayOrderId: orderId });
  if (!payment || payment.status === "paid") return payment;
  if (payment.status === "failed") return payment;
  payment.status = "failed";
  payment.failureReason = String(reason || "Payment failed.").slice(0, 300);
  await payment.save();
  await writeHistory({
    userId: payment.userId,
    shopId: payment.shopId,
    subscriptionId: payment.subscriptionId,
    eventType: "payment_failed",
    toPlanId: payment.planId,
    toBillingInterval: payment.billingInterval,
    amount: payment.amount,
    currency: "INR",
    metadata: { reason: payment.failureReason },
  });
  return payment;
}

export async function changePlan(userId, { planId, billingInterval, requestId }) {
  const plan = validateTarget(planId, billingInterval);
  const { subscription, snapshot } = await loadSnapshot(userId);
  if (snapshot.isTrial && planId === "free") {
    throw fail("SUBSCRIPTION_CHANGE_NOT_ALLOWED", "The Free plan starts automatically when your trial ends.", 400);
  }
  if (!snapshot.isTrial && snapshot.plan.id === "free" && planId === "free") {
    throw fail("SUBSCRIPTION_ALREADY_ACTIVE", "You are already on this plan.", 400);
  }
  const onPaidPlan =
    snapshot.source === "razorpay" &&
    (snapshot.storedStatus === "active" || snapshot.storedStatus === "cancelled") &&
    snapshot.plan.id !== "free";
  if (onPaidPlan && ranked(planId) < ranked(snapshot.plan.id)) {
    return scheduleDowngrade(subscription, snapshot, plan, billingInterval);
  }
  if (
    onPaidPlan &&
    snapshot.plan.id === planId &&
    snapshot.billingInterval === billingInterval &&
    snapshot.storedStatus === "active"
  ) {
    const checkout = await createCheckout(userId, { planId, billingInterval, requestId });
    return { change: "payment_required", renewal: true, checkout, subscription: snapshot };
  }
  if (planId === "free") {
    return scheduleDowngrade(subscription, snapshot, plan, billingInterval);
  }
  const checkout = await createCheckout(userId, { planId, billingInterval, requestId });
  return { change: "payment_required", checkout, subscription: snapshot };
}

async function scheduleDowngrade(subscription, snapshot, plan, billingInterval) {
  if (snapshot.isTrial || snapshot.status === "expired" || snapshot.plan.id === "free") {
    throw fail("SUBSCRIPTION_CHANGE_NOT_ALLOWED", "Choose a paid plan before scheduling a downgrade.", 400);
  }
  const activeEmployeeCount = snapshot.activeEmployeeCount;
  const blocked = activeEmployeeCount > plan.employeeLimit;
  subscription.scheduledPlanId = plan.id;
  subscription.scheduledBillingInterval = plan.id === "free" ? "monthly" : billingInterval;
  await subscription.save();
  await writeHistory({
    userId: subscription.userId,
    shopId: subscription.shopId,
    subscriptionId: subscription._id,
    eventType: "plan_changed",
    fromPlanId: snapshot.plan.id,
    toPlanId: plan.id,
    fromBillingInterval: snapshot.billingInterval,
    toBillingInterval: subscription.scheduledBillingInterval,
    metadata: { scheduled: true, blocked },
  });
  const next = await getMySubscription(String(subscription.userId));
  const deactivateCount = Math.max(0, activeEmployeeCount - plan.employeeLimit);
  return {
    change: "scheduled",
    blocked,
    deactivateCount,
    message: blocked
      ? `You currently have ${activeEmployeeCount} active employees. ${plan.name} allows only ${plan.employeeLimit}. Please deactivate at least ${deactivateCount} employees before the downgrade takes effect. Your existing employee data will not be deleted.`
      : "Downgrade will take effect at the end of your current billing period.",
    subscription: next,
  };
}

export async function cancelSubscription(userId) {
  const { subscription, snapshot } = await loadSnapshot(userId);
  if (snapshot.isTrial || snapshot.source !== "razorpay" || snapshot.status === "expired" || snapshot.plan.id === "free") {
    throw fail("SUBSCRIPTION_CHANGE_NOT_ALLOWED", "Only an active paid plan can be cancelled.", 400);
  }
  if (subscription.cancelAtPeriodEnd || subscription.status === "cancelled") {
    return getMySubscription(userId);
  }
  subscription.cancelAtPeriodEnd = true;
  subscription.status = "cancelled";
  await subscription.save();
  await writeHistory({
    userId: subscription.userId,
    shopId: subscription.shopId,
    subscriptionId: subscription._id,
    eventType: "subscription_cancelled",
    fromPlanId: subscription.planId,
    toPlanId: subscription.planId,
    metadata: { cancelAtPeriodEnd: true },
  });
  return getMySubscription(userId);
}

export async function resumeSubscription(userId) {
  const { shop, subscription, snapshot } = await loadSnapshot(userId);
  const today = todayKey(shopZone(shop));
  const end = subscription.currentPeriodEnd ? keyFromDate(subscription.currentPeriodEnd) : null;
  if (subscription.status === "expired" || !end || end < today || snapshot.plan.id === "free") {
    throw fail("SUBSCRIPTION_EXPIRED", "This subscription has expired. Choose a plan to continue.", 400);
  }
  if (subscription.status !== "cancelled" && !subscription.cancelAtPeriodEnd) {
    throw fail("SUBSCRIPTION_CHANGE_NOT_ALLOWED", "This subscription is not scheduled to cancel.", 400);
  }
  subscription.cancelAtPeriodEnd = false;
  subscription.status = "active";
  await subscription.save();
  await writeHistory({
    userId: subscription.userId,
    shopId: subscription.shopId,
    subscriptionId: subscription._id,
    eventType: "plan_changed",
    fromPlanId: subscription.planId,
    toPlanId: subscription.planId,
    metadata: { resumed: true },
  });
  return getMySubscription(userId);
}

function pageQuery(query) {
  const page = query.page;
  const limit = query.limit;
  return { page, limit, skip: (page - 1) * limit };
}

export async function listPayments(userId, query) {
  const { shop } = await requireOwnerShop(userId);
  const { page, limit, skip } = pageQuery(query);
  const filter = { shopId: shop._id };
  const [rows, total] = await Promise.all([
    SubscriptionPayment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SubscriptionPayment.countDocuments(filter),
  ]);
  const plans = getSubscriptionConfig().plans;
  return {
    payments: rows.map((row) => ({
      id: String(row._id),
      planId: row.planId,
      planName: plans[row.planId]?.name || row.planId,
      billingInterval: row.billingInterval,
      amount: row.amount / 100,
      currency: row.currency,
      status: row.status,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      reference: row.razorpayPaymentId || row.razorpayOrderId,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, pages: total === 0 ? 0 : Math.ceil(total / limit) },
  };
}

export async function listHistory(userId, query) {
  const { shop } = await requireOwnerShop(userId);
  const { page, limit, skip } = pageQuery(query);
  const filter = { shopId: shop._id };
  const [rows, total] = await Promise.all([
    SubscriptionHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SubscriptionHistory.countDocuments(filter),
  ]);
  return {
    history: rows.map((row) => ({
      id: String(row._id),
      eventType: row.eventType,
      fromPlanId: row.fromPlanId,
      toPlanId: row.toPlanId,
      fromBillingInterval: row.fromBillingInterval,
      toBillingInterval: row.toBillingInterval,
      amount: row.amount === null || row.amount === undefined ? null : row.amount / 100,
      currency: row.currency || "INR",
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, pages: total === 0 ? 0 : Math.ceil(total / limit) },
  };
}

async function activateScheduled(subscription, shop, today) {
  const config = getSubscriptionConfig();
  const plan = config.plans[subscription.scheduledPlanId];
  if (!plan) return false;
  const activeEmployeeCount = await Employee.countDocuments({ shopId: shop._id, status: "active" });
  if (activeEmployeeCount > plan.employeeLimit) return false;
  const fromPlanId = subscription.planId;
  const interval = plan.id === "free" ? "monthly" : subscription.scheduledBillingInterval || "monthly";
  subscription.planId = plan.id;
  subscription.planName = plan.name;
  subscription.billingInterval = interval;
  subscription.scheduledPlanId = null;
  subscription.scheduledBillingInterval = null;
  subscription.cancelAtPeriodEnd = false;
  subscription.isTrial = false;
  if (plan.id === "free") {
    subscription.status = "active";
    subscription.source = "free";
    subscription.currentPeriodStart = null;
    subscription.currentPeriodEnd = null;
    subscription.expiresOn = null;
  } else {
    const endKey = addCalendarInterval(today, interval);
    subscription.status = "active";
    subscription.source = "razorpay";
    subscription.currentPeriodStart = dateFromKey(today);
    subscription.currentPeriodEnd = dateFromKey(endKey);
    subscription.expiresOn = dateFromKey(endKey);
  }
  await subscription.save();
  await writeHistory({
    userId: subscription.userId,
    shopId: subscription.shopId,
    subscriptionId: subscription._id,
    eventType: "subscription_downgraded",
    fromPlanId,
    toPlanId: plan.id,
    toBillingInterval: interval,
    amount: 0,
    currency: "INR",
  });
  return true;
}

export async function processSubscriptionLifecycle() {
  const subscriptions = await Subscription.find({});
  for (const subscription of subscriptions) {
    try {
      const shop = await Shop.findOne({ _id: subscription.shopId, isActive: true });
      if (!shop) continue;
      const today = todayKey(shopZone(shop));
      if (subscription.status === "trialing" && subscription.trialEndsAt && keyFromDate(subscription.trialEndsAt) <= today) {
        subscription.status = "expired";
        subscription.isTrial = false;
        await subscription.save();
        await writeHistory({
          userId: subscription.userId,
          shopId: subscription.shopId,
          subscriptionId: subscription._id,
          eventType: "trial_expired",
          fromPlanId: subscription.planId,
          toPlanId: "free",
        });
        continue;
      }
      const periodEnd = subscription.currentPeriodEnd ? keyFromDate(subscription.currentPeriodEnd) : null;
      const periodEnded = periodEnd && periodEnd < today && subscription.source === "razorpay" && ["active", "cancelled"].includes(subscription.status);
      const waitingDowngrade = subscription.status === "expired" && subscription.scheduledPlanId;
      if (!periodEnded && !waitingDowngrade) continue;
      if (subscription.scheduledPlanId) {
        const applied = await activateScheduled(subscription, shop, today);
        if (applied) continue;
      }
      if (periodEnded && subscription.status !== "expired") {
        const fromPlanId = subscription.planId;
        subscription.status = "expired";
        subscription.cancelAtPeriodEnd = false;
        await subscription.save();
        await writeHistory({
          userId: subscription.userId,
          shopId: subscription.shopId,
          subscriptionId: subscription._id,
          eventType: "subscription_expired",
          fromPlanId,
          toPlanId: "free",
        });
      }
    } catch (error) {
      console.error("Subscription lifecycle skipped.", error?.message || "unknown");
    }
  }
}
