import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

export function getAttendanceByDate(date) {
  return request(async () => {
    const response = await apiClient.get(`/attendance/date/${date}`);
    return response.data.data;
  });
}

export function markAttendance(data) {
  return request(async () => {
    const response = await apiClient.post("/attendance", data);
    return response.data.data.attendance;
  });
}

export function updateAttendance(id, data) {
  return request(async () => {
    const response = await apiClient.put(`/attendance/${id}`, data);
    return response.data.data.attendance;
  });
}

export function bulkMarkAttendance(data) {
  return request(async () => {
    const response = await apiClient.post("/attendance/bulk", data);
    return response.data.data;
  });
}

export function getMonthlyAttendance(year, month, employeeId) {
  return request(async () => {
    const response = await apiClient.get(`/attendance/month/${year}/${month}`, {
      params: employeeId ? { employeeId } : undefined,
    });
    return response.data.data;
  });
}

export function getAttendanceHistory(params = {}) {
  return request(async () => {
    const response = await apiClient.get("/attendance/history", { params });
    return response.data.data;
  });
}

export function getEmployeeAttendance(employeeId, params = {}) {
  return request(async () => {
    const response = await apiClient.get(`/attendance/employee/${employeeId}`, { params });
    return response.data.data;
  });
}
