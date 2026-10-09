import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

const OFFLINE = "You're offline.\n\nConnect to the internet to manage leave.";

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

export function createLeave(data) {
  return request(async () => {
    const response = await apiClient.post("/leaves", data);
    return response.data.data;
  });
}

export function recordLeave(data) {
  return request(async () => {
    const response = await apiClient.post("/leaves/record", data);
    return response.data.data;
  });
}

export function getLeaves(params = {}) {
  return request(async () => {
    const response = await apiClient.get("/leaves", { params });
    return response.data.data;
  });
}

export function getLeave(id) {
  return request(async () => {
    const response = await apiClient.get(`/leaves/${id}`);
    return response.data.data;
  });
}

export function getLeaveHistory(params = {}) {
  return request(async () => {
    const response = await apiClient.get("/leaves/history", { params });
    return response.data.data;
  });
}

export function getEmployeeLeaves(employeeId, params = {}) {
  return request(async () => {
    const response = await apiClient.get(`/leaves/employee/${employeeId}`, { params });
    return response.data.data;
  });
}

export function approveLeave(id, body = {}) {
  return request(async () => {
    const response = await apiClient.post(`/leaves/${id}/approve`, body);
    return response.data.data;
  });
}

export function rejectLeave(id, reason) {
  return request(async () => {
    const response = await apiClient.post(`/leaves/${id}/reject`, { reason });
    return response.data.data;
  });
}

export function cancelLeave(id) {
  return request(async () => {
    const response = await apiClient.post(`/leaves/${id}/cancel`);
    return response.data.data;
  });
}

export function updateSickLeaveTreatment(sickLeaveTreatment) {
  return request(async () => {
    const response = await apiClient.patch("/shops/me/leave-settings", { sickLeaveTreatment });
    return response.data.data.shop;
  });
}
