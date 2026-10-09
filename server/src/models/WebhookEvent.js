import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, default: "razorpay" },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    payloadHash: { type: String, default: "" },
    status: { type: String, enum: ["processed", "ignored"], default: "processed" },
    processedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);

export default WebhookEvent;
