import mongoose from "mongoose";

const EVENT_TYPES = [
  "trial_started",
  "trial_expired",
  "subscription_created",
  "subscription_activated",
  "subscription_renewed",
  "subscription_upgraded",
  "subscription_downgraded",
  "subscription_cancelled",
  "subscription_expired",
  "payment_success",
  "payment_failed",
  "plan_changed",
];

const historySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    fromPlanId: { type: String, default: null },
    toPlanId: { type: String, default: null },
    fromBillingInterval: { type: String, default: null },
    toBillingInterval: { type: String, default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: "INR" },
    razorpaySubscriptionId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

historySchema.index({ shopId: 1, createdAt: -1 });
historySchema.index({ subscriptionId: 1, createdAt: -1 });
historySchema.index({ razorpayPaymentId: 1, eventType: 1 });

const SubscriptionHistory = mongoose.model("SubscriptionHistory", historySchema);

export default SubscriptionHistory;
