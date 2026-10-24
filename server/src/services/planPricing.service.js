import PlanPricing from "../models/PlanPricing.js";
import { getSubscriptionConfig, publicPlan as basePublicPlan } from "../config/subscription.config.js";
import { AppError } from "../utils/appError.js";
import { writeAudit } from "./admin/audit.service.js";

const PLAN_IDS = ["free", "starter", "business", "pro"];
const CACHE_TTL_MS = 15_000;

let cache = { at: 0, byId: null };

function clearCache() {
  cache = { at: 0, byId: null };
}

function integerOrNull(value, { allowZero = false } = {}) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number)) return null;
  if (allowZero ? number < 0 : number <= 0) return null;
  return number;
}

function pickEffective(listPrice, discountPrice) {
  if (listPrice === null || listPrice === undefined) return { list: null, effective: null, hasDiscount: false };
  if (discountPrice === null || discountPrice === undefined) {
    return { list: listPrice, effective: listPrice, hasDiscount: false };
  }
  if (discountPrice < 0 || discountPrice >= listPrice) {
    return { list: listPrice, effective: listPrice, hasDiscount: false };
  }
  return { list: listPrice, effective: discountPrice, hasDiscount: true };
}

function discountPercent(list, effective) {
  if (!list || effective === null || effective >= list) return null;
  return Math.round(((list - effective) / list) * 100);
}

function mergePlan(defaults, override) {
  const monthlyPrice = override?.monthlyPrice ?? defaults.monthlyPrice;
  const yearlyPrice = override ? override.yearlyPrice : defaults.yearlyPrice;
  const monthlyDiscountPrice = override?.monthlyDiscountPrice ?? null;
  const yearlyDiscountPrice = override?.yearlyDiscountPrice ?? null;
  const monthly = pickEffective(monthlyPrice, monthlyDiscountPrice);
  const yearly = pickEffective(yearlyPrice, yearlyDiscountPrice);
  const employeeLimit = override?.employeeLimit ?? defaults.employeeLimit;

  return {
    id: defaults.id,
    name: defaults.name,
    employeeLimit,
    monthlyPrice: monthly.effective,
    yearlyPrice: yearly.effective,
    monthlyListPrice: monthly.hasDiscount ? monthly.list : monthly.effective,
    yearlyListPrice: yearly.hasDiscount ? yearly.list : yearly.effective,
    monthlyDiscountPrice: monthly.hasDiscount ? monthly.effective : null,
    yearlyDiscountPrice: yearly.hasDiscount ? yearly.effective : null,
    hasMonthlyDiscount: monthly.hasDiscount,
    hasYearlyDiscount: yearly.hasDiscount,
    monthlyDiscountPercent: discountPercent(monthly.list, monthly.effective),
    yearlyDiscountPercent: discountPercent(yearly.list, yearly.effective),
    yearlyAvailable: defaults.id === "free" ? false : yearly.effective !== null,
    _raw: {
      monthlyList: monthly.list,
      yearlyList: yearly.list,
      monthlyDiscountStored: monthlyDiscountPrice,
      yearlyDiscountStored: yearlyDiscountPrice,
    },
  };
}

async function loadOverridesMap() {
  const now = Date.now();
  if (cache.byId && now - cache.at < CACHE_TTL_MS) return cache.byId;
  const rows = await PlanPricing.find({ planId: { $in: PLAN_IDS } });
  const byId = new Map(rows.map((row) => [row.planId, row]));
  cache = { at: now, byId };
  return byId;
}

export async function resolvePlans() {
  const defaults = getSubscriptionConfig().plans;
  const overrides = await loadOverridesMap();
  return PLAN_IDS.map((id) => mergePlan(defaults[id], overrides.get(id) || null));
}

export async function resolvePlan(planId) {
  const defaults = getSubscriptionConfig().plans[planId];
  if (!defaults) return null;
  const overrides = await loadOverridesMap();
  return mergePlan(defaults, overrides.get(planId) || null);
}

export async function listPublicPlans() {
  const plans = await resolvePlans();
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    employeeLimit: plan.employeeLimit,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.id === "free" ? 0 : plan.yearlyPrice,
    monthlyListPrice: plan.monthlyListPrice,
    yearlyListPrice: plan.id === "free" ? 0 : plan.yearlyListPrice,
    hasMonthlyDiscount: plan.hasMonthlyDiscount,
    hasYearlyDiscount: plan.hasYearlyDiscount,
    monthlyDiscountPercent: plan.monthlyDiscountPercent,
    yearlyDiscountPercent: plan.yearlyDiscountPercent,
    yearlyAvailable: plan.yearlyAvailable,
  }));
}

export async function priceForPlan(planId, billingInterval) {
  const plan = await resolvePlan(planId);
  if (!plan) return null;
  if (billingInterval === "monthly") return plan.monthlyPrice;
  if (billingInterval === "yearly") return plan.yearlyPrice;
  return null;
}

export async function listAmountForPlan(planId, billingInterval) {
  const plan = await resolvePlan(planId);
  if (!plan) return null;
  if (billingInterval === "monthly") return plan._raw.monthlyList;
  if (billingInterval === "yearly") return plan._raw.yearlyList;
  return null;
}

/** Snapshot-safe public plan (capacity / labels); prices optional. */
export function publicPlanFromResolved(plan) {
  if (!plan) return null;
  return {
    id: plan.id,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.id === "free" ? 0 : plan.yearlyPrice,
    monthlyListPrice: plan.monthlyListPrice,
    yearlyListPrice: plan.id === "free" ? 0 : plan.yearlyListPrice,
    hasMonthlyDiscount: Boolean(plan.hasMonthlyDiscount),
    hasYearlyDiscount: Boolean(plan.hasYearlyDiscount),
    monthlyDiscountPercent: plan.monthlyDiscountPercent,
    yearlyDiscountPercent: plan.yearlyDiscountPercent,
    employeeLimit: plan.employeeLimit,
    yearlyAvailable: plan.id === "free" ? false : plan.yearlyPrice !== null,
  };
}

