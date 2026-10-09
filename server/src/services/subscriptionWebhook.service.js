import crypto from "crypto";
import WebhookEvent from "../models/WebhookEvent.js";
import { safeEqual, webhookSignature } from "./razorpay.service.js";
import { markPaymentFailed, settlePaidPayment } from "./subscription.service.js";
import SubscriptionPayment from "../models/SubscriptionPayment.js";
import { AppError } from "../utils/appError.js";

function fail(message) {
  return new AppError(message, 400, true, { code: "INVALID_WEBHOOK_SIGNATURE" });
}

export async function processRazorpayWebhook(rawBody, signature, eventHeader) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new AppError("Webhook is not configured.", 503, true, { code: "RAZORPAY_ERROR" });
  }
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ""));
  if (!safeEqual(webhookSignature(body), signature)) {
    throw fail("Webhook signature is invalid.");
  }
  let event;
  try {
    event = JSON.parse(body.toString("utf8"));
  } catch {
    throw new AppError("Webhook payload is invalid.", 400, true, { code: "INVALID_WEBHOOK_SIGNATURE" });
  }
  if (!event || typeof event.event !== "string") {
    throw new AppError("Webhook payload is invalid.", 400, true, { code: "INVALID_WEBHOOK_SIGNATURE" });
  }
  const eventId = String(eventHeader || crypto.createHash("sha256").update(body).digest("hex"));
  const eventType = event.event;
  let claimed;
  try {
    claimed = await WebhookEvent.create({
      provider: "razorpay",
      eventId,
      eventType,
      payloadHash: crypto.createHash("sha256").update(body).digest("hex"),
      status: "processing",
    });
  } catch (error) {
    if (error?.code === 11000) return { duplicate: true };
    throw error;
  }
  try {
    if (eventType === "payment.captured") {
      await capturePayment(event);
    } else if (eventType === "payment.failed") {
      const entity = event?.payload?.payment?.entity || {};
      if (entity.order_id) await markPaymentFailed(entity.order_id, entity.error_description || "Payment failed.");
    }
    claimed.status = eventType === "payment.captured" || eventType === "payment.failed" ? "processed" : "ignored";
    claimed.processedAt = new Date();
    await claimed.save();
  } catch (error) {
    await WebhookEvent.deleteOne({ _id: claimed._id, status: "processing" });
    throw error;
  }
  return { duplicate: false };
}

async function capturePayment(event) {
  const entity = event?.payload?.payment?.entity;
  if (!entity?.order_id || !entity?.id) return;
  const payment = await SubscriptionPayment.findOne({ razorpayOrderId: entity.order_id });
  if (!payment) return;
  if (Number(entity.amount) !== payment.amount || entity.currency !== "INR") {
    await markPaymentFailed(entity.order_id, "Payment amount did not match the order.");
    return;
  }
  if (entity.status !== "captured") return;
  await settlePaidPayment(payment, { razorpayPaymentId: entity.id, razorpaySignature: "" });
}
