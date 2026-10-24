import { colors } from "../../theme";

export const PLAN_DISPLAY_ORDER = ["free", "starter", "pro", "business"];

export const PLAN_META = {
  free: {
    icon: "paper-plane-outline",
    accent: "#3B82F6",
    accentSoft: "#DBEAFE",
  },
  starter: {
    icon: "diamond-outline",
    accent: colors.primary,
    accentSoft: colors.primaryLight,
  },
  pro: {
    icon: "flash-outline",
    accent: "#F59E0B",
    accentSoft: "#FEF3C7",
  },
  business: {
    icon: "business-outline",
    accent: "#10B981",
    accentSoft: "#ECFDF5",
  },
};

export const PLAN_FEATURES = [
  "Employee management",
  "Attendance",
  "Salary",
  "Leave",
  "Reports",
];

export const FEATURE_HIGHLIGHTS = [
  { icon: "people-outline", label: "Employee\nManagement" },
  { icon: "calendar-outline", label: "Attendance\nTracking" },
  { icon: "wallet-outline", label: "Salary\nManagement" },
  { icon: "document-text-outline", label: "Leave\nManagement" },
  { icon: "bar-chart-outline", label: "Reports &\nAnalytics" },
];

export function formatInr(amount) {
  if (amount === null || amount === undefined) return null;
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function effectivePrice(plan, interval) {
  if (!plan || plan.id === "free") return 0;
  return interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function listPrice(plan, interval) {
  if (!plan || plan.id === "free") return 0;
  return interval === "yearly" ? plan.yearlyListPrice : plan.monthlyListPrice;
}

export function hasDiscount(plan, interval) {
  if (!plan || plan.id === "free") return false;
  return interval === "yearly" ? Boolean(plan.hasYearlyDiscount) : Boolean(plan.hasMonthlyDiscount);
}

export function discountPercent(plan, interval) {
  if (!hasDiscount(plan, interval)) return null;
  return interval === "yearly" ? plan.yearlyDiscountPercent : plan.monthlyDiscountPercent;
}

/** Savings when paying yearly vs 12× monthly (effective selling prices). */
export function yearlyVsMonthlySavePercent(plan) {
  if (!plan || plan.id === "free") return null;
  const monthly = plan.monthlyPrice;
  const yearly = plan.yearlyPrice;
  if (monthly == null || yearly == null || monthly <= 0 || yearly <= 0) return null;
  const full = monthly * 12;
  if (full <= yearly) return null;
  return Math.round(((full - yearly) / full) * 100);
}

export function yearlyMonthlyEquivalent(plan) {
  if (!plan?.yearlyPrice || plan.yearlyPrice <= 0) return null;
  return Math.round(plan.yearlyPrice / 12);
}

export function maxYearlySavePercent(plans = []) {
  return plans.reduce((max, plan) => {
    const value = yearlyVsMonthlySavePercent(plan);
    return value != null && value > max ? value : max;
  }, 0);
}

export function sortPlans(plans = []) {
  return [...plans].sort((a, b) => {
    const ai = PLAN_DISPLAY_ORDER.indexOf(a.id);
    const bi = PLAN_DISPLAY_ORDER.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}
