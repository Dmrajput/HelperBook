import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

export function getPlans() {
  return request(async () => {
    const response = await apiClient.get("/subscriptions/plans");
    return response.data.data.plans;
  });
}

export function getMySubscription() {
  return request(async () => {
    const response = await apiClient.get("/subscriptions/me");
    return response.data.data.subscription;
  });
}

export function createCheckout(payload) {
  return request(async () => {
    const response = await apiClient.post("/subscriptions/checkout", payload);
    return response.data.data;
  });
}

export function verifyPayment(payload) {
  return request(async () => {
    const response = await apiClient.post("/subscriptions/verify-payment", payload);
    return response.data.data.subscription;
  });
}

export function changePlan(payload) {
  return request(async () => {
    const response = await apiClient.post("/subscriptions/change-plan", payload);
    return response.data.data;
  });
}

export function cancelSubscription() {
  return request(async () => {
    const response = await apiClient.post("/subscriptions/cancel");
    return response.data.data.subscription;
  });
}

export function resumeSubscription() {
  return request(async () => {
    const response = await apiClient.post("/subscriptions/resume");
    return response.data.data.subscription;
  });
}

export function getPaymentHistory(params) {
  return request(async () => {
    const response = await apiClient.get("/subscriptions/payments", { params });
    return response.data.data;
  });
}

export function getSubscriptionHistory(params) {
  return request(async () => {
    const response = await apiClient.get("/subscriptions/history", { params });
    return response.data.data;
  });
}
