import mongoose from "mongoose";

const PLAN_IDS = ["free", "starter", "business", "pro"];
const INTERVALS = ["monthly", "yearly"];
const STATUSES = ["trialing", "active", "past_due", "cancelled", "expired"];
const SOURCES = ["free", "razorpay", "trial"];

const subscriptionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: String, enum: PLAN_IDS, default: "free" },
    planName: { type: String, default: "Free", trim: true, maxlength: 80 },
    billingInterval: { type: String, enum: INTERVALS, default: "monthly" },
    status: { type: String, enum: STATUSES, default: "active" },
    source: { type: String, enum: SOURCES, default: "free" },
    isTrial: { type: Boolean, default: false },
    isTrialUsed: { type: Boolean, default: false },
    trialStartedAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    scheduledPlanId: { type: String, default: null },
    scheduledBillingInterval: { type: String, default: null },
    razorpayCustomerId: { type: String, default: null, trim: true },
    razorpaySubscriptionId: { type: String, default: null, trim: true },
    expiresOn: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ shopId: 1, status: 1 });
subscriptionSchema.index({ razorpaySubscriptionId: 1 }, { sparse: true });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ expiresOn: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
