import { AppError } from "../utils/appError.js";

const PLAN_IDS = ["free", "starter", "business", "pro"];
const INTERVALS = ["monthly", "yearly"];

function objectBody(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("The submitted information is invalid.", 400);
  }
  return value;
}

function planSelection(body) {
  const source = objectBody(body);
  if (!PLAN_IDS.includes(source.planId)) throw new AppError("Choose a valid plan.", 400);
  if (!INTERVALS.includes(source.billingInterval)) throw new AppError("Choose monthly or yearly billing.", 400);
  let requestId = null;
  if (source.requestId !== undefined && source.requestId !== null && source.requestId !== "") {
    if (typeof source.requestId !== "string" || source.requestId.trim().length < 8 || source.requestId.trim().length > 80) {
      throw new AppError("The request id is invalid.", 400);
    }
    requestId = source.requestId.trim();
  }
  return { planId: source.planId, billingInterval: source.billingInterval, requestId };
}

export function validatePlanChange(body) {
  return planSelection(body);
}

export function validateCheckout(body) {
  const selected = planSelection(body);
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim().slice(0, 40) : "";
  return { ...selected, couponCode: couponCode || null };
}

export function validateVerifyPayment(body) {
  const source = objectBody(body);
  const orderId = source.razorpayOrderId || source.razorpay_order_id;
  const paymentId = source.razorpayPaymentId || source.razorpay_payment_id;
  const signature = source.razorpaySignature || source.razorpay_signature;
  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
    throw new AppError("Payment could not be verified.", 400);
  }
  if (!orderId.trim() || !paymentId.trim() || !signature.trim()) {
    throw new AppError("Payment could not be verified.", 400);
  }
  return { orderId: orderId.trim(), paymentId: paymentId.trim(), signature: signature.trim() };
}

export function validatePage(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw new AppError("Page must be 1 or greater.", 400);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError("Limit must be between 1 and 100.", 400);
  return { page, limit };
}
