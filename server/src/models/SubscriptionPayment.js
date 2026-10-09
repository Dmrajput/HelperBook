import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
    planId: { type: String, required: true, enum: ["starter", "business", "pro"] },
    billingInterval: { type: String, required: true, enum: ["monthly", "yearly"] },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ["INR"], default: "INR", required: true },
    status: { type: String, enum: ["created", "pending", "paid", "failed", "refunded"], default: "created" },
    requestId: { type: String, default: null, trim: true, maxlength: 80 },
    razorpayOrderId: { type: String, required: true, trim: true },
    razorpayPaymentId: { type: String, default: null, trim: true },
    razorpaySignature: { type: String, default: null },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: "", maxlength: 300 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ shopId: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index(
  { shopId: 1, requestId: 1 },
  { unique: true, partialFilterExpression: { requestId: { $type: "string" } } }
);

const SubscriptionPayment = mongoose.model("SubscriptionPayment", paymentSchema);

export default SubscriptionPayment;
