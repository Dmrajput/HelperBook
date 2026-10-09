import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

export function calculateSalary(data) {
  return request(async () => {
    const response = await apiClient.post("/salaries/calculate", data);
    return response.data.data.salary;
  });
}

export function calculateAllSalaries(data) {
  return request(async () => {
    const response = await apiClient.post("/salaries/calculate-all", data);
    return response.data.data;
  });
}

export function getMonthlySalaries(year, month, params = {}) {
  return request(async () => {
    const response = await apiClient.get(`/salaries/month/${year}/${month}`, { params });
    return response.data.data;
  });
}

export function getSalaryById(id) {
  return request(async () => {
    const response = await apiClient.get(`/salaries/${id}`);
    return response.data.data.salary;
  });
}

export function updateSalary(id, data) {
  return request(async () => {
    const response = await apiClient.patch(`/salaries/${id}`, data);
    return response.data.data.salary;
  });
}

export function recalculateSalary(id) {
  return request(async () => {
    const response = await apiClient.post(`/salaries/${id}/recalculate`);
    return response.data.data.salary;
  });
}

export function finalizeSalary(id) {
  return request(async () => {
    const response = await apiClient.post(`/salaries/${id}/finalize`);
    return response.data.data.salary;
  });
}

export function reopenSalary(id) {
  return request(async () => {
    const response = await apiClient.post(`/salaries/${id}/reopen`);
    return response.data.data.salary;
  });
}

export function paySalary(id, data) {
  return request(async () => {
    const response = await apiClient.post(`/salaries/${id}/pay`, data);
    return response.data.data;
  });
}

export function getSalaryPayments(params = {}) {
  return request(async () => {
    const response = await apiClient.get("/salaries/payments", { params });
    return response.data.data;
  });
}

export function getSalaryPaymentById(id) {
  return request(async () => {
    const response = await apiClient.get(`/salaries/payments/${id}`);
    return response.data.data;
  });
}

export function reverseSalaryPayment(id, data) {
  return request(async () => {
    const response = await apiClient.post(`/salaries/payments/${id}/reverse`, data);
    return response.data.data;
  });
}

export function getEmployeeSalaryHistory(employeeId, params = {}) {
  return request(async () => {
    const response = await apiClient.get(`/salaries/employee/${employeeId}`, { params });
    return response.data.data;
  });
}
