const PLAN_IDS = ["free", "starter", "business", "pro"];
const PAID_PLAN_IDS = ["starter", "business", "pro"];

const PLAN_DEFAULTS = {
  free: { name: "Free", employeeLimit: 1, monthlyPrice: 0, yearlyPrice: 0 },
  starter: { name: "Starter", employeeLimit: 2, monthlyPrice: 19, yearlyPrice: null },
  business: { name: "Business", employeeLimit: 5, monthlyPrice: 49, yearlyPrice: null },
  pro: { name: "Pro", employeeLimit: 15, monthlyPrice: 149, yearlyPrice: null },
};

function integerOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return null;
  return number;
}

function monthlyPrice(name, fallback) {
  const configured = integerOrNull(process.env[name]);
  return configured === null ? fallback : configured;
}

export function getSubscriptionConfig() {
  const trialDaysRaw = Number(process.env.TRIAL_DURATION_DAYS || 7);
  const trialDays = Number.isInteger(trialDaysRaw) && trialDaysRaw > 0 && trialDaysRaw <= 30 ? trialDaysRaw : 7;
  const requestedTrial = String(process.env.TRIAL_PLAN || "pro").trim().toLowerCase();
  const trialPlan = PAID_PLAN_IDS.includes(requestedTrial) ? requestedTrial : "pro";

  return {
    trialDays,
    trialPlan,
    plans: {
      free: { id: "free", ...PLAN_DEFAULTS.free },
      starter: {
        id: "starter",
        ...PLAN_DEFAULTS.starter,
        monthlyPrice: monthlyPrice("STARTER_MONTHLY_PRICE", PLAN_DEFAULTS.starter.monthlyPrice),
        yearlyPrice: integerOrNull(process.env.STARTER_YEARLY_PRICE),
      },
      business: {
        id: "business",
        ...PLAN_DEFAULTS.business,
        monthlyPrice: monthlyPrice("BUSINESS_MONTHLY_PRICE", PLAN_DEFAULTS.business.monthlyPrice),
        yearlyPrice: integerOrNull(process.env.BUSINESS_YEARLY_PRICE),
      },
      pro: {
        id: "pro",
        ...PLAN_DEFAULTS.pro,
        monthlyPrice: monthlyPrice("PRO_MONTHLY_PRICE", PLAN_DEFAULTS.pro.monthlyPrice),
        yearlyPrice: integerOrNull(process.env.PRO_YEARLY_PRICE),
      },
    },
  };
}

export function listPlans() {
  const { plans } = getSubscriptionConfig();
  return PLAN_IDS.map((id) => publicPlan(plans[id]));
}

export function publicPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.id === "free" ? 0 : plan.yearlyPrice,
    employeeLimit: plan.employeeLimit,
    yearlyAvailable: plan.id === "free" ? false : plan.yearlyPrice !== null,
  };
}

export function priceFor(planId, billingInterval) {
  const plan = getSubscriptionConfig().plans[planId];
  if (!plan) return null;
  if (billingInterval === "monthly") return plan.monthlyPrice;
  if (billingInterval === "yearly") return plan.yearlyPrice;
  return null;
}

export function rupeesToPaise(rupees) {
  return rupees * 100;
}
