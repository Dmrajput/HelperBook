import Coupon from "../../models/Coupon.js";
import CouponRedemption from "../../models/CouponRedemption.js";
import PlatformSetting from "../../models/PlatformSetting.js";
import { AppError } from "../../utils/appError.js";

export function normalizeCouponCode(code) {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function quoteCoupon({ code, planId, billingInterval, userId, listPaise }) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  const settings = await PlatformSetting.findOne({ key: "platform" });
  if (settings && settings.couponsEnabled === false) {
    throw new AppError("Coupons are not available right now.", 400, true, { code: "COUPON_DISABLED" });
  }
  const coupon = await Coupon.findOne({ normalizedCode: normalized });
  if (!coupon || coupon.status !== "active") {
    throw new AppError("This coupon cannot be used.", 400, true, { code: "COUPON_INVALID" });
  }
  const now = Date.now();
  if (coupon.startsAt.getTime() > now) {
    throw new AppError("This coupon is not active yet.", 400, true, { code: "COUPON_NOT_STARTED" });
  }
  if (coupon.expiresAt.getTime() <= now) {
    throw new AppError("This coupon has expired.", 400, true, { code: "COUPON_EXPIRED" });
  }
  if (coupon.applicablePlanIds?.length && !coupon.applicablePlanIds.includes(planId)) {
    throw new AppError("This coupon does not apply to the selected plan.", 400, true, { code: "COUPON_PLAN" });
  }
  if (coupon.applicableBillingIntervals?.length && !coupon.applicableBillingIntervals.includes(billingInterval)) {
    throw new AppError("This coupon does not apply to the selected billing interval.", 400, true, { code: "COUPON_INTERVAL" });
  }
  if (listPaise < (coupon.minimumAmountPaise || 0)) {
    throw new AppError("This coupon does not meet the minimum amount.", 400, true, { code: "COUPON_MINIMUM" });
  }
  const used = await CouponRedemption.countDocuments({ couponId: coupon._id });
  if (coupon.maxTotalRedemptions && used >= coupon.maxTotalRedemptions) {
    throw new AppError("This coupon has reached its redemption limit.", 400, true, { code: "COUPON_LIMIT" });
  }
  const perUser = await CouponRedemption.countDocuments({ couponId: coupon._id, userId });
  if (coupon.maxRedemptionsPerUser && perUser >= coupon.maxRedemptionsPerUser) {
    throw new AppError("This coupon has already been used on this account.", 400, true, { code: "COUPON_USER_LIMIT" });
  }
  let discountPaise = 0;
  if (coupon.discountType === "percentage") {
    discountPaise = Math.floor((listPaise * coupon.discountValue) / 100);
  } else {
    discountPaise = Math.round(coupon.discountValue * 100);
  }
  discountPaise = Math.min(Math.max(discountPaise, 0), listPaise);
  const finalPaise = listPaise - discountPaise;
  if (finalPaise < 100) {
    throw new AppError("This coupon would reduce the payable amount below the minimum charge.", 400, true, { code: "COUPON_AMOUNT" });
  }
  return { coupon, discountPaise, finalPaise, listPaise };
}

export async function commitCouponRedemption(payment) {
  const couponId = payment.metadata?.couponId;
  if (!couponId) return null;
  const existing = await CouponRedemption.findOne({ paymentId: payment._id });
  if (existing) return existing;
  try {
    return await CouponRedemption.create({
      couponId,
      userId: payment.userId,
      shopId: payment.shopId,
      paymentId: payment._id,
      code: payment.metadata.couponCode || "",
      listAmountPaise: payment.metadata.listAmountPaise,
      discountPaise: payment.metadata.discountPaise,
      finalAmountPaise: payment.amount,
    });
  } catch (error) {
    if (error?.code === 11000) return CouponRedemption.findOne({ paymentId: payment._id });
    throw error;
  }
}
