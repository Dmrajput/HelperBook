import crypto from "crypto";
import { AppError } from "../utils/appError.js";

const API_BASE = "https://api.razorpay.com/v1";

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || "";
}

function requireConfig() {
  if (!razorpayConfigured()) {
    throw new AppError("Subscription payments are not configured yet.", 503, true, { code: "RAZORPAY_ERROR" });
  }
}

function authHeader() {
  const token = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  return `Basic ${token}`;
}

async function razorpayRequest(path, { method = "GET", body } = {}) {
  requireConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new AppError("Razorpay could not start the payment.", 502, true, { code: "RAZORPAY_ERROR" });
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Razorpay could not start the payment.", 502, true, { code: "RAZORPAY_ERROR" });
  } finally {
    clearTimeout(timer);
  }
}

export async function createRazorpayOrder({ amount, receipt, notes }) {
  return razorpayRequest("/orders", {
    method: "POST",
    body: { amount, currency: "INR", receipt, notes },
  });
}

export async function createRazorpayRefund(paymentId, amount) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    body: amount ? { amount } : {},
  });
}

export async function fetchRazorpayPayment(paymentId) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
}

export function checkoutSignature(orderId, paymentId) {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export function webhookSignature(rawBody) {
  return crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "").update(rawBody).digest("hex");
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
