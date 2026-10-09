import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

export function getEmployeeHome() {
  return request(async () => (await apiClient.get("/employee-portal/home")).data.data);
}

export function getEmployeeAttendance(month) {
  return request(async () => (await apiClient.get("/employee-portal/attendance", { params: { month } })).data.data);
}

export function getEmployeeSalaries(page = 1) {
  return request(async () => (await apiClient.get("/employee-portal/salary", { params: { page, limit: 20 } })).data.data);
}

export function getEmployeeSalary(salaryId) {
  return request(async () => (await apiClient.get(`/employee-portal/salary/${salaryId}`)).data.data);
}

export function getEmployeeAdvances() {
  return request(async () => (await apiClient.get("/employee-portal/advances")).data.data);
}

export function getEmployeeAdvanceTransactions(page = 1) {
  return request(async () => (await apiClient.get("/employee-portal/advance-transactions", { params: { page, limit: 20 } })).data.data);
}

export function getEmployeeLeaves(status, page = 1) {
  return request(async () => (await apiClient.get("/employee-portal/leaves", { params: { status, page, limit: 20 } })).data.data);
}

export function getEmployeeLeave(leaveId) {
  return request(async () => (await apiClient.get(`/employee-portal/leaves/${leaveId}`)).data.data);
}

export function createEmployeeLeave(payload) {
  return request(async () => (await apiClient.post("/employee-portal/leaves", payload)).data.data);
}

export function cancelEmployeeLeave(leaveId) {
  return request(async () => (await apiClient.post(`/employee-portal/leaves/${leaveId}/cancel`)).data.data);
}

export function getEmployeeReceipt(salaryId) {
  return request(async () => (await apiClient.get(`/employee-portal/salary/${salaryId}/receipt`)).data.data);
}

export function getEmployeeReceiptPdf(salaryId) {
  return request(async () => {
    const response = await apiClient.get(`/employee-portal/salary/${salaryId}/receipt/pdf`, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    const disposition = String(response.headers?.["content-disposition"] || "");
    const match = /filename="([^"]+)"/.exec(disposition);
    return { filename: match?.[1] || "HelperBook_Salary_Receipt.pdf", bytes: new Uint8Array(response.data) };
  });
}

export function getEmployeeNotifications() {
  return request(async () => (await apiClient.get("/employee-portal/notifications")).data.data);
}

export function getEmployeePortalProfile() {
  return request(async () => (await apiClient.get("/employee-portal/profile")).data.data);
}

export function getEmployeePreferences() {
  return request(async () => (await apiClient.get("/employee-portal/preferences")).data.data);
}

export function saveEmployeePreferences(payload) {
  return request(async () => (await apiClient.put("/employee-portal/preferences", payload)).data.data);
}
