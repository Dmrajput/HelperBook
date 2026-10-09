import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, maxlength: 40 },
    normalizedCode: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    applicablePlanIds: { type: [String], default: [] },
    applicableBillingIntervals: { type: [String], default: [] },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    maxTotalRedemptions: { type: Number, default: null },
    maxRedemptionsPerUser: { type: Number, default: 1 },
    minimumAmountPaise: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: true }
);

couponSchema.index({ normalizedCode: 1 }, { unique: true });
couponSchema.index({ status: 1, startsAt: 1, expiresAt: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
