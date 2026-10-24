import mongoose from "mongoose";

const planPricingSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      enum: ["free", "starter", "business", "pro"],
      required: true,
      unique: true,
    },
    monthlyPrice: { type: Number, required: true, min: 0 },
    monthlyDiscountPrice: { type: Number, default: null, min: 0 },
    yearlyPrice: { type: Number, default: null, min: 0 },
    yearlyDiscountPrice: { type: Number, default: null, min: 0 },
    employeeLimit: { type: Number, default: null, min: 1 },
    updatedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  },
  { timestamps: true }
);

const PlanPricing = mongoose.model("PlanPricing", planPricingSchema);

export default PlanPricing;
