import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

const OFFLINE = "You're offline.\n\nConnect to the internet to manage employee advances.";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.isNetworkError) {
      apiError.message = OFFLINE;
    }
    throw apiError;
  }
}

export function createAdvance(data) {
  return request(async () => {
    const response = await apiClient.post("/advances", data);
    return response.data.data;
  });
}

export function getAdvances(params = {}) {
  return request(async () => {
    const response = await apiClient.get("/advances", { params });
    return response.data.data;
  });
}

export function getAdvance(id) {
  return request(async () => {
    const response = await apiClient.get(`/advances/${id}`);
    return response.data.data;
  });
}

export function getEmployeeAdvances(employeeId, params = {}) {
  return request(async () => {
    const response = await apiClient.get(`/advances/employee/${employeeId}`, { params });
    return response.data.data;
  });
}

export function recordRepayment(data) {
  return request(async () => {
    const response = await apiClient.post("/advances/repayment", data);
    return response.data.data;
  });
}

export function getEmployeeAdvanceTransactions(employeeId, params = {}) {
  return request(async () => {
    const response = await apiClient.get(`/advances/transactions/${employeeId}`, { params });
    return response.data.data;
  });
}

export function getAdvanceTransactions(advanceId, params = {}) {
  return request(async () => {
    const response = await apiClient.get(`/advances/${advanceId}/transactions`, { params });
    return response.data.data;
  });
}

export function reverseTransaction(transactionId) {
  return request(async () => {
    const response = await apiClient.post(`/advances/transactions/${transactionId}/reverse`);
    return response.data.data;
  });
}

export function updateAdvanceSettings(id, repaymentSettings) {
  return request(async () => {
    const response = await apiClient.patch(`/advances/${id}`, { repaymentSettings });
    return response.data.data.advance;
  });
}
