import mongoose from "mongoose";

const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPayment", required: true },
    code: { type: String, required: true },
    listAmountPaise: { type: Number, required: true },
    discountPaise: { type: Number, required: true },
    finalAmountPaise: { type: Number, required: true },
  },
  { timestamps: true }
);

couponRedemptionSchema.index({ couponId: 1, createdAt: -1 });
couponRedemptionSchema.index({ userId: 1, couponId: 1 });
couponRedemptionSchema.index({ paymentId: 1 }, { unique: true });

const CouponRedemption = mongoose.model("CouponRedemption", couponRedemptionSchema);

export default CouponRedemption;