export function fallbackPublicPlan(planId) {
  const defaults = getSubscriptionConfig().plans[planId];
  return defaults ? basePublicPlan(defaults) : null;
}

export async function listAdminPlanPricing() {
  const plans = await resolvePlans();
  return {
    plans: plans.map((plan) => ({
      planId: plan.id,
      name: plan.name,
      employeeLimit: plan.employeeLimit,
      monthlyPrice: plan._raw.monthlyList ?? 0,
      monthlyDiscountPrice: plan._raw.monthlyDiscountStored,
      yearlyPrice: plan._raw.yearlyList,
      yearlyDiscountPrice: plan._raw.yearlyDiscountStored,
      effectiveMonthlyPrice: plan.monthlyPrice,
      effectiveYearlyPrice: plan.yearlyPrice,
      hasMonthlyDiscount: plan.hasMonthlyDiscount,
      hasYearlyDiscount: plan.hasYearlyDiscount,
      yearlyAvailable: plan.yearlyAvailable,
    })),
  };
}

export async function updateAdminPlanPricing(admin, planId, body) {
  const defaults = getSubscriptionConfig().plans[planId];
  if (!defaults) throw new AppError("Choose a valid plan.", 400);
  if (planId === "free") {
    throw new AppError("The Free plan price cannot be changed.", 400);
  }

  const monthlyPrice = integerOrNull(body.monthlyPrice, { allowZero: false });
  if (monthlyPrice === null) throw new AppError("Enter a valid monthly price in whole rupees.", 400);

  let monthlyDiscountPrice = null;
  if (body.monthlyDiscountPrice !== undefined && body.monthlyDiscountPrice !== null && String(body.monthlyDiscountPrice).trim() !== "") {
    monthlyDiscountPrice = integerOrNull(body.monthlyDiscountPrice, { allowZero: true });
    if (monthlyDiscountPrice === null) throw new AppError("Enter a valid monthly discount price, or leave it blank.", 400);
    if (monthlyDiscountPrice >= monthlyPrice) {
      throw new AppError("Monthly discount price must be lower than the regular monthly price.", 400);
    }
    if (monthlyDiscountPrice < 1) {
      throw new AppError("Discounted monthly price must be at least ₹1.", 400);
    }
  }

  let yearlyPrice = null;
  if (body.yearlyPrice !== undefined && body.yearlyPrice !== null && String(body.yearlyPrice).trim() !== "") {
    yearlyPrice = integerOrNull(body.yearlyPrice, { allowZero: false });
    if (yearlyPrice === null) throw new AppError("Enter a valid yearly price in whole rupees, or leave it blank.", 400);
  }

  let yearlyDiscountPrice = null;
  if (body.yearlyDiscountPrice !== undefined && body.yearlyDiscountPrice !== null && String(body.yearlyDiscountPrice).trim() !== "") {
    if (yearlyPrice === null) throw new AppError("Set a yearly price before adding a yearly discount.", 400);
    yearlyDiscountPrice = integerOrNull(body.yearlyDiscountPrice, { allowZero: true });
    if (yearlyDiscountPrice === null) throw new AppError("Enter a valid yearly discount price, or leave it blank.", 400);
    if (yearlyDiscountPrice >= yearlyPrice) {
      throw new AppError("Yearly discount price must be lower than the regular yearly price.", 400);
    }
    if (yearlyDiscountPrice < 1) {
      throw new AppError("Discounted yearly price must be at least ₹1.", 400);
    }
  }

  let employeeLimit = defaults.employeeLimit;
  if (body.employeeLimit !== undefined && body.employeeLimit !== null && String(body.employeeLimit).trim() !== "") {
    const limit = integerOrNull(body.employeeLimit, { allowZero: false });
    if (limit === null || limit > 500) throw new AppError("Enter an employee limit between 1 and 500.", 400);
    employeeLimit = limit;
  }

  const existing = await PlanPricing.findOne({ planId });
  const before = existing
    ? {
        monthlyPrice: existing.monthlyPrice,
        monthlyDiscountPrice: existing.monthlyDiscountPrice,
        yearlyPrice: existing.yearlyPrice,
        yearlyDiscountPrice: existing.yearlyDiscountPrice,
        employeeLimit: existing.employeeLimit,
      }
    : {
        monthlyPrice: defaults.monthlyPrice,
        monthlyDiscountPrice: null,
        yearlyPrice: defaults.yearlyPrice,
        yearlyDiscountPrice: null,
        employeeLimit: defaults.employeeLimit,
      };

  const doc = await PlanPricing.findOneAndUpdate(
    { planId },
    {
      $set: {
        monthlyPrice,
        monthlyDiscountPrice,
        yearlyPrice,
        yearlyDiscountPrice,
        employeeLimit,
        updatedByAdminId: admin._id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  clearCache();
  await writeAudit(admin, {
    action: "plan_pricing.update",
    resourceType: "plan_pricing",
    resourceId: planId,
    beforeSummary: before,
    afterSummary: {
      monthlyPrice: doc.monthlyPrice,
      monthlyDiscountPrice: doc.monthlyDiscountPrice,
      yearlyPrice: doc.yearlyPrice,
      yearlyDiscountPrice: doc.yearlyDiscountPrice,
      employeeLimit: doc.employeeLimit,
    },
  });

  const listed = await listAdminPlanPricing();
  return { plan: listed.plans.find((item) => item.planId === planId) };
}

export { clearCache as clearPlanPricingCache };
