import { sendSuccess } from "../utils/apiResponse.js";
import { processRazorpayWebhook } from "../services/subscriptionWebhook.service.js";
import {
  cancelSubscription,
  changePlan,
  createCheckout,
  getMySubscription,
  getPlans,
  listHistory,
  listPayments,
  resumeSubscription,
  verifyPayment,
} from "../services/subscription.service.js";
import { validateCheckout, validatePage, validatePlanChange, validateVerifyPayment } from "../validators/subscription.validator.js";

export async function readPlans(req, res, next) {
  try {
    sendSuccess(res, "Plans loaded.", { plans: await getPlans() });
  } catch (error) {
    next(error);
  }
}

export async function readMine(req, res, next) {
  try {
    sendSuccess(res, "Subscription loaded.", { subscription: await getMySubscription(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function checkout(req, res, next) {
  try {
    const data = await createCheckout(req.user.id, validateCheckout(req.body));
    sendSuccess(res, "Checkout ready.", data, 201);
  } catch (error) {
    next(error);
  }
}

export async function verify(req, res, next) {
  try {
    const subscription = await verifyPayment(req.user.id, validateVerifyPayment(req.body));
    sendSuccess(res, "Payment verified.", { subscription });
  } catch (error) {
    next(error);
  }
}

export async function updatePlan(req, res, next) {
  try {
    const result = await changePlan(req.user.id, validatePlanChange(req.body));
    sendSuccess(res, "Plan change prepared.", result);
  } catch (error) {
    next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    sendSuccess(res, "Subscription updated.", { subscription: await cancelSubscription(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function resume(req, res, next) {
  try {
    sendSuccess(res, "Subscription updated.", { subscription: await resumeSubscription(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function payments(req, res, next) {
  try {
    sendSuccess(res, "Payments loaded.", await listPayments(req.user.id, validatePage(req.query)));
  } catch (error) {
    next(error);
  }
}

export async function history(req, res, next) {
  try {
    sendSuccess(res, "Subscription history loaded.", await listHistory(req.user.id, validatePage(req.query)));
  } catch (error) {
    next(error);
  }
}

export async function webhook(req, res, next) {
  try {
    const result = await processRazorpayWebhook(req.body, req.get("x-razorpay-signature"), req.get("x-razorpay-event-id"));
    res.status(200).json({ success: true, duplicate: Boolean(result.duplicate) });
  } catch (error) {
    next(error);
  }
}
