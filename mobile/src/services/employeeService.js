import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

export function getEmployees({ status = "active", search = "", role = "", page = 1, limit = 20 } = {}) {
  const params = { status, page, limit };
  if (search) {
    params.search = search;
  }
  if (role) {
    params.role = role;
  }

  return request(async () => {
    const response = await apiClient.get("/employees", { params });
    return response.data.data;
  });
}

export function getEmployeeById(employeeId) {
  return request(async () => {
    const response = await apiClient.get(`/employees/${employeeId}`);
    return response.data.data.employee;
  });
}

export function createEmployee(payload) {
  return request(async () => {
    const response = await apiClient.post("/employees", payload);
    return response.data.data.employee;
  });
}

export function updateEmployee(employeeId, payload) {
  return request(async () => {
    const response = await apiClient.put(`/employees/${employeeId}`, payload);
    return response.data.data.employee;
  });
}

export function setEmployeeLogin(employeeId, loginEnabled) {
  return request(async () => {
    const response = await apiClient.patch(`/employees/${employeeId}/login-status`, { loginEnabled });
    return response.data.data;
  });
}

export function updateEmployeeStatus(employeeId, status) {
  return request(async () => {
    const response = await apiClient.patch(`/employees/${employeeId}/status`, { status });
    return response.data.data.employee;
  });
}

export function deleteEmployee(employeeId) {
  return request(async () => {
    await apiClient.delete(`/employees/${employeeId}`);
  });
}
